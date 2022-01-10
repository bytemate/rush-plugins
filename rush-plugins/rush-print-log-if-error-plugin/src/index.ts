#!/usr/bin/env node

import path from "path";
import fs from "fs";
import readline from "readline";

import { loadRushConfiguration } from "./helpers/loadRushConfiguration";
import { terminal } from "./helpers/terminal";

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();

async function main(): Promise<void> {
  try {
    const rushConfig = loadRushConfiguration();

    const packageNameParser = rushConfig.packageNameParser;
    let hasPrint = false;
    for (const project of rushConfig.projects) {
      const folder = project.projectFolder;
      const unscopedProjectName = packageNameParser.getUnscopedName(
        project.packageName
      );
      const buildLogPath = path.resolve(
        folder,
        `${unscopedProjectName}.build.log`
      );
      const buildErrorLogPath = path.resolve(
        folder,
        `${unscopedProjectName}.build.error.log`
      );
      if (fs.existsSync(buildErrorLogPath) && fs.existsSync(buildLogPath)) {
        const readStream = fs.createReadStream(buildLogPath);
        console.log(`========== ${project.packageName} BEGIN ==========`);
        const rl = readline.createInterface({
          input: readStream,
          output: process.stdout,
        });
        let resolve: () => void = null as unknown as () => void;
        const p = new Promise<void>((_resolve) => {
          const timeoutId = setTimeout(() => {
            console.log(`========== ${project.packageName} TIMEOUT ==========`);
            _resolve();
          }, 60 * 1000);
          resolve = () => {
            clearTimeout(timeoutId);
            _resolve();
          };
        });
        rl.on("close", () => {
          resolve();
          console.log(`========== ${project.packageName} END ==========`);
        });
        await p;
        hasPrint = true;
      }
    }
    if (!hasPrint) {
      console.log(
        `[print-log-if-error] I am not the culprit!!! Please scroll up to check the real error.`
      );
    }
  } catch (error: any) {
    if (error.message) {
      terminal.writeErrorLine(error.message);
    } else {
      throw error;
    }
    process.exit(1);
  }
}
