#!/usr/bin/env node
import { program } from 'commander';

import { terminal, terminalProvider, withPrefix } from './helpers/terminal';
import { version, run } from './executor';

export interface ICommandLineOptions {
  verbose?: boolean;
  fix?: boolean;
  file?: string[];
  to?: string[];
}

const increaseVerbosity = (u: unknown, previous: number): number => {
  return previous + 1;
};
const setLogLevel = (verbose: number): void => {
  if (verbose > 0) {
    switch (verbose) {
      case 1:
        terminalProvider.verboseEnabled = true;
        break;
      default:
        terminalProvider.verboseEnabled = true;
        terminalProvider.debugEnabled = true;
        break;
    }
  }
};

async function main(): Promise<void> {
  try {
    await program
      .version(version())
      .option('--verbose', 'Verbosity that can be increased', increaseVerbosity, 0)
      .option('--fix', 'Auto fix Git LFS status')
      .option('--file [file_path...]', 'The path of files')
      .action(async options => {
        setLogLevel(options.verbose);
        await run(options);
      })
      .parseAsync(process.argv);
  } catch (error: any) {
    if (error.message) {
      terminal.writeErrorLine(withPrefix(error.message));
    } else {
      throw error;
    }
    process.exit(1);
  }
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();
