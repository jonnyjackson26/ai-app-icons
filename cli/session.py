"""Conversation session state and prompt refinement."""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path

from openai import OpenAI
from PIL import Image

_REFINE_SYSTEM_PROMPT = """\
You are a prompt-engineering assistant. Your job is to merge an original app \
icon description with subsequent refinement requests into a single, clear, \
self-contained description.

Rules:
- Output ONLY the merged description, nothing else.
- Keep it concise (2-3 sentences max).
- If refinements contradict earlier requests, the latest refinement wins.
- Preserve any details from the original that weren't overridden.
"""


@dataclass
class Session:
    """Mutable state for one icon-creation conversation."""

    description_history: list[str] = field(default_factory=list)
    current_prompt: str = ""
    current_image: Image.Image | None = None
    bg_config: dict = field(default_factory=lambda: {"type": "auto"})
    output_dir: Path = field(default_factory=lambda: Path("output"))

    def reset(self) -> None:
        """Clear all state for a fresh start."""
        self.description_history.clear()
        self.current_prompt = ""
        self.current_image = None
        self.bg_config = {"type": "auto"}

    def add_description(self, text: str) -> None:
        """Append a description or refinement to the history."""
        self.description_history.append(text)

    def build_refined_prompt(self, client: OpenAI) -> str:
        """Merge description history into a single prompt.

        First description is used directly. Subsequent refinements are merged
        using GPT-4o-mini to produce one clean, self-contained description.
        """
        if not self.description_history:
            raise ValueError("No descriptions to build a prompt from")

        if len(self.description_history) == 1:
            self.current_prompt = self.description_history[0]
            return self.current_prompt

        original = self.description_history[0]
        refinements = self.description_history[1:]

        user_message = (
            f"Original description: {original}\n\n"
            f"Refinements:\n"
            + "\n".join(f"- {r}" for r in refinements)
        )

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": _REFINE_SYSTEM_PROMPT},
                {"role": "user", "content": user_message},
            ],
            max_tokens=200,
        )
        self.current_prompt = response.choices[0].message.content.strip()
        return self.current_prompt
