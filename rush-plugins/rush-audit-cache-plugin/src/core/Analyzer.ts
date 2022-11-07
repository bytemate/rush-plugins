import * as path from "path";
import { Colors, IColorableSequence, Path } from "@rushstack/node-core-library";
import ignore, { Ignore } from "ignore";

import { getSortedAllDependencyProjects } from "../helpers/rushProject";

import type {
  RushConfiguration,
  RushConfigurationProject,
} from "@rushstack/rush-sdk";
import type { ITraceResult } from "./base/BaseTraceExecutor";

import {
  IRushProjectJson,
  tryLoadJsonForProject,
} from "../helpers/rushProject";
import { terminal } from "../helpers/terminal";

export interface IAnalyzerOptions {
  rushConfiguration: RushConfiguration;
}

export type IRisk = IReadFileRisk | IWriteFileRisk | IRiskText;

export interface IReadFileRisk {
  readonly kind: "readFile";
  filePath: string;
}

export interface IWriteFileRisk {
  readonly kind: "writeFile";
  filePath: string;
}

export interface IRiskText {
  readonly kind: "text";
  content: string | IColorableSequence;
}

export interface IAnalyzeResult {
  [packageName: string]: {
    lowRisk: IRisk[];
    highRisk: IRisk[];
  };
}

const lowRiskReadFiles: string[] = [
  // nvm
  ".nvm",
  ".npm",
  ".pnpm",
  ".npmrc",
  ".git"
];

const lowRiskReadFolders: string[] = [
  // system
  "/usr/lib",
  "/usr/share/locale",
  "/lib",
  "/etc",
  "/sys",
  "/proc",
  "/dev/null",
];

export class AuditCacheAnalyzer {
  private _rushConfiguration: RushConfiguration;
  private _repoSafeReadMatcher: Ignore;

  public constructor(options: IAnalyzerOptions) {
    this._rushConfiguration = options.rushConfiguration;

    this._repoSafeReadMatcher = ignore();
    this._repoSafeReadMatcher.add("common/temp/node_modules/**");
  }

  public analyze(input: ITraceResult): IAnalyzeResult {
    return Object.entries(input).reduce(
      (acc, [projectName, { readFiles, writeFiles }]) => {
        const project: RushConfigurationProject | undefined =
          this._rushConfiguration.getProjectByName(projectName);

        if (!project) {
          throw new Error(`no project ${projectName} RushConfigurationProject`);
        }
        const { projectFolder } = project;

        const projectSafeReadMatcher: Ignore = ignore();

        // dependency project folders
        const allDependencyProjectFolders: string[] =
          getSortedAllDependencyProjects(project).map((p) => p.projectFolder);

        let outputFolderNames: string[] = [];
        const rushProjectJsonPath: string = path.join(
          projectFolder,
          "./config/rush-project.json"
        );
        const rushProjectJson: IRushProjectJson | undefined =
          tryLoadJsonForProject(rushProjectJsonPath);
        if (rushProjectJson) {
          const { operationSettings = [], incrementalBuildIgnoredGlobs = [] } =
            rushProjectJson;
          if (incrementalBuildIgnoredGlobs.length > 0) {
            projectSafeReadMatcher.add(incrementalBuildIgnoredGlobs);
          }
          const operationSetting:
            | IRushProjectJson["operationSettings"][number]
            | undefined = operationSettings.find(
            ({ operationName }) => operationName === "build"
          );

          if (operationSetting) {
            outputFolderNames = operationSetting.outputFolderNames;
          }
        }

        if (!acc[projectName]) {
          acc[projectName] = {
            lowRisk: [],
            highRisk: [],
          };
        }

        for (const readFilePath of readFiles) {
          terminal.writeDebugLine(`readFilePath: ${readFilePath}`);
          // Safe
          if (
            ignore.isPathValid(readFilePath) &&
            projectSafeReadMatcher.ignores(readFilePath)
          ) {
            terminal.writeDebugLine(`readFilePath: ${readFilePath} is safe`);
            continue;
          } else {
            const relativePathToProjectFolder: string = path.relative(
              projectFolder,
              readFilePath
            );
            if (
              ignore.isPathValid(relativePathToProjectFolder) &&
              projectSafeReadMatcher.ignores(relativePathToProjectFolder)
            ) {
              terminal.writeDebugLine(
                `readFilePath: ${readFilePath}, relativePathToProjectFolder: ${relativePathToProjectFolder} is safe`
              );
              continue;
            }
            const relativePathToRepoRoot: string = path.relative(
              this._rushConfiguration.rushJsonFolder,
              readFilePath
            );
            if (
              ignore.isPathValid(relativePathToRepoRoot) &&
              this._repoSafeReadMatcher.ignores(relativePathToRepoRoot)
            ) {
              terminal.writeDebugLine(
                `readFilePath: ${readFilePath}, relativePathToRepoRoot: ${relativePathToRepoRoot} is safe`
              );
              continue;
            }
          }

          const allProjectFolders: string[] = [project.projectFolder].concat(
            allDependencyProjectFolders
          );
          if (
            allProjectFolders.find((dependencyProjectFolder) => {
              return Path.isUnderOrEqual(readFilePath, dependencyProjectFolder);
            })
          ) {
            terminal.writeDebugLine(
              `readFilePath: ${readFilePath}, allProjectFolders: ${allProjectFolders.toString()} is safe`
            );
            continue;
          }

          // Low risk
          if (
            lowRiskReadFiles.find((lowRiskReadFile) => {
              return readFilePath.includes(lowRiskReadFile);
            }) ||
            lowRiskReadFolders.find((lowRiskReadFolder) => {
              return Path.isUnderOrEqual(readFilePath, lowRiskReadFolder);
            })
          ) {
            acc[projectName].lowRisk.push({
              kind: "readFile",
              filePath: readFilePath,
            });
            terminal.writeDebugLine(
              `readFilePath: ${readFilePath}, lowRiskReadFiles: ${lowRiskReadFiles.toString()}, lowRiskReadFolders: ${lowRiskReadFolders.toString()} is low risk`
            );
            continue;
          }

          terminal.writeDebugLine(`readFilePath: ${readFilePath} is high risk`);
          // Otherwise, high risk
          acc[projectName].highRisk.push({
            kind: "readFile",
            filePath: readFilePath,
          });
        }

        const safeWriteMatcher: Ignore = ignore();
        safeWriteMatcher.add(outputFolderNames);

        const lowRiskWriteMatcher: Ignore = ignore();
        lowRiskWriteMatcher.add("node_modules/.cache");
        lowRiskWriteMatcher.add("node_modules/.pnpm");

        if (outputFolderNames.length === 0) {
          acc[projectName].highRisk.push({
            kind: "text",
            content: Colors.red(
              `"outputFolderNames" are not defined for build operation of project "${projectName}"`
            ),
          });
        }

        for (const writeFilePath of writeFiles) {
          // safe
          if (
            ignore.isPathValid(writeFilePath) &&
            safeWriteMatcher.ignores(writeFilePath)
          ) {
            terminal.writeDebugLine(`writeFilePath: ${writeFilePath} is safe`);
            continue;
          } else {
            const relativePathToProjectFolder: string = path.relative(
              projectFolder,
              writeFilePath
            );
            if (
              ignore.isPathValid(relativePathToProjectFolder) &&
              safeWriteMatcher.ignores(relativePathToProjectFolder)
            ) {
              terminal.writeDebugLine(
                `writeFilePath: ${writeFilePath}, safeWriteMatcher: ${safeWriteMatcher}, relativePathToProjectFolder: ${relativePathToProjectFolder} is safe`
              );

              continue;
            }
          }

          // low risk
          if (
            ignore.isPathValid(writeFilePath) &&
            lowRiskWriteMatcher.ignores(writeFilePath)
          ) {
            terminal.writeDebugLine(
              `writeFilePath: ${writeFilePath} is low risk`
            );
            continue;
          } else {
            const relativePathToProjectFolder: string = path.relative(
              projectFolder,
              writeFilePath
            );
            if (
              ignore.isPathValid(relativePathToProjectFolder) &&
              lowRiskWriteMatcher.ignores(relativePathToProjectFolder)
            ) {
              terminal.writeDebugLine(
                `writeFilePath: ${writeFilePath}, lowRiskWriteMatcher: ${lowRiskWriteMatcher}, relativePathToProjectFolder: ${relativePathToProjectFolder} is low risk`
              );

              continue;
            }
          }

          terminal.writeDebugLine(
            `writeFilePath: ${writeFilePath} is high risk`
          );

          // Otherwise, high risk
          acc[projectName].highRisk.push({
            kind: "writeFile",
            filePath: writeFilePath,
          });
        }

        return acc;
      },
      {} as IAnalyzeResult
    );
  }
}
