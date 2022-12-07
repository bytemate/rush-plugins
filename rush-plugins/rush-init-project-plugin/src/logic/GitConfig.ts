import { Executable } from "@rushstack/node-core-library";
import type { SpawnSyncReturns } from "child_process";

export const getGitUserName = (cwd: string): string => {
  try {
    const result: SpawnSyncReturns<string> =  Executable.spawnSync(
      'git',
      ['config', 'user.name'],
      {
        currentWorkingDirectory: cwd,
        stdio: "pipe",
      }
    );
    if (result.status !== 0) {
      return '';
    }
    return result.stdout?.trim() ?? '';
  } catch (e) {
    // no-catch
    return '';
  }
}