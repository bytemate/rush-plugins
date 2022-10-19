import * as path from 'path';
import { Executable } from '@rushstack/node-core-library';

import { BaseTraceExecutor, IBaseTraceExecutorOptions, ITraceResult } from "../base/BaseTraceExecutor";
import { StraceLogParser } from './StraceLogParser';
import { TRACE_LOG_FILENAME } from "../../helpers/constants";

import type { SpawnSyncReturns } from 'child_process';

export class LinuxTraceExecutor extends BaseTraceExecutor {
  private _stracePath: string;
  private _straceLogParser: StraceLogParser;
  private _straceLogFilePath: string;

  public constructor(options: IBaseTraceExecutorOptions) {
    super(options);

    const stracePath: string | undefined = Executable.tryResolve('strace');
    if (!stracePath) {
      throw new Error(`strace is not present.`);
    }
    this._stracePath = stracePath;

    this._straceLogFilePath = path.join(this._logFolder, TRACE_LOG_FILENAME);
    this._straceLogParser = new StraceLogParser({
      project: options.project,
      logFolder: options.logFolder,
      straceLogFilePath: this._straceLogFilePath,
    });
  }

  public async execAsync(): Promise<ITraceResult> {
    const args: string[] = [
      '-f',
      '-y',
      '-s',
      '200',
      '-o',
      TRACE_LOG_FILENAME,
      'rush',
      'rebuild',
      '--to',
      this._project.packageName,
    ];

    this._terminal.writeLine(`Running "strace ${args.join(' ')}"...`);

    const spawnResult: SpawnSyncReturns<string> = Executable.spawnSync(this._stracePath, args, {
      currentWorkingDirectory: this._logFolder,
    });

    if (spawnResult.status !== 0) {
      throw new Error(`strace failed with exit code ${spawnResult.status}`);
    }

    return await this._straceLogParser.parseAsync();
  }
}