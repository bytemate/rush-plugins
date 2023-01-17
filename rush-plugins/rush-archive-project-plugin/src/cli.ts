#!/usr/bin/env node

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import {
  Colors,
  Terminal,
  ConsoleTerminalProvider,
} from "@rushstack/node-core-library";
import { promptRushUpdate } from "./logic/promptRushUpdate";

const terminal: Terminal = new Terminal(new ConsoleTerminalProvider());

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
          .option("gitCheckpoint", {
            type: "boolean",
            describe: "Create a git checkpoint before archival"
          })
          .default('gitCheckpoint', true)
          .demandOption(["packageName", "gitCheckpoint"]);
      },
      async (argv) => {
        const { archive } = await import("./commands/archive");
        try {
          await archive(argv);
          await promptRushUpdate({
            terminal,
          });
          terminal.writeLine(Colors.green("Archive ALL DONE!"));
        } catch (e: any) {
          terminal.writeErrorLine(`Archive FAILED: ${e.message}`);
          process.exit(1);
        }
      }
    )
    .command(
      "unarchive",
      "Unarchive a project",
      (yargs) => {
        return yargs
          .option("packageName", {
            type: "string",
            describe: "The name of the package to unarchive",
          })
          .demandOption(["packageName"]);
      },
      async (argv) => {
        const { unarchive } = await import("./commands/unarchive");
        try {
          await unarchive(argv);
          await promptRushUpdate({
            terminal
          });
          terminal.writeLine(Colors.green("Unarchive ALL DONE!"));
        } catch (e: any) {
          terminal.writeErrorLine(`Unarchive FAILED: ${e.message}`);
          process.exit(1);
        }
      }
    )
    .demandCommand(1, "You need at least one command before moving on")
    .parse();
}
