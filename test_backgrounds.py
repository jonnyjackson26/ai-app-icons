#!/usr/bin/env python3
"""Generate test outputs for each background type to visually verify."""

import json
from pathlib import Path

from generate_icons import generate_assets

TESTS = {
    "test_auto_default": {
        "background": {"type": "auto"}
    },
    "test_auto_vertical": {
        "background": {"type": "auto", "direction": "to-bottom"}
    },
    "test_solid_dark": {
        "background": {"type": "solid", "color": "#1a1a2e"}
    },
    "test_solid_teal": {
        "background": {"type": "solid", "color": "#0d7377"}
    },
    "test_gradient_sunset": {
        "background": {
            "type": "gradient",
            "colors": ["#ee9ca7", "#ffdde1"],
            "direction": "to-bottom",
        }
    },
    "test_gradient_ocean": {
        "background": {
            "type": "gradient",
            "colors": ["#0f0c29", "#302b63", "#24243e"],
            "direction": "to-bottom-right",
        }
    },
    "test_gradient_fire": {
        "background": {
            "type": "gradient",
            "colors": ["#f12711", "#f5af19"],
            "direction": "to-right",
        }
    },
    "test_gradient_diagonal": {
        "background": {
            "type": "gradient",
            "colors": ["#6a11cb", "#2575fc"],
            "direction": 45,
        }
    },
    "test_gradient_rainbow": {
        "background": {
            "type": "gradient",
            "colors": ["#ff0000", "#ff8800", "#ffff00", "#00ff00", "#0000ff", "#8800ff"],
            "direction": "to-right",
        }
    },
    "test_image_paper": {
        "background": {"type": "image", "path": "paper.jpg"}
    },
}

ROOT = Path(__file__).parent
INPUT = ROOT / "icon.png"
CONFIG_PATH = ROOT / "config.json"

for name, config in TESTS.items():
    print(f"\n=== {name} ===")
    CONFIG_PATH.write_text(json.dumps(config, indent=2))
    out_dir = ROOT / "test_output" / name
    try:
        written = generate_assets(INPUT, out_dir, CONFIG_PATH)
        for p in written:
            print(f"  {p}")
    except Exception as e:
        print(f"  ERROR: {e}")

# Restore default config
CONFIG_PATH.write_text(json.dumps({"background": {"type": "auto"}}, indent=2) + "\n")
print("\nRestored config.json to default (auto).")
print("Done! Check test_output/ for results.")
