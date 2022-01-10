#!/usr/bin/env node

import path from "path";
import fs from "fs";
import { execSync } from "child_process";

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
        console.log(`========== ${project.packageName} BEGIN ==========`);
        execSync(`cat ${buildLogPath}`, { stdio: "inherit" });
        console.log(`========== ${project.packageName} END ==========`);
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
