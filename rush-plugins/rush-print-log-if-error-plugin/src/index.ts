#!/usr/bin/env node

import path from "path";
import fs from "fs";
import readline from "readline";

import { loadRushConfiguration } from "./helpers/loadRushConfiguration";
import { terminal } from "./helpers/terminal";

import type { RushConfiguration } from "@rushstack/rush-sdk";
import type { PackageNameParser } from "@rushstack/node-core-library";
import type { ReadStream } from "fs";

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();

async function main(): Promise<void> {
  try {
    const rushConfig: RushConfiguration = loadRushConfiguration();

    const packageNameParser: PackageNameParser = rushConfig.packageNameParser;
    let hasPrint: boolean = false;
    for (const project of rushConfig.projects) {
      const folder: string = project.projectFolder;
      const unscopedProjectName: string = packageNameParser.getUnscopedName(
        project.packageName
      );
      const buildLogPath: string = path.resolve(
        folder,
        `${unscopedProjectName}.build.log`
      );
      const buildErrorLogPath: string = path.resolve(
        folder,
        `${unscopedProjectName}.build.error.log`
      );
      if (fs.existsSync(buildErrorLogPath) && fs.existsSync(buildLogPath)) {
        const readStream: ReadStream = fs.createReadStream(buildLogPath);
        console.log(`========== ${project.packageName} BEGIN ==========`);
        const rl: readline.Interface = readline.createInterface({
          input: readStream,
          output: process.stdout,
        });
        let resolve: () => void = null as unknown as () => void;
        // eslint-disable-next-line promise/param-names, @typescript-eslint/naming-convention
        const p: Promise<void> = new Promise<void>((_resolve: () => void) => {
          const timeoutId: NodeJS.Timeout = setTimeout(() => {
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
