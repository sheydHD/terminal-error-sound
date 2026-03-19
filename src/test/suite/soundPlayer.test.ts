/**
 * Unit tests for SoundPlayer.
 *
 * `child_process.exec` is replaced with a lightweight stub so no audio
 * device is required and tests complete instantly on any platform,
 * including headless CI runners.
 */
import * as assert from 'assert';
import * as cp from 'child_process';
import * as os from 'os';
import * as path from 'path';

import { Logger } from '../../logger';
import { ExecFn, SoundPlayer } from '../../soundPlayer';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeSuccessExec(): { exec: ExecFn; calls: string[] } {
  const calls: string[] = [];
  const exec: ExecFn = (cmd, _opts, cb) => {
    calls.push(cmd);
    // Resolve on the next tick, mimicking async I/O.
    setImmediate(() => cb(null, '', ''));
    return {} as cp.ChildProcess;
  };
  return { exec, calls };
}

function makeFailingExec(message: string): ExecFn {
  return (_cmd, _opts, cb) => {
    const err = Object.assign(new Error(message), { code: 1 }) as cp.ExecException;
    setImmediate(() => cb(err, '', 'some stderr'));
    return {} as cp.ChildProcess;
  };
}

// Path to the real bundled sound so "file exists" checks pass.
const BUNDLED_SOUND = path.resolve(__dirname, '../../../sound/Fahhh.mp3');

// ─── Tests ────────────────────────────────────────────────────────────────────

suite('SoundPlayer – guard rails', () => {
  let logger: Logger;

  setup(() => {
    logger = new Logger('SoundPlayer Test');
  });

  teardown(() => {
    logger.dispose();
  });

  test('play() resolves silently when filePath is empty', async () => {
    const { exec } = makeSuccessExec();
    const player = new SoundPlayer(logger, exec);
    await assert.doesNotReject(() => player.play('', 1.0));
  });

  test('play() resolves silently when file does not exist', async () => {
    const { exec } = makeSuccessExec();
    const player = new SoundPlayer(logger, exec);
    await assert.doesNotReject(() =>
      player.play('/does/not/exist/sound.wav', 1.0)
    );
  });

  test('exec is NOT called when filePath is empty', async () => {
    const { exec, calls } = makeSuccessExec();
    const player = new SoundPlayer(logger, exec);
    await player.play('', 1.0);
    assert.strictEqual(calls.length, 0, 'exec should not be called');
  });

  test('exec is NOT called when file is missing', async () => {
    const { exec, calls } = makeSuccessExec();
    const player = new SoundPlayer(logger, exec);
    await player.play('/does/not/exist/sound.wav', 1.0);
    assert.strictEqual(calls.length, 0, 'exec should not be called');
  });
});

suite('SoundPlayer – playback', () => {
  let logger: Logger;

  setup(() => {
    logger = new Logger('SoundPlayer Test');
  });

  teardown(() => {
    logger.dispose();
  });

  test('play() calls exec once for an existing file', async function () {
    // Skip if the bundled sound was not packaged (e.g. in some CI setups).
    const fs = await import('fs');
    if (!fs.existsSync(BUNDLED_SOUND)) {
      this.skip();
      return;
    }

    const { exec, calls } = makeSuccessExec();
    const player = new SoundPlayer(logger, exec);
    await player.play(BUNDLED_SOUND, 1.0);
    assert.strictEqual(calls.length, 1, 'exec should be called exactly once');
  });

  test('play() resolves even when exec reports an error', async function () {
    const fs = await import('fs');
    if (!fs.existsSync(BUNDLED_SOUND)) {
      this.skip();
      return;
    }

    const player = new SoundPlayer(logger, makeFailingExec('audio device not found'));
    // SoundPlayer must not re-throw – it logs the error instead.
    await assert.doesNotReject(() => player.play(BUNDLED_SOUND, 1.0));
  });
});

suite('SoundPlayer – concurrent-playback guard', () => {
  let logger: Logger;

  setup(() => {
    logger = new Logger('SoundPlayer Test');
  });

  teardown(() => {
    logger.dispose();
  });

  test('second play() call is skipped while first is in progress', async function () {
    const fs = await import('fs');
    if (!fs.existsSync(BUNDLED_SOUND)) {
      this.skip();
      return;
    }

    const calls: string[] = [];
    // Slow exec: resolves after 100 ms so the second call overlaps.
    const slowExec: ExecFn = (cmd, _opts, cb) => {
      calls.push(cmd);
      setTimeout(() => cb(null, '', ''), 100);
      return {} as cp.ChildProcess;
    };

    const player = new SoundPlayer(logger, slowExec);
    // Fire both calls concurrently.
    await Promise.all([
      player.play(BUNDLED_SOUND, 1.0),
      player.play(BUNDLED_SOUND, 1.0),
    ]);

    assert.strictEqual(
      calls.length,
      1,
      'Only the first call should invoke exec; the second must be dropped'
    );
  });
});

suite('SoundPlayer – command builder (platform parity)', () => {
  let logger: Logger;

  setup(() => {
    logger = new Logger('SoundPlayer Test');
  });

  teardown(() => {
    logger.dispose();
  });

  // Verify the generated shell command contains at least the file path so we
  // know the correct branch was selected.  We only run the branch that matches
  // the current platform to keep tests deterministic.
  test('generated command references the sound-file path', async function () {
    const fs = await import('fs');
    if (!fs.existsSync(BUNDLED_SOUND)) {
      this.skip();
      return;
    }

    const calls: string[] = [];
    const capturingExec: ExecFn = (cmd, _opts, cb) => {
      calls.push(cmd);
      setImmediate(() => cb(null, '', ''));
      return {} as cp.ChildProcess;
    };

    const player = new SoundPlayer(logger, capturingExec);
    await player.play(BUNDLED_SOUND, 0.8);

    assert.strictEqual(calls.length, 1);
    // The command must reference the sound file in some form.
    assert.ok(
      calls[0].includes('Fahhh') || calls[0].includes('sound'),
      `Command did not reference the sound file.\nGot: ${calls[0]}`
    );

    // Platform-specific sanity checks.
    const platform = os.platform();
    if (platform === 'win32') {
      assert.ok(calls[0].includes('powershell'), 'Windows command should use powershell');
    } else if (platform === 'darwin') {
      assert.ok(calls[0].includes('afplay'), 'macOS command should use afplay');
    } else if (platform === 'linux') {
      assert.ok(calls[0].includes('paplay'), 'Linux command should start with paplay');
    }
  });
});
