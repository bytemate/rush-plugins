#!/usr/bin/env node

import { initProject } from "./init-project";
import { getTemplatesFolderAndValidate } from "./logic/templateFolder";
import { terminal } from "./terminal";

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();

async function main(): Promise<void> {
  try {
    getTemplatesFolderAndValidate();
    await initProject();
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
