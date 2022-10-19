import * as path from "path";
import { Colors, FileSystem, IColorableSequence, JsonFile, Path } from "@rushstack/node-core-library";
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

export type IRisk = IReadFileRisk | IWriteFileRisk | IRiskText;

export interface IRushProjectJson {
  operationSettings: {
    operationName: string;
    outputFolderNames: string[];
  }[];
  incrementalBuildIgnoredGlobs: string[];
}

export interface IReadFileRisk {
  readonly kind: "readFile";
  filePath: string;
}

export interface IWriteFileRisk {
  readonly kind: "writeFile";
  filePath: string;
}

export interface IRiskText {
  readonly kind: 'text',
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
  ".nvm", ".npm", ".npmrc",
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
]

export class AuditCacheAnalyzer {
  private _rushConfiguration: RushConfiguration;
  private _repoSafeReadMatcher: Ignore;

  public constructor(options: IAnalyzerOptions) {
    this._rushConfiguration = options.rushConfiguration;

    this._repoSafeReadMatcher = ignore();
    this._repoSafeReadMatcher.add('common/temp/node_modules/**');
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

        const projectSafeReadMatcher: Ignore = ignore();

        // dependency project folders
        const allDependencyProjectFolders: string[] = getSortedAllDependencyProjects(project).map(p => p.projectFolder);

        let outputFolderNames: string[] = [];
        try {
          const rushProjectJson: IRushProjectJson = JsonFile.load(
            path.join(projectRushConfigFolder, "./rush-project.json")
          );
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
          if (ignore.isPathValid(readFilePath) && projectSafeReadMatcher.ignores(readFilePath)) {
            continue;
          } else {
            const relativePathToProjectFolder: string = path.relative(projectFolder, readFilePath);
            if (ignore.isPathValid(relativePathToProjectFolder) && projectSafeReadMatcher.ignores(relativePathToProjectFolder)) {
              continue;
            }
            const relativePathToRepoRoot: string = path.relative(this._rushConfiguration.rushJsonFolder, readFilePath);
            if (ignore.isPathValid(relativePathToRepoRoot) && this._repoSafeReadMatcher.ignores(relativePathToRepoRoot)) {
              continue;
            }
          }

          const allProjectFolders: string[] = [project.projectFolder].concat(allDependencyProjectFolders);
          if (allProjectFolders.find((dependencyProjectFolder) => {
            return Path.isUnderOrEqual(readFilePath, dependencyProjectFolder);
          })) {
            continue;
          }

          // Low risk
          if (
            lowRiskReadFiles.find((lowRiskReadFile) => {
              return readFilePath.endsWith(lowRiskReadFile);
            }) ||
            lowRiskReadFolders.find((lowRiskReadFolder) => {
              return Path.isUnderOrEqual(readFilePath, lowRiskReadFolder);
            })
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
        safeWriteMatcher.add(outputFolderNames);

        if (outputFolderNames.length === 0) {
          acc[projectName].highRisk.push({
            kind: 'text',
            content: Colors.red(`"outputFolderNames" are not defined for build operation of project "${projectName}"`)
          });
        }

        for (const writeFilePath of writeFiles) {
          // safe
          if (ignore.isPathValid(writeFilePath) && safeWriteMatcher.ignores(writeFilePath)) {
            continue;
          } else {
            const relativePathToProjectFolder: string = path.relative(projectFolder, writeFilePath);
            if (
              ignore.isPathValid(relativePathToProjectFolder) &&
              safeWriteMatcher.ignores(relativePathToProjectFolder)
            ) {
              continue;
            }
          }

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
