import { Executable } from "@rushstack/node-core-library";
import { Utilities } from "@microsoft/rush-lib/lib/utilities/Utilities";

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
  Utilities.executeCommand({
    command: gitPath,
    args: ["clean", "-fdx"],
    workingDirectory: cwd,
  });
};

export const gitCheckIgnored = (cwd: string, filePath: string): string => {
  const gitPath: string = getGitPathOrThrow();
  let result: string = "";
  try {
    result = Utilities.executeCommandAndCaptureOutput(
      gitPath,
      ["check-ignore", "-v", filePath],
      cwd
    );
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
