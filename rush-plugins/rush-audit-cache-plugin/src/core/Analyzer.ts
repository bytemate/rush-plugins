import * as path from "path";
import { Colors, IColorableSequence } from "@rushstack/node-core-library";
import ignore, { Ignore } from "ignore";

import {
  getSortedAllDependencyProjects,
  tryLoadJson,
} from "../helpers/rushProject";
import type {
  IRushProjectJson,
  IAuditCacheFileFilter,
} from "../helpers/rushProject";

import type {
  RushConfiguration,
  RushConfigurationProject,
} from "@rushstack/rush-sdk";
import type { ITraceResult } from "./base/BaseTraceExecutor";

import { ReadFileResolver } from "./ReadFileResolver";
import { WriteFileResolver } from "./WriteFileResolver";
import type { IFileResolveResult } from "./base/BaseFileResolver";

import { terminal } from "../helpers/terminal";
import {
  RUSH_PROJECT_JSON_RELATIVE_PATH,
  RUSH_AUDIT_CACHE_JSON_RELATIVE_PATH,
} from "../helpers/constants";

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
        const readFileResolver: ReadFileResolver = new ReadFileResolver();
        const writeFileResolver: WriteFileResolver = new WriteFileResolver();

        const { projectFolder } = project;

        // get user project rush audit cache config
        const rushProjectAuditCacheJsonPath: string = path.join(
          projectFolder,
          RUSH_AUDIT_CACHE_JSON_RELATIVE_PATH
        );

        const rushProjectAuditCacheJson: IAuditCacheFileFilter | undefined =
          tryLoadJson<IAuditCacheFileFilter>(rushProjectAuditCacheJsonPath);

        const { fileFilters = [] } = rushProjectAuditCacheJson ?? {
          fileFilters: [],
        };

        // prepare project safe read and write matcher
        const projectSafeReadMatcher: Ignore = ignore();
        const projectSafeWriteMatcher: Ignore = ignore();

        // dependency project folders
        const allDependencyProjectFolders: string[] =
          getSortedAllDependencyProjects(project).map((p) => p.projectFolder);

        projectSafeReadMatcher.add(
          [project.projectFolder].concat(allDependencyProjectFolders)
        );

        let outputFolderNames: string[] = [];
        const rushProjectJsonPath: string = path.join(
          projectFolder,
          RUSH_PROJECT_JSON_RELATIVE_PATH
        );
        const rushProjectJson: IRushProjectJson | undefined =
          tryLoadJson<IRushProjectJson>(rushProjectJsonPath);
        if (rushProjectJson) {
          const { operationSettings = [], incrementalBuildIgnoredGlobs = [] } =
            rushProjectJson;
          if (incrementalBuildIgnoredGlobs.length > 0) {
            projectSafeReadMatcher.add(
              incrementalBuildIgnoredGlobs.map((p) =>
                path.join(project.projectFolder, p)
              )
            );
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
        projectSafeWriteMatcher.add(outputFolderNames);

        // prepare project context
        readFileResolver.loadProjectFilterConfig(fileFilters);
        writeFileResolver.loadProjectFilterConfig(fileFilters);

        readFileResolver.setMatcher(projectSafeReadMatcher, {
          level: "safe",
        });
        writeFileResolver.setMatcher(projectSafeWriteMatcher, {
          level: "safe",
        });

        if (!acc[projectName]) {
          acc[projectName] = {
            lowRisk: [],
            highRisk: [],
          };
        }
        for (const readFilePath of readFiles) {
          terminal.writeDebugLine(`readFilePath: ${readFilePath}`);
          const result: IFileResolveResult =
            readFileResolver.resolve(readFilePath);
          terminal.writeDebugLine(
            `resolve readFilePath result: ${readFilePath} ${JSON.stringify(
              result
            )}`
          );

          if (result.level === "safe") {
            continue;
          }

          if (result.level === "low") {
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

        if (outputFolderNames.length === 0) {
          acc[projectName].highRisk.push({
            kind: "text",
            content: Colors.red(
              `"outputFolderNames" are not defined for build operation of project "${projectName}"`
            ),
          });
        }

        for (const writeFilePath of writeFiles) {
          terminal.writeDebugLine(`writeFilePath: ${writeFilePath}`);
          const result: IFileResolveResult =
            writeFileResolver.resolve(writeFilePath);
          terminal.writeDebugLine(
            `resolve writeFilePath result: ${writeFilePath} ${JSON.stringify(
              result
            )}`
          );

          if (result.level === "safe") {
            continue;
          }

          if (result.level === "low") {
            acc[projectName].lowRisk.push({
              kind: "writeFile",
              filePath: writeFilePath,
            });
            continue;
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
