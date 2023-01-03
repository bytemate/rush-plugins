import { Executable } from "@rushstack/node-core-library";

import type { SpawnSyncReturns } from "child_process";

let checkedGitPath: boolean = false;
let gitPath: string | undefined;

export const getGitPath = (): string | undefined => {
  if (!checkedGitPath) {
    checkedGitPath = true;
    gitPath = Executable.tryResolve("git");
  }
  return gitPath;
};

export const getGitPathOrThrow = (): string => {
  const gitPath: string | undefined = getGitPath();
  if (!gitPath) {
    throw new Error("Unable to find git.");
  }
  return gitPath;
};

export const gitFullClean = (cwd: string): void => {
  const gitPath: string = getGitPathOrThrow();
  Executable.spawnSync(gitPath, ["clean", "-fdx"], {
    currentWorkingDirectory: cwd,
  });
};

export const gitCheckIgnored = (cwd: string, filePath: string): string => {
  const gitPath: string = getGitPathOrThrow();
  let result: string = "";
  try {
    const process: SpawnSyncReturns<string> = Executable.spawnSync(
      gitPath,
      ["check-ignore", "-v", filePath],
      {
        currentWorkingDirectory: cwd,
      }
    );
    if (process.status === 0) {
      result = process.stdout.toString();
    }
  } catch (e: any) {
    if (e.message.includes("The command failed with exit code 1")) {
      // ignore
    } else {
      // rethrow
      throw e;
    }
  }
  return result;
};

export const getCheckpointBranch = (cwd: string, branchName: string): string => {
  const gitPath: string = getGitPathOrThrow();
  const archivedBranchName: string = `${branchName}-checkpoint-${new Date().toISOString()}`;
  Executable.spawnSync(gitPath, ["branch", archivedBranchName], {
    currentWorkingDirectory: cwd,
  });
  return archivedBranchName;
}