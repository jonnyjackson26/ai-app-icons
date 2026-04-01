"""Main conversation loop — state machine driving the chatbot."""

from __future__ import annotations

import os
from enum import Enum, auto

from dotenv import load_dotenv
from openai import OpenAI

from cli import ui
from cli.assets import generate_all_assets
from cli.session import Session
from icon_gen import generate_icon

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

    client = OpenAI(api_key=api_key)
    session = Session()
    state = State.WELCOME

    try:
        while state != State.EXIT:
            state = _step(state, session, client)
    except KeyboardInterrupt:
        ui.show_goodbye()


def _step(state: State, session: Session, client: OpenAI) -> State:
    """Execute one state transition and return the next state."""

    if state == State.WELCOME:
        ui.show_welcome()
        return State.DESCRIBE

    if state == State.DESCRIBE:
        session.reset()
        description = ui.prompt_description()
        session.add_description(description)
        return State.GENERATE

    if state == State.GENERATE:
        return _handle_generate(session, client)

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
        session.add_description(refinement)
        return State.GENERATE

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


def _handle_generate(session: Session, client: OpenAI) -> State:
    """Build the prompt, generate the icon, and save a preview."""
    try:
        # Build (or refine) the prompt
        if len(session.description_history) > 1:
            prompt = ui.run_with_spinner(
                "Refining your description...",
                lambda: session.build_refined_prompt(client),
            )
            ui.show_refined_prompt(prompt)
        else:
            prompt = session.build_refined_prompt(client)

        # Generate the icon
        image = ui.run_with_spinner(
            "Generating your icon...",
            lambda: generate_icon(prompt),
        )
        session.current_image = image

        preview_path = session.output_dir / "preview.png"
        preview_path.parent.mkdir(parents=True, exist_ok=True)
        image.save(preview_path, format="PNG")

        ui.show_success(f"Icon generated! Preview saved: {preview_path}")
        return State.REVIEW

    except Exception as e:
        ui.show_error(f"Generation failed: {e}")
        ui.show_info("Let's try again.")
        return State.DESCRIBE


def _handle_export(session: Session) -> State:
    """Generate all asset sizes and display the summary."""
    try:
        paths = ui.run_with_spinner(
            "Generating all asset sizes...",
            lambda: generate_all_assets(
                session.current_image,
                session.bg_config,
                session.output_dir,
            ),
        )
        ui.show_success("All assets generated!")
        ui.show_asset_table(session.output_dir)
        return State.AGAIN

    except Exception as e:
        ui.show_error(f"Asset generation failed: {e}")
        return State.AGAIN
