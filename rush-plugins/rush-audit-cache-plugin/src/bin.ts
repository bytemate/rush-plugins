#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { program } from 'commander';

import { terminal, terminalProvider } from './helpers/terminal';
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

async function main(): Promise<void> {
  try {
    program
      .name('rush-audit-cache')
      .version(version)
      .option('-p, --project [project...]', 'package name of the target project')
      .option('-e, --exclude [exclude...]', 'exclude package from audit cache')
      .option('-a, --all', 'audit all cache configured project')
      .option(
        '-c, --parallelism [parallelism]',
        "Specifies the maximum number of concurrent processes to launch during a build. (eg. '50% | '5')"
      )
      .option('-P, --phased-commands [phasedCommands...]', 'phased commands need to be audit')
      .option('-v, --verbose [verbose]', 'set log level, default is 0, 1 for verbose, 2 for debug')
      .action(
        async (opts: {
          project: string[];
          verbose: string;
          all: boolean;
          exclude?: string[];
          parallelism?: string;
          phasedCommands?: string[];
        }) => {
          const checkAllCacheConfiguredProject: boolean = opts.all;
          const phasedCommands: string[] = opts.phasedCommands
            ? opts.phasedCommands.length
              ? opts.phasedCommands
              : ['build']
            : ['build'];
          const projectNames: string[] = [...new Set(opts.project)];
          if (checkAllCacheConfiguredProject && projectNames.length) {
            terminal.writeErrorLine(`The parameters "--all" and "--project" cannot be used together.`);
            program.help();
          }
          if (!projectNames.length && !checkAllCacheConfiguredProject) {
            terminal.writeErrorLine(`The parameters "--all" and "--project" must be passed at least one.`);
            program.help();
          }
          const verbose: number = +(opts.verbose ?? 0);
          if (verbose > 0) {
            let cliLevel: string = '';
            switch (verbose) {
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
            projectNames,
            terminal,
            checkAllCacheConfiguredProject,
            exclude: opts.exclude ?? [],
            parallelism: opts.parallelism,
            phasedCommands
          });
        }
      );
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
