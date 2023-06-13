#!/usr/bin/env node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();

async function main(): Promise<void> {
  console.log('argv: ', process.argv);
  await yargs(hideBin(process.argv))
    .command(
      'init',
      'Add metadata to a project',
      (yargs) => {
        return yargs
          .option('project', {
            type: 'string',
            describe: 'The name of the package to archive'
          })
          .demandOption(['project']);
      },
      async (argv) => {
        console.log('ARGUMENTS: ', argv);
        const { initMeta } = await import('./initMeta');
        try {
          await initMeta(argv);
        } catch (e: any) {
          console.error('error: ', e);
          process.exit(1);
        }
      }
    )
    .command('sync', 'Sync the metadata in the monorepo.', async () => {
      const { syncMeta } = await import('./syncMeta');
      try {
        await syncMeta();
      } catch (e: any) {
        console.error('error: ', e);
        process.exit(1);
      }
    })
    .demandCommand(1, 'You need at least one command before moving on')
    .parse();
}
