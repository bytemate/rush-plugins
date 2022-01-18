#!/usr/bin/env node

import lintStaged from 'lint-staged';

// import { terminal } from "./helpers/terminal.mjs";

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();

async function main(): Promise<void> {
  try {
    // https://github.com/okonet/lint-staged/pull/1080
    await lintStaged();
  } catch (error: any) {
    if (error.message) {
      // terminal.writeErrorLine(error.message);
    } else {
      throw error;
    }
    process.exit(1);
  }
}
