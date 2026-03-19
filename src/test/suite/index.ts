import * as path from 'path';

import { glob } from 'glob';
import Mocha from 'mocha';

/**
 * Called by `@vscode/test-electron` after VS Code has launched.
 * Discovers all compiled `*.test.js` files under this directory and
 * hands them to Mocha for execution.
 */
export async function run(): Promise<void> {
  const mocha = new Mocha({
    ui: 'tdd',
    color: true,
    timeout: 15_000,
  });

  const testsRoot = __dirname;
  const files = await glob('**/*.test.js', { cwd: testsRoot });

  files.sort(); // deterministic order
  files.forEach(f => mocha.addFile(path.resolve(testsRoot, f)));

  return new Promise<void>((resolve, reject) => {
    mocha.run(failures => {
      if (failures > 0) {
        reject(new Error(`${failures} test(s) failed.`));
      } else {
        resolve();
      }
    });
  });
}
