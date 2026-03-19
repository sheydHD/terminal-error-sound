---
layout: home
title: Home
---

# Terminal Error Sound 🔊

> A VS Code extension that plays an audible alert whenever a terminal command exits with a non-zero exit code.

[![VS Code Engine](https://img.shields.io/badge/vscode-%5E1.93.0-blue)](https://code.visualstudio.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6)](https://www.typescriptlang.org/)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Usage](#usage)
- [How It Works](#how-it-works)
- [Platform Support](#platform-support)
- [Project Structure](#project-structure)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

**Terminal Error Sound** listens to your VS Code integrated terminal and plays a sound file the moment any command returns a non-zero exit code. Stop staring at the terminal waiting for long-running builds, tests, or deployments to finish — let your ears tell you something went wrong.

A bundled default sound (`Fahhh.mp3`) is included out of the box so the extension works with zero configuration.

---

## Features

- 🔊 **Instant audio feedback** on any terminal error (exit code ≠ 0)
- 🎵 **Bring your own sound** — point it at any audio file on disk
- 🎚️ **Volume control** (0.0 – 1.0) on macOS and Linux
- ⚙️ **Configurable exit-code threshold** — only alert on severe failures
- 🔄 **Toggle on/off** from the status bar or Command Palette without reloading
- 🛡️ **Concurrent-playback guard** — skips overlapping triggers on rapid error bursts
- 🔌 **Fallback mode** — optionally fires when a terminal *window* closes with an error (for environments without Shell Integration)
- 📋 **Structured logging** in a dedicated Output Channel for easy debugging

---

## Requirements

| Requirement | Version |
|---|---|
| VS Code | ≥ 1.93 |
| Node.js (dev only) | ≥ 18 |
| npm (dev only) | ≥ 9 |

**Shell Integration must be enabled** for the primary listener to work (it is on by default in VS Code ≥ 1.93 for bash, zsh, fish, and PowerShell). See the [fallback option](#configuration) for environments where it is unavailable.

---

## Installation

### From the Marketplace *(once published)*

Search for **"Terminal Error Sound"** in the VS Code Extensions panel, or run:

```
ext install sheydHD.terminal-error-sound
```

### From a `.vsix` package

1. Build the package:
   ```bash
   npm run package
   ```
2. Install it:
   ```bash
   code --install-extension terminal-error-sound-1.0.0.vsix
   ```

---

## Quick Start

1. Install the extension (see above).
2. Open a terminal inside VS Code (`Ctrl+\`` / `Cmd+\``).
3. Run any command that fails, e.g.:
   ```bash
   exit 1
   ```
4. 🔊 You should hear the default alert sound.

No additional configuration is required for the default experience.

---

## Configuration

All settings live under the `terminalErrorSound` namespace and can be edited in **Settings** (`Ctrl+,`) or directly in `settings.json`.

| Setting | Type | Default | Description |
|---|---|---|---|
| `terminalErrorSound.enabled` | `boolean` | `true` | Master switch — enable or disable the extension. |
| `terminalErrorSound.soundFilePath` | `string` | `""` | Absolute path to a custom audio file. Leave blank to use the bundled default. |
| `terminalErrorSound.minimumExitCode` | `integer` | `1` | Only trigger the sound for exit codes **≥** this value. Raise to `2` to ignore minor errors. |
| `terminalErrorSound.volume` | `number` | `1.0` | Playback volume (`0.0` – `1.0`). Effective on macOS and Linux; ignored on Windows. |
| `terminalErrorSound.fallbackOnTerminalClose` | `boolean` | `false` | Also trigger when a terminal *closes* with a non-zero exit code. Useful when Shell Integration is unavailable. |

### Example `settings.json`

```jsonc
{
  // Use a custom WAV file
  "terminalErrorSound.soundFilePath": "C:\\Users\\you\\sounds\\error.wav",

  // Only alert on exit codes 2 and above
  "terminalErrorSound.minimumExitCode": 2,

  // 70% volume
  "terminalErrorSound.volume": 0.7
}
```

---

## Usage

### Status Bar Toggle

A **🔊 / 🔇** indicator appears in the bottom-right status bar. Click it to toggle the extension on or off globally. The change is saved to your global VS Code settings.

### Command Palette

Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) and run:

```
Terminal Error Sound: Toggle Terminal Error Sound
```

### Output Channel

All extension activity is written to a dedicated Output Channel. To view it:

1. Open the **Output** panel (`Ctrl+Shift+U`).
2. Select **Terminal Error Sound** from the dropdown.

Log entries are formatted as:

```
[2026-03-05T12:00:00.000Z] [INFO]  Extension activated.
[2026-03-05T12:00:05.123Z] [INFO]  Error detected – terminal: "bash", exit code: 127
[2026-03-05T12:00:05.130Z] [INFO]  Playing: /path/to/sound/Fahhh.mp3
```

---

## How It Works

```
Terminal command exits
        │
        ▼
onDidEndTerminalShellExecution
 (Shell Integration – primary)
        │
        ├─ exitCode undefined? ──► skip  (Ctrl+C, empty enter, etc.)
        │
        ├─ exitCode < minimumExitCode? ──► skip
        │
        └─ Trigger SoundPlayer.play()
                │
                ├─ Already playing? ──► skip (concurrent-playback guard)
                │
                └─ Build platform command
                        ├─ Windows  → PowerShell SoundPlayer / WPF MediaPlayer
                        ├─ macOS    → afplay
                        └─ Linux    → paplay → aplay → ffplay (cascade)
```

When Shell Integration is unavailable and `fallbackOnTerminalClose` is enabled, the same pipeline is triggered by `onDidCloseTerminal` instead.

---

## Platform Support

| Platform | `.wav` | `.mp3` | `.ogg` | `.aiff` | Volume control |
|---|:---:|:---:|:---:|:---:|:---:|
| **Windows** | ✅ Native | ✅ WPF | ❌ | ❌ | ❌ |
| **macOS** | ✅ afplay | ✅ afplay | ✅ afplay | ✅ afplay | ✅ |
| **Linux** | ✅ paplay/aplay | ✅ ffplay | ✅ paplay | ❌ | ✅ paplay |

> **Windows tip:** `.wav` files use the lightweight native `System.Media.SoundPlayer` and are the most reliable choice. For `.mp3`, the WPF `MediaPlayer` is used, which requires no additional software.

---

## Project Structure

```
terminal-error-sound/
├── sound/
│   └── Fahhh.mp3           # Bundled default alert sound
├── src/
│   ├── extension.ts        # Activation entry point; registers listeners & commands
│   ├── configManager.ts    # Typed wrapper around VS Code workspace configuration
│   ├── soundPlayer.ts      # Cross-platform audio playback engine
│   └── logger.ts           # Structured OutputChannel logger
├── package.json            # Extension manifest & contribution points
└── tsconfig.json           # TypeScript compiler options
```

---

## Development

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9
- VS Code ≥ 1.93

### Setup

```bash
git clone https://github.com/sheydHD/terminal-error-sound.git
cd terminal-error-sound
npm install
```

### Build

```bash
# One-time compile
npm run compile

# Watch mode (recompiles on save)
npm run watch
```

### Run & Debug

1. Open the project in VS Code.
2. Press `F5` — this launches a new **Extension Development Host** window with the extension loaded.
3. Open a terminal in the host window and run a failing command to test.

### Lint

```bash
npm run lint
```

### Package

```bash
npm run package
# Outputs: terminal-error-sound-<version>.vsix
```

---

## Contributing

Contributions are welcome. Please follow these steps:

1. **Fork** the repository and create a feature branch:
   ```bash
   git checkout -b feat/my-improvement
   ```
2. **Make your changes.** Keep commits small and focused.
3. **Lint** before pushing:
   ```bash
   npm run lint
   ```
4. **Open a Pull Request** against `main` with a clear description of the change and the problem it solves.

### Guidelines

- Follow the existing TypeScript code style (enforced by ESLint).
- Do not introduce runtime dependencies — this extension intentionally has zero `dependencies` in `package.json`.
- Test manually on the platforms affected by your change.
- Update this README if you add new settings or change behaviour.

---

## License

[MIT](LICENSE) © [Antoni Dudij](https://github.com/sheydHD)
