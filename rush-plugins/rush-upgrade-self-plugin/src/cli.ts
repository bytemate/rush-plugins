#!/usr/bin/env node

import { upgradeSelf } from "./upgrade-self";

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();

async function main(): Promise<void> {
  try {
    await upgradeSelf();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (error.message) {
      console.log(error.message);
    } else {
      throw error;
    }
    process.exit(1);
  }
}
