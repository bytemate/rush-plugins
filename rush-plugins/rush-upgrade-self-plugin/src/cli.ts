#!/usr/bin/env node

import { upgradeSelf } from "./upgrade-self";

main();

async function main() {
  try {
    await upgradeSelf();
  } catch (error: any) {
    if (error.message) {
      console.log(error.message);
    } else {
      throw error;
    }
    process.exit(1);
  }
}
