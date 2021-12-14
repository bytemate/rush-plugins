import type { RushConfiguration } from '@microsoft/rush-lib';
import type { ITerminal } from "@rushstack/node-core-library";
import { Executable } from '@rushstack/node-core-library';
import * as path from 'path';
import { loadRushConfiguration } from './rushConfiguration';

export interface IPromptRushUpdateParams {
  terminal: ITerminal
}

export async function promptRushUpdate({ terminal }: IPromptRushUpdateParams): Promise<void> {
  const { prompt } = await import("inquirer");
  interface IShouldRunRushUpdateAnswer {
    shouldRunRushUpdate: boolean;
  }
  const rushConfiguration: RushConfiguration = loadRushConfiguration();
  const runRushJSPath: string = path.join(
    rushConfiguration.commonScriptsFolder,
    "install-run-rush.js"
  );

  const { shouldRunRushUpdate } = await prompt<IShouldRunRushUpdateAnswer>([
    {
      type: "confirm",
      name: "shouldRunRushUpdate",
      message: "Run rush update right now?",
      default: true,
    },
  ]);

  if (shouldRunRushUpdate) {
    terminal.writeLine("Run rush update...");
    try {
      Executable.spawnSync("node", [runRushJSPath, "update"], {
        stdio: "inherit",
      });
    } catch (e) {
      terminal.writeErrorLine("Rush update failed, please run it manually.");
    }
    terminal.writeLine("Rush update successfully.");
  } else {
    terminal.writeWarningLine("Rush update skipped, please run it manually.");
  }
}