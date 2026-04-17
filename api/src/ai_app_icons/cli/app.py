"""Interactive CLI — nested flow functions driving the chatbot.

The Python call stack is the back stack: `review_flow` calls `background_flow`,
which calls `export_flow`. Returning from a flow = "back" to the caller.
Intra-flow back uses `while True` + `continue` so the current menu re-shows.

Two exceptions handle non-local jumps:
    Restart       — unwind to main() and start fresh (session reset)
    ExitRequested — terminate the program
"""

from __future__ import annotations

import os

from dotenv import load_dotenv
from PIL import Image

from ai_app_icons.cli import ui
from ai_app_icons.assets import build_expo_config, generate_all_assets
from ai_app_icons.session import Session
from ai_app_icons.icon_gen import edit_icon, generate_icon

load_dotenv()


class Restart(Exception):
    """User chose to start over — reset session and re-enter describe_flow."""


class ExitRequested(Exception):
    """User chose to exit — terminate the program."""


def main() -> None:
    """Run the interactive icon-generation chatbot."""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        ui.show_error(
            "OPENAI_API_KEY is not set. "
            "Add it to a .env file or export it as an environment variable."
        )
        return

    session = Session()
    ui.show_welcome()
    try:
        while True:
            try:
                describe_flow(session)
                break  # returned normally = user is done
            except Restart:
                session.reset()
                continue
    except (ExitRequested, KeyboardInterrupt):
        pass
    ui.show_goodbye()


# ---------------------------------------------------------------------------
# Flows
# ---------------------------------------------------------------------------

def describe_flow(session: Session) -> None:
    """Top-level flow: choose a source and seed the session.

    Returning = exit. Back from any sub-prompt loops back to the source menu
    (never returns from here, since there's nowhere above to go).
    """
    while True:
        source = ui.prompt_source(
            default_source=session.last_source,
            default_description=session.original_description,
        )

        if source == "upload":
            path = ui.prompt_upload_path()
            if path is None:
                continue
            session.current_image = Image.open(path).convert("RGBA")
            session.original_description = f"(uploaded: {path})"
            session.last_source = "upload"
            ui.show_success(f"Loaded icon from {path}")
            review_flow(session)
            continue

        if source == "convert":
            path = ui.prompt_upload_path()
            if path is None:
                continue
            session.current_image = Image.open(path).convert("RGBA")
            session.original_description = f"(convert: {path})"
            session.last_source = "convert"
            ui.show_success(f"Loaded logo from {path}")
            background_flow(session)
            continue

        # describe path
        session.original_description = source
        session.last_source = "describe"
        mode = ui.prompt_mode(default=session.mode)
        if mode is None:
            continue
        session.mode = mode
        if not _generate(session):
            continue
        review_flow(session)
        continue


def review_flow(session: Session) -> None:
    """Post-generation menu. Returning = back to describe_flow."""
    while True:
        action = ui.prompt_action()
        if action == "back":
            return
        if action == "accept":
            background_flow(session)
            continue
        if action == "refine":
            refine_flow(session)
            continue
        if action == "restart":
            raise Restart()
        if action == "exit":
            raise ExitRequested()


def refine_flow(session: Session) -> None:
    """Iteratively edit the current icon. Returning = back to review."""
    while True:
        instruction = ui.prompt_refinement()
        if instruction is None:
            return
        _refine(session, instruction)


def background_flow(session: Session) -> None:
    """Pick a background and run export. Returns after export unwinds."""
    config = ui.prompt_background(current=session.bg_config)
    if config is None:
        return
    session.bg_config = config
    export_flow(session)


def export_flow(session: Session) -> None:
    """Generate all assets, then ask if the user wants to start over.

    Raises ``Restart`` if yes, ``ExitRequested`` if no. Never returns
    normally — after a successful export the user must make a choice, and
    both choices are non-local jumps (back through normal return would just
    land on the review menu, which isn't what "no, I'm done" means).
    """
    _generate_all_assets(session)
    if ui.prompt_again():
        raise Restart()
    raise ExitRequested()


# ---------------------------------------------------------------------------
# Side-effect helpers (formerly _handle_* in the old state machine)
# ---------------------------------------------------------------------------

def _generate(session: Session) -> bool:
    """Generate a brand-new icon from the description. Returns success."""
    try:
        image = ui.run_with_spinner(
            "Generating your icon...",
            lambda: generate_icon(session.original_description, mode=session.mode),
        )
        session.current_image = image
        _save_preview(session)
        return True
    except Exception as e:
        ui.show_error(f"Generation failed: {e}")
        ui.show_info("Let's try again.")
        return False


def _refine(session: Session, instruction: str) -> None:
    """Edit the current icon based on the user's instruction."""
    try:
        image, message = ui.run_with_spinner(
            "Editing your icon...",
            lambda: edit_icon(session.current_image, instruction),
        )
        session.current_image = image
        if message.strip():
            ui.show_info(message)
        _save_preview(session)
    except Exception as e:
        ui.show_error(f"Edit failed: {e}")
        ui.show_info("The icon was not changed. Try a different instruction.")


def _save_preview(session: Session) -> None:
    """Save the current image as a preview and notify the user."""
    preview_path = session.output_dir / "preview.png"
    preview_path.parent.mkdir(parents=True, exist_ok=True)
    session.current_image.save(preview_path, format="PNG")
    ui.show_success(f"Icon generated! Preview saved: {preview_path}")


def _generate_all_assets(session: Session) -> None:
    """Generate all asset sizes and display the summary."""
    try:
        _written, bg_color = ui.run_with_spinner(
            "Generating all asset sizes...",
            lambda: generate_all_assets(
                session.current_image,
                session.bg_config,
                session.output_dir,
            ),
        )
        ui.show_success("All assets generated!")
        ui.show_asset_table(session.output_dir)
        ui.show_expo_config(build_expo_config(bg_color))
    except Exception as e:
        ui.show_error(f"Asset generation failed: {e}")
