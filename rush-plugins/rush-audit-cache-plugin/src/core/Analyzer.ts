import * as path from 'path';
import { Colors, IColorableSequence } from '@rushstack/node-core-library';

import { getSortedAllDependencyProjects, tryLoadJson } from '../helpers/rushProject';
import type {
  IRushProjectJson,
  IAuditCacheFileFilter,
  IAuditCacheGlobalFileFilter
} from '../helpers/rushProject';

import type { RushConfiguration, RushConfigurationProject } from '@rushstack/rush-sdk';
import type { ITraceResult } from './base/BaseTraceExecutor';

import { ReadFileResolver } from './ReadFileResolver';
import { WriteFileResolver } from './WriteFileResolver';
import type { IFileResolveResult } from './base/BaseFileResolver';

import { terminal } from '../helpers/terminal';
import {
  RUSH_PROJECT_JSON_RELATIVE_PATH,
  RUSH_AUDIT_CACHE_JSON_RELATIVE_PATH,
  PLUGIN_NAME
} from '../helpers/constants';

export interface IAnalyzerOptions {
  rushConfiguration: RushConfiguration;
  phasedCommands: string[];
}

export type IRisk = IReadFileRisk | IWriteFileRisk | IRiskText;

export interface IReadFileRisk {
  readonly kind: 'readFile';
  filePath: string;
}

export interface IWriteFileRisk {
  readonly kind: 'writeFile';
  filePath: string;
}

export interface IRiskText {
  readonly kind: 'text';
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
  private _phasedCommands: string[];

  public constructor(options: IAnalyzerOptions) {
    this._rushConfiguration = options.rushConfiguration;
    this._phasedCommands = options.phasedCommands;
  }

  public analyze(input: ITraceResult): IAnalyzeResult {
    // prepare global audit cache config
    const pluginOptionsJsonFilePath: string = path.join(
      this._rushConfiguration.rushPluginOptionsFolder,
      `${PLUGIN_NAME}.json`
    );

    const globalAuditCacheJson: IAuditCacheGlobalFileFilter | undefined =
      tryLoadJson<IAuditCacheGlobalFileFilter>(pluginOptionsJsonFilePath);

    const globalFileFilters: IAuditCacheGlobalFileFilter['globalFileFilters'] =
      globalAuditCacheJson?.globalFileFilters ?? [];

    terminal.writeLine(`Found ${globalFileFilters.length} filters in ${pluginOptionsJsonFilePath}`);

    return Object.entries(input).reduce((acc, [projectName, { readFiles, writeFiles }]) => {
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

      const rushProjectAuditCacheJson: IAuditCacheFileFilter | undefined = tryLoadJson<IAuditCacheFileFilter>(
        rushProjectAuditCacheJsonPath
      );

      const fileFilters: IAuditCacheFileFilter['fileFilters'] = rushProjectAuditCacheJson?.fileFilters ?? [];

      terminal.writeLine(`Found ${fileFilters.length} filters in project ${projectName}`);

      // dependency project folders
      const allDependencyProjectFolders: string[] = getSortedAllDependencyProjects(project).map(
        (p) => p.projectFolder
      );

      readFileResolver.projectSafeMatcher.add([project.projectFolder].concat(allDependencyProjectFolders));

      const outputFolderNames: string[] = [];
      const rushProjectJsonPath: string = path.join(projectFolder, RUSH_PROJECT_JSON_RELATIVE_PATH);
      const rushProjectJson: IRushProjectJson | undefined =
        tryLoadJson<IRushProjectJson>(rushProjectJsonPath);

      if (rushProjectJson) {
        const { operationSettings = [], incrementalBuildIgnoredGlobs = [] } = rushProjectJson;
        if (incrementalBuildIgnoredGlobs.length > 0) {
          readFileResolver.projectSafeMatcher.add(
            incrementalBuildIgnoredGlobs.map((p) => path.join(project.projectFolder, p))
          );
        }
        const usedOperationSettings: IRushProjectJson['operationSettings'] | undefined =
          operationSettings.filter(({ operationName }) => this._phasedCommands.includes(operationName));
        if (usedOperationSettings && usedOperationSettings.length) {
          usedOperationSettings.forEach(({ outputFolderNames: outputFolders }) => {
            outputFolderNames.push(...outputFolders);
          });
        }
      }
      writeFileResolver.projectSafeMatcher.add(
        outputFolderNames.map((director) => path.join(project.projectFolder, director))
      );

      // prepare audit cache global config
      readFileResolver.loadGlobalFilterConfig(globalFileFilters);
      writeFileResolver.loadGlobalFilterConfig(globalFileFilters);

      // prepare audit cache project config
      readFileResolver.loadProjectFilterConfig(fileFilters);
      writeFileResolver.loadProjectFilterConfig(fileFilters);

      if (!acc[projectName]) {
        acc[projectName] = {
          lowRisk: [],
          highRisk: []
        };
      }
      for (const readFilePath of readFiles) {
        terminal.writeDebugLine(`readFilePath: ${readFilePath}`);
        const result: IFileResolveResult = readFileResolver.resolve(readFilePath);
        terminal.writeDebugLine(`resolve readFilePath result: ${readFilePath} ${JSON.stringify(result)}`);

        if (result.level === 'safe') {
          continue;
        }

        if (result.level === 'low') {
          acc[projectName].lowRisk.push({
            kind: 'readFile',
            filePath: readFilePath
          });
          continue;
        }

        // Otherwise, high risk
        acc[projectName].highRisk.push({
          kind: 'readFile',
          filePath: readFilePath
        });
      }

      if (outputFolderNames.length === 0) {
        acc[projectName].highRisk.push({
          kind: 'text',
          content: Colors.red(
            `"outputFolderNames" are not defined for build operation of project "${projectName}"`
          )
        });
      }

      for (const writeFilePath of writeFiles) {
        terminal.writeDebugLine(`writeFilePath: ${writeFilePath}`);
        const result: IFileResolveResult = writeFileResolver.resolve(writeFilePath);
        terminal.writeDebugLine(`resolve writeFilePath result: ${writeFilePath} ${JSON.stringify(result)}`);

        if (result.level === 'safe') {
          continue;
        }

        if (result.level === 'low') {
          acc[projectName].lowRisk.push({
            kind: 'writeFile',
            filePath: writeFilePath
          });
          continue;
        }

        // Otherwise, high risk
        acc[projectName].highRisk.push({
          kind: 'writeFile',
          filePath: writeFilePath
        });
      }

      return acc;
    }, {} as IAnalyzeResult);
  }
}
