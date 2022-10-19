import type { RushConfiguration } from "@rushstack/rush-sdk";
import type { ITraceResult } from "./base/BaseTraceExecutor";

export interface IAnalyzerOptions {
  rushConfiguration: RushConfiguration;
}

export type IRisk = IReadFileRisk | IWriteFileRisk;

export interface IReadFileRisk {
  kind: 'readFile';
  filePath: string;
}

export interface IWriteFileRisk {
  kind: 'writeFile';
  filePath: string;
}

export interface IAnalyzeResult {
  [packageName: string]: {
    lowRisk: IRisk[];
    highRisk: IRisk[];
  }
}

export class AuditCacheAnalyzer {
  private _rushConfiguration: RushConfiguration;
  public constructor(options: IAnalyzerOptions) {
    this._rushConfiguration = options.rushConfiguration;
  }

  public analyze(input: ITraceResult): IAnalyzeResult {
    // TODO: implement
    return {}
  }
}