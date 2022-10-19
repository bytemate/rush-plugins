import * as path from "path";
import { FileSystem, JsonFile } from "@rushstack/node-core-library";
import ignore, { Ignore } from 'ignore';

import { getSortedAllDependencyProjects } from "../helpers/rushProject";

import type {
  RushConfiguration,
  RushConfigurationProject,
} from "@rushstack/rush-sdk";
import type { ITraceResult } from "./base/BaseTraceExecutor";

export interface IAnalyzerOptions {
  rushConfiguration: RushConfiguration;
}

export type IRisk = IReadFileRisk | IWriteFileRisk;

export interface IRushProjectJson {
  operationSettings: {
    operationName: string;
    outputFolderNames: string[];
  }[];
  incrementalBuildIgnoredGlobs: string[];
}

export interface IReadFileRisk {
  kind: "readFile";
  filePath: string;
}

export interface IWriteFileRisk {
  kind: "writeFile";
  filePath: string;
}

export interface IAnalyzeResult {
  [packageName: string]: {
    lowRisk: IRisk[];
    highRisk: IRisk[];
  };
}

const lowRiskGlobs: string[] = [
  // nvm
  ".nvm", ".npm", ".npmrc",
  // system
  "/usr/lib/**",
  "/etc/**",
  "/sys/**",
  "/proc/**",
  "/dev/null",
]

export class AuditCacheAnalyzer {
  private _rushConfiguration: RushConfiguration;

  public constructor(options: IAnalyzerOptions) {
    this._rushConfiguration = options.rushConfiguration;
  }

  public analyze(input: ITraceResult): IAnalyzeResult {
    return Object.entries(input).reduce(
      (acc, [projectName, { readFiles, writeFiles }]) => {
        const project: RushConfigurationProject | undefined =
          this._rushConfiguration.getProjectByName(projectName);

        if (!project) {
          throw new Error(`no project ${projectName} RushConfigurationProject`);
        }
        const { projectFolder, projectRushConfigFolder } = project;

        const safeReadMatcher: Ignore = ignore();

        // dependency project folders
        const allDependencyProjectFolders: string[] = getSortedAllDependencyProjects(project).map(p => p.projectFolder);
        if (allDependencyProjectFolders.length > 0) {
          safeReadMatcher.add(`${allDependencyProjectFolders}/**`);
        }

        const lowRiskMatcher: Ignore = ignore();

        // low risk globs
        lowRiskMatcher.add(lowRiskGlobs);

        let outputFolderNames: string[] = [];
        try {
          const rushProjectJson: IRushProjectJson = JsonFile.load(
            path.join(projectRushConfigFolder, "./rush-project.json")
          );
          const { operationSettings = [], incrementalBuildIgnoredGlobs = [] } =
            rushProjectJson;
          if (incrementalBuildIgnoredGlobs.length > 0) {
            safeReadMatcher.add(incrementalBuildIgnoredGlobs);
          }
          const operationSetting:
            | IRushProjectJson["operationSettings"][number]
            | undefined = operationSettings.find(
            ({ operationName }) => operationName === "build"
          );

          if (operationSetting) {
            outputFolderNames = operationSetting.outputFolderNames;
          }
        } catch (e) {
          if (FileSystem.isFileDoesNotExistError(e as Error)) {
            outputFolderNames = [];
          } else {
            throw e;
          }
        }

        if (!acc[projectName]) {
          acc[projectName] = {
            lowRisk: [],
            highRisk: [],
          };
        }

        for (const readFilePath of readFiles) {
          // Safe
          if (safeReadMatcher.ignores(readFilePath)) {
            continue;
          }

          // Low risk
          if (
            lowRiskMatcher.ignores(readFilePath)
          ) {
            acc[projectName].lowRisk.push({
              kind: "readFile",
              filePath: readFilePath,
            });
            continue;
          }

          // Otherwise, high risk
          acc[projectName].highRisk.push({
            kind: "readFile",
            filePath: readFilePath,
          });
        }

        const safeWriteMatcher: Ignore = ignore();
        safeWriteMatcher.add(outputFolderNames.map((outputFolderName) => `${projectFolder}/${outputFolderName}/**`));

        for (const writeFilePath of writeFiles) {
          // safe
          if (
            safeWriteMatcher.ignores(writeFilePath)
          ) {
            continue;
          }

          // Otherwise, high risk
          acc[projectName].highRisk.push({
            kind: "readFile",
            filePath: writeFilePath,
          });
        }

        return acc;
      },
      {} as IAnalyzeResult
    );
  }
}
