import * as path from 'path';

import { runTests } from '@vscode/test-electron';

/**
 * Entry point for the test runner.
 *
 * This script is compiled to `out/test/runTests.js` and executed by
 * `npm test`.  It downloads (and caches) a VS Code instance, then runs
 * every `*.test.js` file found under `out/test/suite/` inside that instance.
 */
async function main(): Promise<void> {
  try {
    // The folder that contains the extension's package.json.
    const extensionDevelopmentPath = path.resolve(__dirname, '../..');

    // The path to the compiled test suite index that Mocha will load.
    const extensionTestsPath = path.resolve(__dirname, './suite/index');

    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath,
      // Prevent other installed extensions from interfering with test results.
      launchArgs: ['--disable-extensions'],
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to run tests:', err);
    process.exit(1);
  }
}

main();
