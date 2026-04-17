"""Conversation session state."""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path

from PIL import Image

from ai_app_icons.modes import DEFAULT_MODE_ID


@dataclass
class Session:
    """Mutable state for one icon-creation conversation."""

    original_description: str = ""
    mode: str = DEFAULT_MODE_ID
    current_image: Image.Image | None = None
    bg_config: dict = field(default_factory=lambda: {"type": "solid", "color": "#1a1a2e"})
    output_dir: Path = field(default_factory=lambda: Path("output"))

    @property
    def has_image(self) -> bool:
        return self.current_image is not None

    def reset(self) -> None:
        """Clear all state for a fresh start."""
        self.original_description = ""
        self.mode = DEFAULT_MODE_ID
        self.current_image = None
        self.bg_config = {"type": "solid", "color": "#1a1a2e"}
