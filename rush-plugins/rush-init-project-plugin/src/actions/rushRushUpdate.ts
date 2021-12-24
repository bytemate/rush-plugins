import { Executable } from "@rushstack/node-core-library";
import type { SpawnSyncReturns } from "child_process";

export const runRushUpdate = (): void => {
  const result: SpawnSyncReturns<string> = Executable.spawnSync(
    "rush",
    ["update"],
    {
      stdio: "inherit",
    }
  );
  if (result.status !== 0) {
    throw new Error('Run "rush update" failed');
  }
};
