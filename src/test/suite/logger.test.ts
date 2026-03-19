/**
 * Unit tests for Logger.
 *
 * Logger wraps `vscode.OutputChannel`, which is available inside the
 * Extension Host.  These tests verify that every public method completes
 * without throwing and that the channel is cleaned up properly.
 */
import * as assert from 'assert';

import { Logger } from '../../logger';

suite('Logger – public API', () => {
  let logger: Logger;

  setup(() => {
    logger = new Logger('Test – Logger Suite');
  });

  teardown(() => {
    // dispose() must always be called, even if a test fails.
    logger.dispose();
  });

  test('constructs without throwing', () => {
    assert.ok(logger instanceof Logger);
  });

  test('info() does not throw', () => {
    assert.doesNotThrow(() => logger.info('info message'));
  });

  test('warn() does not throw', () => {
    assert.doesNotThrow(() => logger.warn('warn message'));
  });

  test('error() does not throw', () => {
    assert.doesNotThrow(() => logger.error('error message'));
  });

  test('debug() does not throw', () => {
    assert.doesNotThrow(() => logger.debug('debug message'));
  });

  test('dispose() does not throw', () => {
    // A fresh instance so the teardown() dispose() call does not double-dispose.
    const fresh = new Logger('Disposable Test Logger');
    assert.doesNotThrow(() => fresh.dispose());
  });

  test('calling methods after dispose() does not throw', () => {
    const fresh = new Logger('Post-Dispose Logger');
    fresh.dispose();
    // VS Code's OutputChannel ignores writes after disposal; we must not crash.
    assert.doesNotThrow(() => {
      fresh.info('after dispose info');
      fresh.warn('after dispose warn');
      fresh.error('after dispose error');
      fresh.debug('after dispose debug');
    });
  });
});
