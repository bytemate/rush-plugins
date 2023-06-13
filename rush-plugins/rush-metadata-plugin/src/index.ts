#!/usr/bin/env node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();

async function main(): Promise<void> {
  await yargs(hideBin(process.argv))
    .command(
      "meta",
      "Add metadata to a project",
      (yargs) => {
        return yargs
          .option("package", {
            type: "string",
            describe: "The name of the package to archive",
          })
          .demandOption(["project"]);
      },
      async (argv) => {
        const { fillMeta } = await import("./fillMeta");
        try {
          await fillMeta(argv);
        } catch (e: any) {
          console.error('error: ', e);
          process.exit(1);
        }
      }
    )
    .demandCommand(1, "You need at least one command before moving on")
    .parse();
}