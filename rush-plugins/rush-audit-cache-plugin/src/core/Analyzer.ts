import * as path from "path";
import { JsonFile, Path } from "@rushstack/node-core-library";

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

export class AuditCacheAnalyzer {
  private _rushConfiguration: RushConfiguration;
  private _nodeFilePaths: string[] = [".nvm", ".npm", ".npmrc"];
  private _systemFilePaths: string[] = [
    "/usr/lib",
    "/etc",
    "/sys",
    "/proc",
    "/dev/null",
  ];
  private _projectToDependencies: {
    [projectName: string]: RushConfigurationProject[];
  } = {};

  public constructor(options: IAnalyzerOptions) {
    this._rushConfiguration = options.rushConfiguration;
  }

  public analyze(input: ITraceResult): IAnalyzeResult {
    return Object.entries(input).reduce(
      (acc, [projectName, { readFiles, writeFiles }]) => {
        const project: RushConfigurationProject | undefined =
          this._rushConfiguration.getProjectByName(projectName);

        let outputFolderNames: string[] = [];
        let ignoreInputFolderNames: string[] = [];

        if (!project) {
          throw new Error(`no project ${projectName} RushConfigurationProject`);
        }
        const { projectFolder, projectRushConfigFolder } = project;

        try {
          const rushProjectJson: IRushProjectJson = JsonFile.load(
            path.join(projectRushConfigFolder, "./rush-project.json")
          );
          const { operationSettings = [], incrementalBuildIgnoredGlobs = [] } =
            rushProjectJson;
          ignoreInputFolderNames = incrementalBuildIgnoredGlobs.map((p) =>
            path.join(projectFolder, p)
          );
          const buildOutputFolderNames:
            | IRushProjectJson["operationSettings"][number]
            | undefined = operationSettings.find(
            ({ operationName }) => operationName === "build"
          );

          if (buildOutputFolderNames) {
            outputFolderNames = buildOutputFolderNames.outputFolderNames.map(
              (p) => path.join(projectFolder, p)
            );
          }
        } catch (e) {
          outputFolderNames = [];
        }

        if (!this._projectToDependencies[projectName]) {
          this._projectToDependencies[projectName] = [
            ...project.dependencyProjects,
          ];
        }

        if (!acc[projectName]) {
          acc[projectName] = {
            lowRisk: [],
            highRisk: [],
          };
        }

        for (const readFilePath of readFiles) {
          if (
            this._systemFilePaths.find((systemPath) =>
              Path.isUnderOrEqual(readFilePath, systemPath)
            )
          ) {
            acc[projectName].lowRisk.push({
              kind: "readFile",
              filePath: readFilePath,
            });
            continue;
          }

          if (
            ignoreInputFolderNames.find((fullPath) =>
              Path.isUnderOrEqual(readFilePath, fullPath)
            )
          ) {
            continue;
          }
          if (
            this._projectToDependencies[projectName].find(({ projectFolder }) =>
              Path.isUnderOrEqual(readFilePath, projectFolder)
            )
          ) {
            continue;
          }
          acc[projectName].highRisk.push({
            kind: "readFile",
            filePath: readFilePath,
          });
        }

        for (const writeFilePath of writeFiles) {
          if (
            outputFolderNames.find(
              (fullPath) => !Path.isUnderOrEqual(writeFilePath, fullPath)
            )
          ) {
            continue;
          }
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
