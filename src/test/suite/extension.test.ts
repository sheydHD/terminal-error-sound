/**
 * Integration tests for the extension activation lifecycle.
 *
 * These tests run inside a real VS Code Extension Host (launched by
 * @vscode/test-electron) so the full `vscode` API is available.
 */
import * as assert from 'assert';

import * as vscode from 'vscode';

// Keep in sync with `publisher` + `name` in package.json.
const EXTENSION_ID = 'local.terminal-error-sound';
const TOGGLE_COMMAND = 'terminalErrorSound.toggle';

suite('Extension – activation', () => {
  let ext: vscode.Extension<unknown> | undefined;

  suiteSetup(async () => {
    ext = vscode.extensions.getExtension(EXTENSION_ID);
    if (ext && !ext.isActive) {
      await ext.activate();
    }
  });

  test('extension is registered', () => {
    assert.ok(ext, `Extension "${EXTENSION_ID}" was not found`);
  });

  test('extension activates successfully', () => {
    assert.strictEqual(ext?.isActive, true, 'Extension should be active');
  });

  test('toggle command is registered', async () => {
    const all = await vscode.commands.getCommands(/* filterInternal */ true);
    assert.ok(
      all.includes(TOGGLE_COMMAND),
      `Command "${TOGGLE_COMMAND}" not found in registered commands`
    );
  });

  test('toggle command executes without throwing', async () => {
    await assert.doesNotReject(
      () => Promise.resolve(vscode.commands.executeCommand(TOGGLE_COMMAND)),
      'Toggle command should not throw'
    );
    // Restore the original state so this test is side-effect-free.
    await Promise.resolve(vscode.commands.executeCommand(TOGGLE_COMMAND));
  });
});
