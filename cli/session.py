"""Conversation session state."""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path

from PIL import Image


@dataclass
class Session:
    """Mutable state for one icon-creation conversation."""

    original_description: str = ""
    current_image: Image.Image | None = None
    bg_config: dict = field(default_factory=lambda: {"type": "auto"})
    output_dir: Path = field(default_factory=lambda: Path("output"))

    @property
    def has_image(self) -> bool:
        return self.current_image is not None

    def reset(self) -> None:
        """Clear all state for a fresh start."""
        self.original_description = ""
        self.current_image = None
        self.bg_config = {"type": "auto"}
