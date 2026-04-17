"""Terminal UI layer — all rich library usage is isolated here."""

from __future__ import annotations

import re
from pathlib import Path
from typing import Any, Callable, Optional

from rich.console import Console
from rich.panel import Panel
from rich.prompt import Confirm, Prompt
from rich.table import Table

from ai_app_icons.assets import ASSETS
from ai_app_icons.modes import DEFAULT_MODE_ID, MODES

console = Console()


# ---------------------------------------------------------------------------
# Welcome
# ---------------------------------------------------------------------------

def show_welcome() -> None:
    """Display the welcome banner."""
    console.print()
    console.print(
        Panel(
            "[bold bright_cyan]AI App Icon Generator[/]\n\n"
            "Create beautiful app icons through conversation.\n"
            "Describe your app and I'll generate the perfect icon.\n"
            "[dim]Tip: at any prompt you can type [b] to go back.[/]",
            border_style="bright_cyan",
            padding=(1, 4),
        )
    )
    console.print()


# ---------------------------------------------------------------------------
# Prompts
# ---------------------------------------------------------------------------

_SOURCE_TO_CHOICE = {"describe": "1", "upload": "2", "convert": "3"}


def prompt_source(
    default_source: Optional[str] = None,
    default_description: str = "",
) -> str:
    """Ask the user how to start.

    No back option at the source menu itself — this is the top of the stack, and
    there's nowhere above to go. Back at the description text prompt loops to
    the source menu, so the user isn't trapped after picking [1].

    Returns ``"upload"``, ``"convert"``, or the typed description string.
    """
    while True:
        console.print("[bold]How would you like to start?[/]")
        console.print("  [bright_cyan][1][/] Describe an icon to generate")
        console.print("  [bright_cyan][2][/] Upload an existing icon to refine")
        console.print("  [bright_cyan][3][/] I already have an icon \u2014 I want to generate all assets")
        console.print()

        kwargs: dict[str, Any] = {"choices": ["1", "2", "3"], "show_choices": False}
        if default_source and default_source in _SOURCE_TO_CHOICE:
            kwargs["default"] = _SOURCE_TO_CHOICE[default_source]
        choice = Prompt.ask("[bold]Choose[/]", **kwargs)

        if choice == "3":
            return "convert"
        if choice == "2":
            return "upload"

        description = _prompt_description(default_description)
        if description is None:
            continue
        return description


def _prompt_description(default: str = "") -> Optional[str]:
    """Read the icon description. Typing 'b' / 'back' returns ``None``."""
    while True:
        text_kwargs: dict[str, Any] = {}
        if default:
            text_kwargs["default"] = default
        text = Prompt.ask(
            "[bold green]Describe your app icon[/] [dim](or 'b' for back)[/]",
            **text_kwargs,
        )
        if text.strip().lower() in ("b", "back"):
            return None
        if text.strip():
            return text.strip()
        console.print("[dim]Please enter a description.[/]")


def prompt_mode(default: Optional[str] = None) -> Optional[str]:
    """Ask the user to pick a generation style mode.

    ``default`` is a mode id (e.g. ``"flat"``) — translated to the matching
    menu index so rich accepts it. Returns the mode id, ``""`` for skip,
    or ``None`` if the user chose back.
    """
    mode_ids = list(MODES.keys())
    console.print()
    console.print("[bold]Pick a style:[/]")
    for idx, mid in enumerate(mode_ids, start=1):
        mode = MODES[mid]
        default_tag = " [dim](default)[/]" if mid == DEFAULT_MODE_ID else ""
        console.print(
            f"  [bright_cyan][{idx}][/] [bold]{mode.name}[/]{default_tag} "
            f"— [dim]{mode.description}[/]"
        )
    skip_choice = str(len(mode_ids) + 1)
    back_choice = str(len(mode_ids) + 2)
    console.print(
        f"  [bright_cyan][{skip_choice}][/] [bold]Skip[/] "
        f"— [dim]No specific style, let the model decide.[/]"
    )
    console.print(f"  [bright_cyan][{back_choice}][/] [bold]Back[/]")
    console.print()

    if default and default in mode_ids:
        default_choice = str(mode_ids.index(default) + 1)
    else:
        default_choice = str(mode_ids.index(DEFAULT_MODE_ID) + 1)

    valid = [str(i) for i in range(1, len(mode_ids) + 3)]
    choice = Prompt.ask(
        "[bold]Choose[/]",
        choices=valid,
        default=default_choice,
        show_choices=False,
    )
    if choice == back_choice:
        return None
    if choice == skip_choice:
        return ""
    return mode_ids[int(choice) - 1]


def prompt_upload_path() -> Optional[Path]:
    """Ask for a path to an existing icon image. ``None`` means back."""
    while True:
        raw = Prompt.ask("[bold]Path to your icon image[/] [dim](or 'b' for back)[/]")
        if raw.strip().lower() in ("b", "back"):
            return None
        path = Path(raw.strip())
        if path.exists() and path.is_file():
            return path
        console.print(f"[red]File not found: {path}[/]")


def prompt_refinement() -> Optional[str]:
    """Ask how to refine the current icon. ``None`` means back."""
    while True:
        text = Prompt.ask("[bold yellow]How should I change it?[/] [dim](or 'b' for back)[/]")
        if text.strip().lower() in ("b", "back"):
            return None
        if text.strip():
            return text.strip()
        console.print("[dim]Please describe what to change.[/]")


def prompt_action() -> str:
    """Show post-generation menu. Returns 'accept', 'refine', 'restart', 'exit', or 'back'."""
    console.print()
    console.print("[bold]What would you like to do?[/]")
    console.print("  [bright_cyan][1][/] Looks great — pick a background")
    console.print("  [bright_cyan][2][/] Refine this icon")
    console.print("  [bright_cyan][3][/] Start over with a new description")
    console.print("  [bright_cyan][4][/] Exit")
    console.print("  [bright_cyan][5][/] Back")
    console.print()

    choices = {"1": "accept", "2": "refine", "3": "restart", "4": "exit", "5": "back"}
    choice = Prompt.ask("[bold]Choose[/]", choices=list(choices.keys()), show_choices=False)
    return choices[choice]


def prompt_background(current: Optional[dict] = None) -> Optional[dict]:
    """Prompt user to configure the background.

    ``current`` pre-selects the matching type and seeds sub-prompt defaults.
    Returns the bg_config dict, or ``None`` if the user chose back at the
    type picker (sub-prompt backs re-show the type picker, not a return).
    """
    type_to_choice = {"solid": "1", "gradient": "2", "image": "3"}
    default_choice = (
        type_to_choice.get(current.get("type")) if current else None
    )

    while True:
        console.print()
        console.print("[bold]How would you like the background?[/]")
        console.print("  [bright_cyan][1][/] Solid color")
        console.print("  [bright_cyan][2][/] Custom gradient")
        console.print("  [bright_cyan][3][/] Background image")
        console.print("  [bright_cyan][4][/] Back")
        console.print()

        kwargs: dict[str, Any] = {"choices": ["1", "2", "3", "4"], "show_choices": False}
        if default_choice:
            kwargs["default"] = default_choice
        choice = Prompt.ask("[bold]Choose[/]", **kwargs)

        if choice == "4":
            return None

        if choice == "1":
            seed = current.get("color") if current and current.get("type") == "solid" else None
            result = _prompt_solid_bg(default_color=seed)
        elif choice == "2":
            seed_colors = current.get("colors") if current and current.get("type") == "gradient" else None
            seed_dir = current.get("direction") if current and current.get("type") == "gradient" else None
            result = _prompt_gradient_bg(default_colors=seed_colors, default_direction=seed_dir)
        else:
            seed_path = current.get("path") if current and current.get("type") == "image" else None
            result = _prompt_image_bg(default_path=seed_path)

        if result is not None:
            return result
        # sub-prompt returned None → user hit back inside it; re-show the type picker
        default_choice = choice  # keep the same type highlighted


def _prompt_solid_bg(default_color: Optional[str] = None) -> Optional[dict]:
    """Prompt for a solid color background. ``None`` = back."""
    while True:
        kwargs: dict[str, Any] = {}
        if default_color:
            kwargs["default"] = default_color
        color = Prompt.ask(
            "[bold]Hex color[/] [dim](e.g. #1a1a2e, or 'b' for back)[/]",
            **kwargs,
        ).strip()
        if color.lower() in ("b", "back"):
            return None
        if re.match(r"^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$", color):
            return {"type": "solid", "color": color}
        console.print("[red]Invalid hex color. Use #RGB or #RRGGBB format.[/]")


def _prompt_gradient_bg(
    default_colors: Optional[list[str]] = None,
    default_direction: Optional[str] = None,
) -> Optional[dict]:
    """Prompt for a custom gradient background. ``None`` = back."""
    while True:
        kwargs: dict[str, Any] = {}
        if default_colors:
            kwargs["default"] = ", ".join(default_colors)
        raw = Prompt.ask(
            "[bold]Hex colors[/] [dim](comma-separated, e.g. #0f0c29, #302b63, #24243e; 'b' for back)[/]",
            **kwargs,
        )
        if raw.strip().lower() in ("b", "back"):
            return None
        colors = [c.strip() for c in raw.split(",") if c.strip()]
        if len(colors) < 2:
            console.print("[red]Need at least 2 colors.[/]")
            continue
        valid = all(re.match(r"^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$", c) for c in colors)
        if not valid:
            console.print("[red]One or more colors are invalid. Use #RGB or #RRGGBB format.[/]")
            continue
        break

    direction = Prompt.ask(
        "[dim]Gradient direction[/]",
        default=default_direction or "to-bottom",
    )
    return {"type": "gradient", "colors": colors, "direction": direction}


def _prompt_image_bg(default_path: Optional[str] = None) -> Optional[dict]:
    """Prompt for a background image path. ``None`` = back."""
    while True:
        kwargs: dict[str, Any] = {}
        if default_path:
            kwargs["default"] = default_path
        raw = Prompt.ask(
            "[bold]Path to background image[/] [dim](or 'b' for back)[/]",
            **kwargs,
        )
        if raw.strip().lower() in ("b", "back"):
            return None
        path = Path(raw.strip())
        if path.exists() and path.is_file():
            return {"type": "image", "path": str(path)}
        console.print(f"[red]File not found: {path}[/]")


def prompt_again() -> bool:
    """Ask if the user wants to create another icon."""
    console.print()
    return Confirm.ask("[bold]Create another icon?[/]", default=False)


# ---------------------------------------------------------------------------
# Progress / spinners
# ---------------------------------------------------------------------------

def run_with_spinner(message: str, task_fn: Callable[[], Any]) -> Any:
    """Run *task_fn* while showing an animated spinner. Returns the result."""
    with console.status(f"[bold bright_cyan]{message}[/]", spinner="dots"):
        return task_fn()


# ---------------------------------------------------------------------------
# Output
# ---------------------------------------------------------------------------

def show_success(message: str) -> None:
    console.print(f"[bold green] :heavy_check_mark: {message}[/]")


def show_error(message: str) -> None:
    console.print(f"[bold red] :cross_mark: {message}[/]")


def show_info(message: str) -> None:
    console.print(f"[dim]{message}[/]")


def show_asset_table(output_dir: Path) -> None:
    """Display a summary table of generated assets."""
    console.print()
    table = Table(title="Generated Assets", border_style="bright_cyan", title_style="bold")
    table.add_column("File", style="bold", justify="center")
    table.add_column("Size", justify="center")
    table.add_column("Platform", justify="center")

    for asset in ASSETS:
        w, h = asset["size"]
        platform = asset.get("platform", "")
        table.add_row(asset["name"], f"{w} x {h}", platform)

    console.print(table)
    console.print(f"\n  [dim]Saved to:[/] [bold]{output_dir}[/]\n")


def show_expo_config(config: dict) -> None:
    """Print the full Expo app.json snippet with syntax highlighting."""
    import json

    from rich.syntax import Syntax

    console.print()
    console.print("[bold]Expo Configuration[/]")
    console.print(
        Syntax(
            json.dumps(config, indent=2),
            "json",
            theme="solarized-dark",
            background_color="default",
        )
    )
    console.print("[dim]Add this to your app.json to use these assets.[/]\n")


def show_goodbye() -> None:
    console.print("\n[dim]Thanks for using AI App Icon Generator. Goodbye![/]\n")
