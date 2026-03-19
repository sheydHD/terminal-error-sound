# Changelog

All notable changes to **Terminal Error Sound** are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

---

## [1.0.0] – 2026-03-19

### Added

- **Primary listener** using `onDidEndTerminalShellExecution` (VS Code Shell Integration ≥ 1.93) for reliable per-command exit codes.
- **Fallback listener** via `onDidCloseTerminal` (opt-in via `terminalErrorSound.fallbackOnTerminalClose`) for environments where Shell Integration is unavailable.
- **Cross-platform audio playback**:
  - Windows – `System.Media.SoundPlayer` for `.wav`; WPF `MediaPlayer` for `.mp3` and other formats.
  - macOS – `afplay` with software volume control (`-v`).
  - Linux – `paplay` → `aplay` → `ffplay` cascade; volume via `paplay --volume`.
- **Bundled default alert sound** (`sound/Fahhh.mp3`) – works out of the box with zero configuration.
- **Status bar toggle** (🔊 / 🔇) with global settings persistence (`vscode.ConfigurationTarget.Global`).
- **Command Palette command**: `Terminal Error Sound: Toggle Terminal Error Sound`.
- **Configurable settings**: `enabled`, `soundFilePath`, `minimumExitCode`, `volume`, `fallbackOnTerminalClose`.
- **Concurrent-playback guard** – subsequent trigger events are silently dropped while audio is already playing, preventing overlapping sounds on rapid error bursts.
- **Structured OutputChannel logger** with ISO 8601 timestamps and log levels (`DEBUG` / `INFO` / `WARN` / `ERROR`).
- Full test suite (`@vscode/test-electron` + Mocha) covering extension activation, config defaults, sound player guard rails, and logger lifecycle.
- GitHub Actions CI pipeline running lint, compile, and tests on Ubuntu, Windows, and macOS.
