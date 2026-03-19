/**
 * Unit tests for ConfigManager.
 *
 * These run inside the VS Code Extension Host so `vscode.workspace
 * .getConfiguration` is available.  No workspace folder is open, which
 * means all settings fall back to their declared defaults.
 */
import * as assert from 'assert';
import * as path from 'path';

import { ConfigManager } from '../../configManager';

// Fake extension root – only matters for the bundled-sound fallback path.
const FAKE_EXT_PATH = path.resolve(__dirname, '../../..');

suite('ConfigManager – defaults', () => {
  let config: ConfigManager;

  setup(() => {
    config = new ConfigManager(FAKE_EXT_PATH);
  });

  test('isEnabled() returns true', () => {
    assert.strictEqual(config.isEnabled(), true);
  });

  test('getMinimumExitCode() returns 1', () => {
    assert.strictEqual(config.getMinimumExitCode(), 1);
  });

  test('getVolume() returns 1.0', () => {
    assert.strictEqual(config.getVolume(), 1.0);
  });

  test('useFallbackOnTerminalClose() returns false', () => {
    assert.strictEqual(config.useFallbackOnTerminalClose(), false);
  });

  test('getSoundFilePath() returns empty string', () => {
    assert.strictEqual(config.getSoundFilePath(), '');
  });
});

suite('ConfigManager – resolved sound path', () => {
  let config: ConfigManager;

  setup(() => {
    config = new ConfigManager(FAKE_EXT_PATH);
  });

  test('falls back to bundled Fahhh.mp3 when soundFilePath is empty', () => {
    const resolved = config.getResolvedSoundFilePath();
    assert.ok(
      resolved.endsWith('Fahhh.mp3'),
      `Expected path ending with Fahhh.mp3, got: ${resolved}`
    );
  });

  test('bundled-sound path is inside the extension root', () => {
    const resolved = config.getResolvedSoundFilePath();
    assert.ok(
      resolved.startsWith(FAKE_EXT_PATH),
      `Expected path inside extension root.\n  root:     ${FAKE_EXT_PATH}\n  resolved: ${resolved}`
    );
  });
});

suite('ConfigManager – volume clamping', () => {
  let config: ConfigManager;

  setup(() => {
    config = new ConfigManager(FAKE_EXT_PATH);
  });

  test('getVolume() is always in [0.0, 1.0]', () => {
    const volume = config.getVolume();
    assert.ok(
      volume >= 0.0 && volume <= 1.0,
      `Volume ${volume} is outside the expected [0.0, 1.0] range`
    );
  });
});
