"""Main conversation loop — state machine driving the chatbot."""

from __future__ import annotations

import os
from enum import Enum, auto

from dotenv import load_dotenv
from PIL import Image

from ai_app_icons.cli import ui
from ai_app_icons.assets import generate_all_assets
from ai_app_icons.session import Session
from ai_app_icons.icon_gen import edit_icon, generate_icon

load_dotenv()


class State(Enum):
    WELCOME = auto()
    DESCRIBE = auto()
    GENERATE = auto()
    REVIEW = auto()
    REFINE = auto()
    BACKGROUND = auto()
    EXPORT = auto()
    AGAIN = auto()
    EXIT = auto()


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
    state = State.WELCOME

    try:
        while state != State.EXIT:
            state = _step(state, session)
    except KeyboardInterrupt:
        ui.show_goodbye()


def _step(state: State, session: Session) -> State:
    """Execute one state transition and return the next state."""

    if state == State.WELCOME:
        ui.show_welcome()
        return State.DESCRIBE

    if state == State.DESCRIBE:
        session.reset()
        source = ui.prompt_source()
        if source == "upload":
            path = ui.prompt_upload_path()
            session.current_image = Image.open(path).convert("RGBA")
            session.original_description = f"(uploaded: {path})"
            ui.show_success(f"Loaded icon from {path}")
            return State.REVIEW
        elif source == "convert":
            path = ui.prompt_upload_path()
            session.current_image = Image.open(path).convert("RGBA")
            session.original_description = f"(convert: {path})"
            ui.show_success(f"Loaded logo from {path}")
            return State.BACKGROUND
        else:
            session.original_description = source
            session.mode = ui.prompt_mode()
            return State.GENERATE

    if state == State.GENERATE:
        return _handle_generate(session)

    if state == State.REVIEW:
        action = ui.prompt_action()
        if action == "accept":
            return State.BACKGROUND
        if action == "refine":
            return State.REFINE
        if action == "restart":
            return State.DESCRIBE
        return State.EXIT

    if state == State.REFINE:
        refinement = ui.prompt_refinement()
        return _handle_refine(session, refinement)

    if state == State.BACKGROUND:
        session.bg_config = ui.prompt_background()
        return State.EXPORT

    if state == State.EXPORT:
        return _handle_export(session)

    if state == State.AGAIN:
        if ui.prompt_again():
            return State.DESCRIBE
        return State.EXIT

    return State.EXIT


def _handle_generate(session: Session) -> State:
    """Generate a brand-new icon from the description."""
    try:
        image = ui.run_with_spinner(
            "Generating your icon...",
            lambda: generate_icon(session.original_description, mode=session.mode),
        )
        session.current_image = image
        _save_preview(session)
        return State.REVIEW

    except Exception as e:
        ui.show_error(f"Generation failed: {e}")
        ui.show_info("Let's try again.")
        return State.DESCRIBE


def _handle_refine(session: Session, instruction: str) -> State:
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
        return State.REVIEW

    except Exception as e:
        ui.show_error(f"Edit failed: {e}")
        ui.show_info("The icon was not changed. Try a different instruction.")
        return State.REVIEW


def _save_preview(session: Session) -> None:
    """Save the current image as a preview and notify the user."""
    preview_path = session.output_dir / "preview.png"
    preview_path.parent.mkdir(parents=True, exist_ok=True)
    session.current_image.save(preview_path, format="PNG")
    ui.show_success(f"Icon generated! Preview saved: {preview_path}")


def _handle_export(session: Session) -> State:
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
        ui.show_info(f"Android adaptive background color: {bg_color}")
        ui.show_info(
            'Add to your app.json:\n'
            '  "android": { "adaptiveIcon": {\n'
            f'    "foregroundImage": "./assets/adaptive-foreground.png",\n'
            f'    "backgroundColor": "{bg_color}",\n'
            f'    "monochromeImage": "./assets/adaptive-monochrome.png"\n'
            '  }}'
        )
        return State.AGAIN

    except Exception as e:
        ui.show_error(f"Asset generation failed: {e}")
        return State.AGAIN
