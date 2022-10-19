import * as path from 'path';
import * as fs from 'fs';
import { createInterface, Interface } from 'readline';
import { FileSystem } from '@rushstack/node-core-library';

import type { RushConfigurationProject } from "@rushstack/rush-sdk";
import { ITraceResult } from '../base/BaseTraceExecutor';

export interface IStraceLogParserOptions {
  project: RushConfigurationProject;
  straceLogFilePath: string;
  logFolder: string;
}

const OPERATION_START_LINE_PREFIX: string = 'chdir("';
const OPERATION_START_LINE_SUFFIX: string = '") = 0';
const CHILD_PROCESS_REGEX: RegExp = /^.+clone.+child_stack.+flags.+ = (\d+)$/;
const PID_REGEX: RegExp = /^(\d+) .+$/;
// const FILE_PATH_REGEX: RegExp = /^\d+<(.+)>$/;

interface IFileAccessResult {
  kind: 'read' | 'write';
  filePath: string;
}

interface IProjectParseContext {
  packageName: string;
  started: boolean;
  parsedLogFilePath: string;
  writeFiles: Set<string>;
  readFiles: Set<string>;
}

export class StraceLogParser {
  private _straceLogFilePath: string;
  private _startLinesToProjectParseContext: Record<string, IProjectParseContext> = {};
  private _pidToProjectParseContext: Record<string, IProjectParseContext> = {};

  public readonly projectParseContextMap: Map<string, IProjectParseContext>;

  public constructor(options: IStraceLogParserOptions) {
    this._straceLogFilePath = options.straceLogFilePath;

    this.projectParseContextMap = new Map<string, IProjectParseContext>();

    for (const project of [options.project].concat(Array.from(options.project.dependencyProjects))) {
      const parsedLogFilePath: string = path.join(options.logFolder, project.packageName, 'strace.log');
      const projectParseContext: IProjectParseContext = {
        packageName: project.packageName,
        started: false,
        writeFiles: new Set<string>(),
        readFiles: new Set<string>(),
        parsedLogFilePath,
      }
      this.projectParseContextMap.set(project.packageName, projectParseContext);

      const startLine: string = `${OPERATION_START_LINE_PREFIX}${project.projectFolder}${OPERATION_START_LINE_SUFFIX}`;
      this._startLinesToProjectParseContext[startLine] = projectParseContext;
    }
  }

  public async parseAsync(): Promise<ITraceResult> {
    const straceReadStream: fs.ReadStream = fs.createReadStream(this._straceLogFilePath);
    const rl: Interface = createInterface({
      input: straceReadStream,
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      this._parseLine(line);
    }

    const result: ITraceResult = {};

    // write result in json files for each projects
    for (const projectParseContext of this.projectParseContextMap.values()) {
      result[projectParseContext.packageName] = {
        writeFiles: projectParseContext.writeFiles,
        readFiles: projectParseContext.readFiles,
      }
    }
    const resultFilePath: string = path.join(path.dirname(this._straceLogFilePath), 'parseResult.json');
    FileSystem.writeFile(
      resultFilePath,
      JSON.stringify(result, (key, value) => {
        if (value instanceof Set) {
          return Array.from(value);
        }
        return value;
      }, 2)
    );

    return result;
  }

  private _parseLine(line: string): void {
    const pId: string | undefined = line.match(PID_REGEX)?.[1];
    if (!pId) {
      return;
    }

    let projectParseContext: IProjectParseContext | undefined = this._pidToProjectParseContext[pId];

    if (!projectParseContext) {
      Object.keys(this._startLinesToProjectParseContext).some((startLine: string) => {
        if (line.includes(startLine)) {
          projectParseContext = this._startLinesToProjectParseContext[startLine];
          // project operation start
          projectParseContext.started = true;
          this._pidToProjectParseContext[pId] = projectParseContext;
          FileSystem.appendToFile(projectParseContext.parsedLogFilePath, line);
          return true;
        }
        return false;
      });
    } else {
      FileSystem.appendToFile(projectParseContext.parsedLogFilePath, line);

      // handle fork process
      const childProcessId: string | undefined = this._parseChildProcessId(line);
      if (childProcessId) {
        this._pidToProjectParseContext[childProcessId] = projectParseContext;
      }

      // record read/write files
      const fileAccessResult: IFileAccessResult | undefined = this._parseFileAccess(line);
      if (fileAccessResult) {
        switch (fileAccessResult.kind) {
          case 'read': {
            projectParseContext.readFiles.add(fileAccessResult.filePath);
            break;
          }
          case 'write': {
            projectParseContext.writeFiles.add(fileAccessResult.filePath);
            break;
          }
          default: {
            // no-default
          }
        }
      }
    }

  }

  private _parseChildProcessId(line: string): string | undefined {
    return line.match(CHILD_PROCESS_REGEX)?.[1];
  }

  private _parseFileAccess(line: string): IFileAccessResult | undefined {
    // TODO: implement
    return;
  }
}