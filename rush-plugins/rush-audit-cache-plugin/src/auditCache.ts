import path from 'path';

import { RushConfiguration, RushConfigurationProject } from '@rushstack/rush-sdk';
import { FileSystem, ITerminal } from '@rushstack/node-core-library';

import { AUDIT_CACHE_FOLDER } from './helpers/constants';
import { TraceExecutorFactory } from './core/TraceExecutor';
import { BaseTraceExecutor, IBaseTraceExecutorOptions, ITraceResult } from './core/base/BaseTraceExecutor';
import { AuditCacheAnalyzer, IAnalyzeResult } from './core/Analyzer';

export interface IAuditCacheOptions {
  projectName: string;
  terminal: ITerminal;
}

export interface IAuditCacheResult {
  traceResult: ITraceResult;
  analyzeResult: IAnalyzeResult;
}

export async function auditCache(options: IAuditCacheOptions): Promise<IAuditCacheResult> {
  const { projectName, terminal } = options;
  const rushConfiguration: RushConfiguration = RushConfiguration.loadFromDefaultLocation();
  terminal.writeVerboseLine('Rush configuration loaded');

  const project: RushConfigurationProject | undefined = rushConfiguration.findProjectByShorthandName(projectName);
  if (!project) {
    throw new Error(`Project ${projectName} not found`);
  }


  const tempPath: string = rushConfiguration.commonTempFolder;
  const auditCacheFolder: string = path.join(tempPath, AUDIT_CACHE_FOLDER);

  FileSystem.ensureEmptyFolder(auditCacheFolder);

  terminal.writeDebugLine(`The dependencies of the project ${projectName} are ${Array.from(project.dependencyProjects).map(p => p.packageName)}`);

  const traceExecutorOptions: IBaseTraceExecutorOptions = {
    project,
    logFolder: auditCacheFolder,
    terminal,
  }
  const traceExecutor: BaseTraceExecutor = TraceExecutorFactory.create(traceExecutorOptions);

  const traceResult: ITraceResult = await traceExecutor.execAsync();

  const analyzer: AuditCacheAnalyzer = new AuditCacheAnalyzer({
    rushConfiguration,
  });

  const analyzeResult: IAnalyzeResult = analyzer.analyze(traceResult);

  const resultJsonFile: string = path.join(auditCacheFolder, 'result.json');
  FileSystem.writeFile(resultJsonFile, JSON.stringify(analyzeResult, (key, value) => {
    if (value instanceof Set) {
      return Array.from(value);
    }
    return value;
  }, 2));

  terminal.writeVerboseLine(`Audit cache result saved to ${resultJsonFile}`);

  terminal.writeLine(`Audit cache for project ${project.packageName}${project.dependencyProjects.size > 0 ? ` and its dependencies ${Array.from(project.dependencyProjects.values()).map(p => p.packageName).join(',')}` : ''}`);

  Object.entries(analyzeResult).forEach(([packageName, result]) => {
    terminal.writeLine(`======== project ${packageName} ========`);

    const { highRisk, lowRisk } = result;
    terminal.writeLine(`It has ${highRisk.length} high risk issues and ${lowRisk.length} low risk issues`);

    if (highRisk.length > 0) {
      terminal.writeLine('High risks are');
      for (const risk of highRisk) {
        switch (risk.kind) {
          case 'readFile': {
            terminal.writeLine(`Reads ${risk.filePath}`);
            break;
          }
          case 'writeFile': {
            terminal.writeLine(`Writes ${risk.filePath}`);
          }
        }
      }
    }
  });

  terminal.writeLine(`For more details, you can check ${resultJsonFile}`);

  return {
    traceResult,
    analyzeResult
  };
}
