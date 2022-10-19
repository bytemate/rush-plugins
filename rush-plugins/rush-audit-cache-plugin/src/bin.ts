#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { program } from 'commander';

import { terminal, terminalProvider } from "./helpers/terminal";
import { JsonObject } from '@rushstack/node-core-library';
import { auditCache } from './auditCache';

let version: string = '';
try {
  const pkgJson: JsonObject = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf8'));
  ({ version } = pkgJson);
} catch {
  // no-catch
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();

function increaseVerbosity(u: unknown, previous: number): number {
  return previous + 1;
}

async function main(): Promise<void> {
  try {
    program
      .name('rush-audit-cache')
      .version(version)
      .option('-p, --project <project>', 'package name of the target project')
      .option('-v, --verbose', 'verbosity that can be increased', increaseVerbosity, 0)
      .action(async (opts: { project: string; verbose: number }) => {
        const projectName: string = opts.project;
        if (!projectName) {
          terminal.writeErrorLine('--project parameter is required');
          program.help();
        }
        if (opts.verbose > 0) {
          let cliLevel: string = '';
          switch (opts.verbose) {
            case 1:
              cliLevel = 'verbose';
              terminalProvider.verboseEnabled = true;
              break;
            default:
              cliLevel = 'debug';
              terminalProvider.verboseEnabled = true;
              terminalProvider.debugEnabled = true;
              break;
          }
          console.log(`Log level set to ${cliLevel} by CLI`);
        }
        await auditCache({
          projectName,
          terminal,
        });
      });
    await program.parseAsync(process.argv);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (error.message) {
      terminal.writeErrorLine(error.message);
    } else {
      throw error;
    }
    process.exit(1);
  }
}

