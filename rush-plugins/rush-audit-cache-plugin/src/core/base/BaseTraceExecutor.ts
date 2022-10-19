import type { ITerminal } from "@rushstack/node-core-library";
import type { RushConfigurationProject } from "@rushstack/rush-sdk";

export interface IBaseTraceExecutorOptions {
  project: RushConfigurationProject;
  logFolder: string;
  terminal: ITerminal;
};

export interface ITraceResult {
  [packageName: string]: {
    readFiles: ReadonlySet<string>;
    writeFiles: ReadonlySet<string>;
  }
}

export abstract class BaseTraceExecutor {
  protected _project: RushConfigurationProject;
  protected _logFolder: string;
  protected _terminal: ITerminal;
  public constructor(options: IBaseTraceExecutorOptions) {
    this._project = options.project;
    this._logFolder = options.logFolder;
    this._terminal = options.terminal;
  }

  abstract execAsync(): Promise<ITraceResult>;
}