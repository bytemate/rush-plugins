#!/usr/bin/env node

import { Terminal } from "@rushstack/node-core-library";
import { program } from "commander";
import { initProject } from "./init-project";
import { getTemplatesFolderAndValidate } from "./logic/templateFolder";
import { TerminalSingleton } from "./terminal";

(async () => {
  program
    .option(
      "-a, --answer <ANSWER>",
      "Provide node-plop answers with JSON string"
    )
    .option(
      "-d, --dry-run",
      "Provide the option isDryRun in plugin context",
      false
    )
    .option(
      "-v, --verbose",
      "Enable output verbose debug purposing messages",
      false
    )
    .description("Initialize new Rush projects")
    .action(async (params) => {
      const terminal: Terminal = TerminalSingleton.getInstance(params?.verbose);
      try {
        getTemplatesFolderAndValidate();
        await initProject(params);
      } catch (error: any) {
        if (error.message) {
          terminal.writeErrorLine(error.message);
        } else {
          throw error;
        }
        process.exit(1);
      }
    });

  program.on("command:*", () => {
    console.error("undefined command", program.args.join(" "));
    process.exit(1);
  });

  await program.parseAsync(process.argv);
})().catch((e) => (e?.message ? console.error(e.message) : console.error(e)));
