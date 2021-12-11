#!/usr/bin/env node

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { archive } from "./commands/archive";

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();

async function main(): Promise<void> {
  await yargs(hideBin(process.argv))
    .command(
      "archive",
      "Archive a project",
      (yargs) => {
        return yargs
          .option("packageName", {
            type: "string",
            describe: "The name of the package to archive",
          })
          .demandOption(["packageName"]);
      },
      async (argv) => {
        await archive(argv);
        console.log("Archive ALL DONE!");
      }
    )
    .demandCommand(1, "You need at least one command before moving on")
    .parse();
}
