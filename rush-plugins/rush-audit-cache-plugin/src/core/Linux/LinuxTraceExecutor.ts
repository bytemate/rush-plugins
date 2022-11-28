import * as path from "path";
import { Executable, FileSystem } from "@rushstack/node-core-library";

import {
  BaseTraceExecutor,
  IBaseTraceExecutorOptions,
  ITraceResult,
} from "../base/BaseTraceExecutor";
import { StraceLogParser } from "./StraceLogParser";
import { TRACE_LOG_FILENAME } from "../../helpers/constants";
import { installProjects } from "../../helpers/rushProject";

import type { SpawnSyncReturns } from "child_process";

export class LinuxTraceExecutor extends BaseTraceExecutor {
  private _stracePath: string;
  private _straceLogParser: StraceLogParser;
  private _straceLogFolderPath: string;
  private _parallelism?: string;

  public constructor(options: IBaseTraceExecutorOptions) {
    super(options);

    this._parallelism = options.parallelism;

    const stracePath: string | undefined = Executable.tryResolve("strace");
    if (!stracePath) {
      throw new Error(`strace is not present.`);
    }
    this._stracePath = stracePath;

    this._straceLogFolderPath = path.join(this._logFolder, "logs");
    FileSystem.ensureEmptyFolder(this._straceLogFolderPath);
    this._straceLogParser = new StraceLogParser({
      projects: options.projects,
      logFolder: options.logFolder,
      straceLogFolderPath: this._straceLogFolderPath,
    });
  }

  public async execAsync(): Promise<ITraceResult> {
    const projectArgs: string[] = this._projects.reduce(
      (acc, { packageName }) => {
        acc.push("--to");
        acc.push(packageName);
        return acc;
      },
      [] as string[]
    );

    this._terminal.writeLine("");
    this._terminal.writeLine(
      `Running "rush install ${projectArgs.join(" ")}"...`
    );
    this._terminal.writeLine("");
    installProjects(this._projects);

    const parallelismArgs: string[] = this._parallelism
      ? ["--parallelism", this._parallelism]
      : [];

    const args: string[] = [
      "-ff",
      "-y",
      "-s",
      "200",
      "-o",
      TRACE_LOG_FILENAME,
      "-E",
      "RUSH_BUILD_CACHE_ENABLED=0",
      "rush",
      "rebuild",
      ...parallelismArgs,
      ...projectArgs,
    ];

    this._terminal.writeLine("");
    this._terminal.writeLine(`Running "strace ${args.join(" ")}"...`);
    this._terminal.writeLine("");

    const spawnResult: SpawnSyncReturns<string> = Executable.spawnSync(
      this._stracePath,
      args,
      {
        currentWorkingDirectory: this._straceLogFolderPath,
        stdio: "inherit",
      }
    );

    if (spawnResult.status !== 0) {
      throw new Error(`strace failed with exit code ${spawnResult.status}`);
    }

    this._terminal.writeLine("");
    this._terminal.writeLine("Parsing strace log start...");

    return await this._straceLogParser.parseAsync();
  }
}
