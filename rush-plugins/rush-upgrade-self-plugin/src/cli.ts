#!/usr/bin/env node

import { upgradeRushSelf } from "./upgrade-rush-self";

main();

async function main() {
  try {
    await upgradeRushSelf();
  } catch (error: any) {
    if (error.message) {
      console.log(error.message);
    } else {
      throw error;
    }
    process.exit(1);
  }
}
