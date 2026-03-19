import * as path from 'path';
import * as vscode from 'vscode';

const CONFIG_SECTION = 'terminalErrorSound';

/** Typed wrapper around VS Code workspace configuration for this extension. */
export class ConfigManager {
  constructor(private readonly extensionPath: string) {}

  private get cfg(): vscode.WorkspaceConfiguration {
    return vscode.workspace.getConfiguration(CONFIG_SECTION);
  }

  isEnabled(): boolean {
    return this.cfg.get<boolean>('enabled', true);
  }

  getSoundFilePath(): string {
    return this.cfg.get<string>('soundFilePath', '').trim();
  }

  /**
   * Returns the user-configured path if set, otherwise the bundled
   * sound/Fahhh.mp3 that ships with the extension.
   */
  getResolvedSoundFilePath(): string {
    const configured = this.getSoundFilePath();
    return configured || path.join(this.extensionPath, 'sound', 'Fahhh.mp3');
  }

  getMinimumExitCode(): number {
    return this.cfg.get<number>('minimumExitCode', 1);
  }

  /** Clamped to [0.0, 1.0]. */
  getVolume(): number {
    const raw = this.cfg.get<number>('volume', 1.0);
    return Math.min(1.0, Math.max(0.0, raw));
  }

  useFallbackOnTerminalClose(): boolean {
    return this.cfg.get<boolean>('fallbackOnTerminalClose', false);
  }
}
