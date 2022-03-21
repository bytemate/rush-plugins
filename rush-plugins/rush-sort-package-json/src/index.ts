#!/usr/bin/env node

import path from "path";

import { loadRushConfiguration } from "./helpers/loadRushConfiguration";
import { terminal } from "./helpers/terminal";

import type { RushConfiguration } from "@rushstack/rush-sdk";
import { sortPackageJson } from "./sortPackageJson";

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();

async function main(): Promise<void> {
  try {
    const rushConfig: RushConfiguration = loadRushConfiguration();
    for (const project of rushConfig.projects) {
      const packageJsonFilePath: string = path.resolve(
        rushConfig.rushJsonFolder,
        project.projectFolder
      );
      sortPackageJson(packageJsonFilePath);
    }
    terminal.writeLine('sort package.json successfully');
  } catch (error: any) {
    if (error.message) {
      terminal.writeErrorLine(error.message);
    } else {
      throw error;
    }
    process.exit(1);
  }
}
