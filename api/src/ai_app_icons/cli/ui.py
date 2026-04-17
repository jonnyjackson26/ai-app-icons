"""Terminal UI layer — all rich library usage is isolated here."""

from __future__ import annotations

import re
from pathlib import Path
from typing import Any, Callable

from rich.console import Console
from rich.panel import Panel
from rich.prompt import Confirm, IntPrompt, Prompt
from rich.table import Table
from rich.text import Text

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
            "Describe your app and I'll generate the perfect icon.",
            border_style="bright_cyan",
            padding=(1, 4),
        )
    )
    console.print()


# ---------------------------------------------------------------------------
# Prompts
# ---------------------------------------------------------------------------

def prompt_source() -> str:
    """Ask the user to describe their icon or upload one.

    Returns the description string, or the literal "upload" to signal file upload.
    """
    console.print("[bold]How would you like to start?[/]")
    console.print("  [bright_cyan][1][/] Describe an icon to generate")
    console.print("  [bright_cyan][2][/] Upload an existing icon to refine")
    console.print("  [bright_cyan][3][/] Upload a PNG logo and generate all assets")
    console.print()

    choice = Prompt.ask("[bold]Choose[/]", choices=["1", "2", "3"], show_choices=False)

    if choice == "3":
        return "convert"
    if choice == "2":
        return "upload"

    while True:
        text = Prompt.ask("[bold green]Describe your app icon[/]")
        if text.strip():
            return text.strip()
        console.print("[dim]Please enter a description.[/]")


def prompt_mode() -> str:
    """Ask the user to pick a generation style mode.

    Returns the mode id, or an empty string for 'skip' (let the model decide).
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
    console.print(
        f"  [bright_cyan][{skip_choice}][/] [bold]Skip[/] "
        f"— [dim]No specific style, let the model decide.[/]"
    )
    console.print()

    default_choice = str(mode_ids.index(DEFAULT_MODE_ID) + 1)
    choice = Prompt.ask(
        "[bold]Choose[/]",
        choices=[str(i) for i in range(1, len(mode_ids) + 2)],
        default=default_choice,
        show_choices=False,
    )
    if choice == skip_choice:
        return ""
    return mode_ids[int(choice) - 1]


def prompt_upload_path() -> Path:
    """Ask for a path to an existing icon image."""
    while True:
        raw = Prompt.ask("[bold]Path to your icon image[/]")
        path = Path(raw.strip())
        if path.exists() and path.is_file():
            return path
        console.print(f"[red]File not found: {path}[/]")


def prompt_refinement() -> str:
    """Ask how to refine the current icon."""
    while True:
        text = Prompt.ask("[bold yellow]How should I change it?[/]")
        if text.strip():
            return text.strip()
        console.print("[dim]Please describe what to change.[/]")


def prompt_action() -> str:
    """Show post-generation menu. Returns 'accept', 'refine', 'restart', or 'exit'."""
    console.print()
    console.print("[bold]What would you like to do?[/]")
    console.print("  [bright_cyan][1][/] Looks great — pick a background")
    console.print("  [bright_cyan][2][/] Refine this icon")
    console.print("  [bright_cyan][3][/] Start over with a new description")
    console.print("  [bright_cyan][4][/] Exit")
    console.print()

    choices = {"1": "accept", "2": "refine", "3": "restart", "4": "exit"}
    while True:
        choice = Prompt.ask("[bold]Choose[/]", choices=list(choices.keys()), show_choices=False)
        return choices[choice]


def prompt_background() -> dict:
    """Prompt user to configure the background. Returns a bg_config dict."""
    console.print()
    console.print("[bold]How would you like the background?[/]")
    console.print("  [bright_cyan][1][/] Solid color")
    console.print("  [bright_cyan][2][/] Custom gradient")
    console.print("  [bright_cyan][3][/] Background image")
    console.print()

    choice = Prompt.ask("[bold]Choose[/]", choices=["1", "2", "3"], show_choices=False)

    if choice == "1":
        return _prompt_solid_bg()
    elif choice == "2":
        return _prompt_gradient_bg()
    else:
        return _prompt_image_bg()


def _prompt_solid_bg() -> dict:
    """Prompt for a solid color background."""
    while True:
        color = Prompt.ask("[bold]Hex color[/] [dim](e.g. #1a1a2e)[/]")
        color = color.strip()
        if re.match(r"^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$", color):
            return {"type": "solid", "color": color}
        console.print("[red]Invalid hex color. Use #RGB or #RRGGBB format.[/]")


def _prompt_gradient_bg() -> dict:
    """Prompt for a custom gradient background."""
    while True:
        raw = Prompt.ask("[bold]Hex colors[/] [dim](comma-separated, e.g. #0f0c29, #302b63, #24243e)[/]")
        colors = [c.strip() for c in raw.split(",") if c.strip()]
        if len(colors) < 2:
            console.print("[red]Need at least 2 colors.[/]")
            continue
        valid = all(re.match(r"^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$", c) for c in colors)
        if not valid:
            console.print("[red]One or more colors are invalid. Use #RGB or #RRGGBB format.[/]")
            continue
        break

    direction = Prompt.ask("[dim]Gradient direction[/]", default="to-bottom")
    return {"type": "gradient", "colors": colors, "direction": direction}


def _prompt_image_bg() -> dict:
    """Prompt for a background image path."""
    while True:
        raw = Prompt.ask("[bold]Path to background image[/]")
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
    table.add_column("File", style="bold")
    table.add_column("Size", justify="right")
    table.add_column("Platform", justify="center")
    table.add_column("Background", justify="center")

    for asset in ASSETS:
        w, h = asset["size"]
        bg = "[green]yes[/]" if asset["has_background"] else "[dim]transparent[/]"
        platform = asset.get("platform", "")
        table.add_row(asset["name"], f"{w} x {h}", platform, bg)

    console.print(table)
    console.print(f"\n  [dim]Saved to:[/] [bold]{output_dir}[/]\n")


def show_goodbye() -> None:
    console.print("\n[dim]Thanks for using AI App Icon Generator. Goodbye![/]\n")
