import * as vscode from 'vscode';

import { ConfigManager } from './configManager';
import { Logger } from './logger';
import { SoundPlayer } from './soundPlayer';

export function activate(context: vscode.ExtensionContext): void {
  const logger = new Logger('Terminal Error Sound');
  const config = new ConfigManager(context.extensionPath);
  const player = new SoundPlayer(logger);

  logger.info('Extension activated.');

  // ── Status bar item ───────────────────────────────────────────────────────
  const statusBar = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  statusBar.command = 'terminalErrorSound.toggle';
  statusBar.tooltip = 'Click to toggle Terminal Error Sound on/off';
  updateStatusBar(statusBar, config);
  statusBar.show();

  // ── Toggle command ─────────────────────────────────────────────────────────
  const toggleCommand = vscode.commands.registerCommand(
    'terminalErrorSound.toggle',
    async () => {
      const current = config.isEnabled();
      await vscode.workspace
        .getConfiguration('terminalErrorSound')
        .update('enabled', !current, vscode.ConfigurationTarget.Global);
      updateStatusBar(statusBar, config);
      vscode.window.setStatusBarMessage(
        `Terminal Error Sound: ${!current ? '🔊 ON' : '🔇 OFF'}`,
        3000
      );
      logger.info(`Toggled to: ${!current ? 'enabled' : 'disabled'}`);
    }
  );

  context.subscriptions.push(statusBar, toggleCommand);

  // ── Primary listener: Shell Integration (VS Code ≥ 1.93) ──────────────────
  //
  // onDidEndTerminalShellExecution fires after every command that runs inside
  // a shell-integration-aware terminal.  It provides a reliable exit code.
  const shellExecListener = vscode.window.onDidEndTerminalShellExecution(
    (event: vscode.TerminalShellExecutionEndEvent) => {
      if (!config.isEnabled()) {
        return;
      }

      const { exitCode, terminal } = event;

      // exitCode === undefined means shell integration couldn't determine it
      // (ctrl+c, sub-shell, empty enter).  We treat that as "not an error".
      if (exitCode === undefined || exitCode < config.getMinimumExitCode()) {
        return;
      }

      logger.info(
        `Error detected – terminal: "${terminal.name}", exit code: ${exitCode}`
      );

      triggerSound(config, player, logger);
    }
  );

  // ── Fallback listener: onDidCloseTerminal ─────────────────────────────────
  //
  // Fires when the terminal process itself exits (window closed, shell exited).
  // Opt-in only; avoids double-triggering when Shell Integration is active.
  const terminalCloseListener = vscode.window.onDidCloseTerminal(
    (terminal: vscode.Terminal) => {
      if (!config.isEnabled() || !config.useFallbackOnTerminalClose()) {
        return;
      }

      const exitCode = terminal.exitStatus?.code;

      if (exitCode === undefined || exitCode < config.getMinimumExitCode()) {
        return;
      }

      logger.info(
        `Terminal closed with error – terminal: "${terminal.name}", exit code: ${exitCode}`
      );

      triggerSound(config, player, logger);
    }
  );

  context.subscriptions.push(shellExecListener, terminalCloseListener, logger);
}

export function deactivate(): void {
  // Cleanup is handled automatically via context.subscriptions.
}

// ─────────────────────────────────────────────────────────────────────────────

function updateStatusBar(
  statusBar: vscode.StatusBarItem,
  config: ConfigManager
): void {
  if (config.isEnabled()) {
    statusBar.text = '$(unmute) Error Sound';
    statusBar.backgroundColor = undefined;
  } else {
    statusBar.text = '$(mute) Error Sound';
    statusBar.backgroundColor = new vscode.ThemeColor(
      'statusBarItem.warningBackground'
    );
  }
}

function triggerSound(
  config: ConfigManager,
  player: SoundPlayer,
  logger: Logger
): void {
  const soundPath = config.getResolvedSoundFilePath();

  player.play(soundPath, config.getVolume()).catch((err: unknown) => {
    logger.error(String(err));
  });
}
