import * as cp from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { Logger } from './logger';

/**
 * Minimal signature of `child_process.exec` that SoundPlayer requires.
 * Using this narrow type instead of the full overloaded signature lets
 * tests inject a lightweight stub without fighting TypeScript overloads.
 */
export type ExecFn = (
  command: string,
  options: cp.ExecOptions,
  callback: (err: cp.ExecException | null, stdout: string, stderr: string) => void
) => cp.ChildProcess;

/** Typed wrapper around `cp.exec` that satisfies the `ExecFn` signature. */
// `cp.exec` has complex overloads that TypeScript cannot narrow automatically to
// our specific string-output variant.  The cast is safe: we always pass a string
// encoding (default) and the callback receives `string` stdout/stderr at runtime.
const defaultExec: ExecFn = cp.exec as unknown as ExecFn;

/**
 * Cross-platform sound player.
 *
 * | Platform | .wav                        | .mp3 / others                    |
 * |----------|-----------------------------|----------------------------------|
 * | Windows  | System.Media.SoundPlayer    | WPF MediaPlayer (PowerShell)     |
 * | macOS    | afplay                      | afplay (supports most formats)   |
 * | Linux    | paplay → aplay → ffplay     | paplay → ffplay                  |
 *
 * The optional `exec` parameter exists for dependency injection in tests.
 * Production code always uses the default `child_process.exec`.
 */
export class SoundPlayer {
  private readonly logger: Logger;
  private readonly exec: ExecFn;
  /** Prevents overlapping playback on rapid error bursts. */
  private isPlaying = false;

  constructor(logger: Logger, exec: ExecFn = defaultExec) {
    this.logger = logger;
    this.exec = exec;
  }

  async play(filePath: string, volume: number): Promise<void> {
    if (!filePath) {
      this.logger.warn('No sound file configured. Set terminalErrorSound.soundFilePath.');
      return;
    }

    if (!fs.existsSync(filePath)) {
      this.logger.error(`Sound file not found: ${filePath}`);
      return;
    }

    if (this.isPlaying) {
      this.logger.debug('Already playing – skipping concurrent request.');
      return;
    }

    this.isPlaying = true;
    this.logger.info(`Playing: ${filePath}`);

    try {
      await this.execCommand(filePath, volume);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Playback failed: ${msg}`);
    } finally {
      this.isPlaying = false;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────

  private execCommand(filePath: string, volume: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const cmd = this.buildCommand(filePath, volume);

      if (!cmd) {
        reject(new Error(`Unsupported platform: ${os.platform()}`));
        return;
      }

      this.logger.debug(`Command: ${cmd}`);

      this.exec(cmd, { timeout: 30_000 }, (err, _stdout, stderr) => {
        if (err) {
          const detail = stderr ? ` | stderr: ${stderr.trim()}` : '';
          reject(new Error(`${err.message}${detail}`));
        } else {
          resolve();
        }
      });
    });
  }

  private buildCommand(filePath: string, volume: number): string | null {
    const platform = os.platform();
    const ext = path.extname(filePath).toLowerCase();

    switch (platform) {
      case 'win32':
        return this.windowsCommand(filePath, ext);
      case 'darwin':
        return this.macOsCommand(filePath, volume);
      case 'linux':
        return this.linuxCommand(filePath);
      default:
        return null;
    }
  }

  // ── Windows ──────────────────────────────────────────────────────────────

  private windowsCommand(filePath: string, ext: string): string {
    // Escape single quotes for PowerShell strings.
    const esc = filePath.replace(/'/g, "''");

    if (ext === '.wav') {
      // Native, synchronous, no external dependencies.
      return (
        `powershell -NonInteractive -WindowStyle Hidden -Command ` +
        `"(New-Object System.Media.SoundPlayer '${esc}').PlaySync()"`
      );
    }

    // For MP3 / other formats use WPF MediaPlayer.
    // We poll NaturalDuration so we wait exactly as long as the clip lasts.
    return (
      `powershell -NonInteractive -WindowStyle Hidden -Command ` +
      `"Add-Type -AssemblyName PresentationCore; ` +
      `$m = [System.Windows.Media.MediaPlayer]::new(); ` +
      `$m.Open([System.Uri]::new('${esc}')); ` +
      `$m.Play(); ` +
      `$t = 0; ` +
      `while (-not $m.NaturalDuration.HasTimeSpan -and $t -lt 2000) { Start-Sleep -Milliseconds 50; $t += 50 }; ` +
      `if ($m.NaturalDuration.HasTimeSpan) { ` +
      `  Start-Sleep -Milliseconds ([int]$m.NaturalDuration.TimeSpan.TotalMilliseconds + 200) ` +
      `} else { Start-Sleep -Seconds 5 }; ` +
      `$m.Close()"`
    );
  }

  // ── macOS ─────────────────────────────────────────────────────────────────

  private macOsCommand(filePath: string, volume: number): string {
    // afplay supports wav, mp3, aiff, ogg, flac, …
    const esc = filePath.replace(/'/g, "'\\''");
    return `afplay -v ${volume.toFixed(2)} '${esc}'`;
  }

  // ── Linux ─────────────────────────────────────────────────────────────────

  private linuxCommand(filePath: string): string {
    // Try paplay (PulseAudio), then aplay (ALSA wav only), then ffplay.
    const esc = filePath.replace(/'/g, "'\\''");
    return (
      `paplay '${esc}' 2>/dev/null || ` +
      `aplay '${esc}' 2>/dev/null || ` +
      `ffplay -nodisp -autoexit '${esc}' 2>/dev/null`
    );
  }
}
