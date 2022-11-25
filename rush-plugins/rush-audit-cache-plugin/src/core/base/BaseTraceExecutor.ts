import type { ITerminal } from "@rushstack/node-core-library";
import type { RushConfigurationProject } from "@rushstack/rush-sdk";

export interface IBaseTraceExecutorOptions {
  projects: RushConfigurationProject[];
  logFolder: string;
  terminal: ITerminal;
  parallelism?: string;
}

export interface ITraceResult {
  [packageName: string]: {
    readFiles: ReadonlySet<string>;
    writeFiles: ReadonlySet<string>;
  };
}

export abstract class BaseTraceExecutor {
  protected _projects: RushConfigurationProject[];
  protected _logFolder: string;
  protected _terminal: ITerminal;
  public constructor(options: IBaseTraceExecutorOptions) {
    this._projects = options.projects;
    this._logFolder = options.logFolder;
    this._terminal = options.terminal;
  }

  abstract execAsync(): Promise<ITraceResult>;
}
