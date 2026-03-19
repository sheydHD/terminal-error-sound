# Contributing to Terminal Error Sound

Thank you for taking the time to contribute! This document explains how to get
the project running locally, what the coding conventions are, and how to open a
pull request that will be reviewed quickly.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Commit Style](#commit-style)
- [Opening a Pull Request](#opening-a-pull-request)
- [Guidelines](#guidelines)

---

## Code of Conduct

This project follows the [Contributor Covenant](https://www.contributor-covenant.org/)
Code of Conduct. Be respectful and constructive in all interactions.

---

## Getting Started

### Prerequisites

| Tool | Minimum version |
|---|---|
| [Node.js](https://nodejs.org/) | 18 |
| npm | 9 |
| [VS Code](https://code.visualstudio.com/) | 1.93 |
| Git | 2.x |

### Fork & clone

```bash
# 1. Fork the repository on GitHub, then:
git clone https://github.com/sheydHD/terminal-error-sound.git
cd terminal-error-sound
```

### Install dependencies

```bash
npm install
```

### Recommended VS Code extensions

Open the project in VS Code and accept the prompt to install workspace
recommended extensions (`.vscode/extensions.json`), or install them manually:

- **ESLint** (`dbaeumer.vscode-eslint`)
- **Prettier** (`esbenp.prettier-vscode`)

---

## Development Workflow

### Start watch mode

```bash
npm run watch
# or press Ctrl+Shift+B in VS Code (default build task)
```

### Launch the Extension Development Host

Press **F5** (or select *Run → Start Debugging*).  
A new VS Code window opens with the extension loaded. Open a terminal and run a
failing command (e.g. `exit 1`) to trigger a sound.

### Recompile manually

```bash
npm run compile
```

### Lint

```bash
npm run lint
```

---

## Testing

Tests run inside a real VS Code instance (via `@vscode/test-electron`) so the
full VS Code API is available.

```bash
npm test
```

This will:

1. Compile the TypeScript source (including test files under `src/test/`).
2. Download a VS Code instance (cached in `.vscode-test/` after the first run).
3. Run every `*.test.js` file under `out/test/suite/` with Mocha.

### Test structure

```
src/test/
├── runTests.ts            ← entry point; launches VS Code and runs the suite
└── suite/
    ├── index.ts           ← Mocha suite loader
    ├── extension.test.ts  ← integration: activation, toggle command
    ├── configManager.test.ts ← unit: default values, volume clamping, path resolution
    ├── soundPlayer.test.ts   ← unit: guard rails, command builder, concurrency guard
    └── logger.test.ts        ← unit: log methods, dispose lifecycle
```

### Writing new tests

- Use **`suite()` / `test()` / `setup()` / `teardown()`** (Mocha TDD interface).
- Prefer `assert` from Node's built-in `node:assert` module.
- If a test needs the file system, use `this.skip()` when the required file
  is absent so the suite still passes on minimal CI images.
- Keep tests **deterministic and side-effect-free**: restore any VS Code
  settings changed during a test in a `teardown()` hook.

---

## Commit Style

This project uses [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short summary>
```

| Type | When to use |
|---|---|
| `feat` | New feature |
| `fix` | Bug fix |
| `test` | Adding or updating tests |
| `docs` | Documentation only |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `chore` | Tooling, dependency updates, CI |
| `perf` | Performance improvement |

**Examples:**

```
feat(soundPlayer): add OGG support on Windows via ffplay
fix(configManager): clamp volume correctly when value is NaN
test(soundPlayer): add concurrent-playback guard test
docs: update platform support table in README
```

---

## Opening a Pull Request

1. **Create a branch** from `main`:
   ```bash
   git checkout -b feat/my-improvement
   ```

2. **Make your changes.** Keep commits small and focused.

3. **Ensure all checks pass** locally:
   ```bash
   npm run lint
   npm test
   ```

4. **Push** your branch and open a PR against `main`.

5. **Fill in the PR template** (if present) — describe *what* changed and *why*.

---

## Guidelines

- **Zero runtime dependencies.** This extension intentionally has no entries in
  `dependencies` in `package.json`. If your change requires a library, discuss
  it in an issue first.
- **TypeScript strict mode** is enabled. Fix every compiler error; do not use
  `any` or `@ts-ignore` without a comment explaining why.
- **Cross-platform.** Any change to `soundPlayer.ts` must be tested (or at
  least manually verified) on all three platforms: Windows, macOS, and Linux.
- **Update documentation.** If you add a new setting, command, or change
  existing behaviour, update `README.md` and `CHANGELOG.md` accordingly.
- **No breaking changes to existing settings** without a major version bump and
  a migration note in `CHANGELOG.md`.
