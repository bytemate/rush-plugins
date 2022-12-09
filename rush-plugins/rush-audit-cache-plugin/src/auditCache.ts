import path from "path";

import {
  RushConfiguration,
  RushConfigurationProject,
} from "@rushstack/rush-sdk";
import { Colors, FileSystem, ITerminal } from "@rushstack/node-core-library";

import { AUDIT_CACHE_FOLDER } from "./helpers/constants";
import { TraceExecutorFactory } from "./core/TraceExecutor";
import {
  BaseTraceExecutor,
  IBaseTraceExecutorOptions,
  ITraceResult,
} from "./core/base/BaseTraceExecutor";
import { AuditCacheAnalyzer, IAnalyzeResult } from "./core/Analyzer";
import {
  getSortedAllDependencyProjects,
  getAllCacheConfiguredProjects,
} from "./helpers/rushProject";

export interface IAuditCacheOptions {
  projectName: string;
  terminal: ITerminal;
  checkAllCacheConfiguredProject: boolean;
  exclude: string[];
  parallelism?: string;
}

export interface IAuditCacheResult {
  traceResult: ITraceResult;
  analyzeResult: IAnalyzeResult;
}

export async function auditCache(
  options: IAuditCacheOptions
): Promise<IAuditCacheResult> {
  const {
    projectName,
    terminal,
    checkAllCacheConfiguredProject,
    exclude,
    parallelism,
  } = options;

  terminal.writeDebugLine(`exclude: ${exclude}`);

  const rushConfiguration: RushConfiguration =
    RushConfiguration.loadFromDefaultLocation();
  terminal.writeVerboseLine("Rush configuration loaded");

  const auditCacheProjects: RushConfigurationProject[] = [];

  if (!checkAllCacheConfiguredProject) {
    const project: RushConfigurationProject | undefined =
      rushConfiguration.findProjectByShorthandName(projectName);
    if (!project) {
      throw new Error(`Project ${projectName} not found`);
    }
    const allDependencyProjects: ReadonlyArray<RushConfigurationProject> =
      getSortedAllDependencyProjects(project);
    const allDependencyPackageNames: string[] = allDependencyProjects.map(
      (p) => p.packageName
    );
    auditCacheProjects.push(...[project, ...allDependencyProjects]);
    terminal.writeDebugLine(
      `The dependencies of the project ${projectName} are ${allDependencyPackageNames
        .filter((name) => name !== projectName)
        .join(",")}`
    );
  } else {
    const allCacheConfiguredProjects: RushConfigurationProject[] =
      getAllCacheConfiguredProjects(rushConfiguration);
    if (!allCacheConfiguredProjects.length) {
      throw new Error("there is no cache configured project to audit");
    }
    const allNeedCacheAuditProjects: RushConfigurationProject[] =
      allCacheConfiguredProjects.filter(
        ({ packageName }) => !exclude.find((name) => name === packageName)
      );

    auditCacheProjects.push(...allNeedCacheAuditProjects);
    const allBuildCacheConfiguredProjects: string[] =
      allNeedCacheAuditProjects.map((p) => p.packageName);
    terminal.writeDebugLine(
      `Find build cache configured projects ${allBuildCacheConfiguredProjects.join(
        ","
      )}`
    );
  }

  const tempPath: string = rushConfiguration.commonTempFolder;
  const auditCacheFolder: string = path.join(tempPath, AUDIT_CACHE_FOLDER);

  FileSystem.ensureEmptyFolder(auditCacheFolder);

  const traceExecutorOptions: IBaseTraceExecutorOptions = {
    projects: auditCacheProjects,
    logFolder: auditCacheFolder,
    terminal,
    parallelism,
  };
  const traceExecutor: BaseTraceExecutor =
    TraceExecutorFactory.create(traceExecutorOptions);

  const traceResult: ITraceResult = await traceExecutor.execAsync();

  const analyzer: AuditCacheAnalyzer = new AuditCacheAnalyzer({
    rushConfiguration,
  });

  terminal.writeLine("");
  terminal.writeLine("Analyzing trace result...");

  const analyzeResult: IAnalyzeResult = analyzer.analyze(traceResult);

  const resultJsonFile: string = path.join(auditCacheFolder, "result.json");
  FileSystem.writeFile(
    resultJsonFile,
    JSON.stringify(
      analyzeResult,
      (key, value) => {
        if (value instanceof Set) {
          return Array.from(value);
        }
        return value;
      },
      2
    )
  );

  terminal.writeVerboseLine(`Audit cache result saved to ${resultJsonFile}`);

  if (!checkAllCacheConfiguredProject) {
    terminal.writeLine(
      `Audit cache for project ${auditCacheProjects[0].packageName}${
        auditCacheProjects.length > 1
          ? ` and its dependencies ${auditCacheProjects
              .slice(1)
              .map(({ packageName }) => packageName)
              .join(",")}`
          : ""
      }`
    );
  }

  const writeProjectAnalyzeResult = (params: {
    result: IAnalyzeResult[string];
    packageName: string;
  }): void => {
    const { result, packageName } = params;
    terminal.writeLine(`======== project ${packageName} ========`);

    const { highRisk, lowRisk } = result;
    terminal.write("It has ");
    terminal.write(Colors.red(String(highRisk.length)));
    terminal.write(" high risk issues and ");
    terminal.write(Colors.yellow(String(lowRisk.length)));
    terminal.write(" low risk issues\n");

    if (highRisk.length > 0) {
      terminal.writeLine(Colors.red("High risks are"));
      for (const risk of highRisk) {
        switch (risk.kind) {
          case "readFile": {
            terminal.writeLine(`Reads ${risk.filePath}`);
            break;
          }
          case "writeFile": {
            terminal.writeLine(`Writes ${risk.filePath}`);
            break;
          }
          case "text": {
            terminal.writeLine(risk.content);
            break;
          }
          default: {
            const _risk: never = risk;
            throw new Error(`Unrecognized risk kind: ${(_risk as any).kind}`);
          }
        }
      }
    }
  };

  if (checkAllCacheConfiguredProject) {
    Object.entries(analyzeResult).forEach(([packageName, result]) => {
      writeProjectAnalyzeResult({
        packageName,
        result,
      });
    });
  } else {
    const targetProjectAnalyzeResult: IAnalyzeResult["key"] =
      analyzeResult[projectName];

    const otherAnalyzedProjects: string[] = Object.keys(analyzeResult).filter(
      (name) => name !== projectName
    );

    writeProjectAnalyzeResult({
      packageName: projectName,
      result: targetProjectAnalyzeResult,
    });

    const highRiskProjects: string[] = [];
    let totalOtherHighRisks: number = 0;
    for (const packageName of otherAnalyzedProjects) {
      const { highRisk } = analyzeResult[packageName];
      if (highRisk.length > 0) {
        highRiskProjects.push(packageName);
        totalOtherHighRisks += highRisk.length;
      }
    }
    terminal.writeLine("");
    if (highRiskProjects.length === 0) {
      terminal.writeLine(
        `There is no high risk in dependencies of the project ${projectName}.`
      );
    } else {
      terminal.writeLine(
        `Find total ${totalOtherHighRisks} high risk in the dependencies of the project ${projectName}, include ${highRiskProjects.join(
          ","
        )}.`
      );
    }
  }

  terminal.writeLine("");
  terminal.writeLine(`For more details, you can check ${resultJsonFile}`);

  return {
    traceResult,
    analyzeResult,
  };
}
