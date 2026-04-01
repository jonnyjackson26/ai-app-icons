# AI App Icons

Generate Expo/React Native app icon assets from a single source icon with configurable backgrounds.

## Setup

```bash
python -m pip install pillow
```

## Usage

```bash
python generate_icons.py
```

Place your source icon as `icon.png` in the repo root. Output goes to `output/`.

### Options

| Flag           | Default       | Description            |
| -------------- | ------------- | ---------------------- |
| `--input`      | `icon.png`    | Source icon path       |
| `--output-dir` | `output`      | Output directory       |
| `--config`     | `config.json` | Background config file |

### Generated assets

| File                | Size      | Background  | Use                      |
| ------------------- | --------- | ----------- | ------------------------ |
| `splash.png`        | 1284x2778 | Configured  | Expo splash screen       |
| `icon.png`          | 1024x1024 | Configured  | App store icon           |
| `adaptive-icon.png` | 1024x1024 | Transparent | Android adaptive icon    |
| `favicon.png`       | 48x48     | Transparent | Web favicon              |
| `splash-icon.png`   | 1024x1024 | Transparent | Expo splash icon (no bg) |

## Configuring the background

Edit `config.json` to control the background of `splash.png` and `icon.png`. The file has one top-level key, `"background"`, with a `"type"` that determines which mode is used.

### Average color (default)

Computes the alpha-weighted average color of your icon and uses a slightly darkened version as the background.

```json
{
  "background": {
    "type": "average",
    "darken": 0.85
  }
}
```

| Field    | Required | Default | Description                                       |
| -------- | -------- | ------- | ------------------------------------------------- |
| `darken` | No       | `0.85`  | Multiplier applied to the average color (0.0-1.0) |

### Solid color

A single flat color.

```json
{
  "background": {
    "type": "solid",
    "color": "#1a1a2e"
  }
}
```

| Field   | Required | Description                     |
| ------- | -------- | ------------------------------- |
| `color` | Yes      | Hex color (`#RGB` or `#RRGGBB`) |

### Gradient

A linear gradient with two or more color stops, evenly distributed.

```json
{
  "background": {
    "type": "gradient",
    "colors": ["#0f0c29", "#302b63", "#24243e"],
    "direction": "to-bottom"
  }
}
```

| Field       | Required | Default       | Description                                |
| ----------- | -------- | ------------- | ------------------------------------------ |
| `colors`    | Yes      |               | Array of 2+ hex colors, distributed evenly |
| `direction` | No       | `"to-bottom"` | Named direction or angle in degrees        |

#### Named directions

| Value             | Angle | Description              |
| ----------------- | ----- | ------------------------ |
| `to-right`        | 0     | Left to right            |
| `to-top-right`    | 45    | Bottom-left to top-right |
| `to-top`          | 90    | Bottom to top            |
| `to-top-left`     | 135   | Bottom-right to top-left |
| `to-left`         | 180   | Right to left            |
| `to-bottom-left`  | 225   | Top-right to bottom-left |
| `to-bottom`       | 270   | Top to bottom            |
| `to-bottom-right` | 315   | Top-left to bottom-right |

You can also pass a numeric angle directly:

```json
{
  "background": {
    "type": "gradient",
    "colors": ["#ff6b6b", "#556270"],
    "direction": 45
  }
}
```

### Background image

Uses an image file, scaled to cover and center-cropped to fit each asset size.

```json
{
  "background": {
    "type": "image",
    "path": "background.png"
  }
}
```

| Field  | Required | Description                       |
| ------ | -------- | --------------------------------- |
| `path` | Yes      | Path to the background image file |

## Inspiration

- [expo-icon-generator](https://github.com/WebNaresh/expo-icon-generator)
- [expo-icon-builder](https://expo-icon-builder.com/?emoji=hugging_face)
- [Expo splash screen & app icon docs](https://docs.expo.dev/develop/user-interface/splash-screen-and-app-icon/)
- [Figma: Expo App Icon / Splash v2](https://www.figma.com/design/xwU1GutPcyGj0X5Q5Eitau/Expo-App-Icon---Splash-v2--Community---Community-?node-id=1-3040&t=JvL2pzQG06cKUhpj-0)
- https://developer.apple.com/design/human-interface-guidelines/app-icons
