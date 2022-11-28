import * as path from "path";
import * as fs from "fs";
import { createInterface, Interface } from "readline";
import { FileSystem } from "@rushstack/node-core-library";

import type { RushConfigurationProject } from "@rushstack/rush-sdk";
import { ITraceResult } from "../base/BaseTraceExecutor";
import { TRACE_LOG_FILENAME } from "../../helpers/constants";
import { terminal } from "../../helpers/terminal";
import { durationToString } from "../../helpers/utils";
export interface IStraceLogParserOptions {
  projects: RushConfigurationProject[];
  straceLogFolderPath: string;
  logFolder: string;
}

const OPERATION_START_LINE_PREFIX: string = 'chdir("';
const OPERATION_START_LINE_SUFFIX: string = '") = 0';
const CHILD_PROCESS_REGEX: RegExp = /^clone\(.+\) = (\d+)$/;
const OPEN_AT_FINISH_REGEX: RegExp =
  /^openat\(([A-Z_]+), "(.+)", ([A-Z_|]+)(, [0-9]+)?\) = [0-9]+<(.+)>$/gi;
const OPEN_FINISH_REGEX: RegExp =
  /^open\("(.+)", ([A-Z_|]+)(, [0-9]+)?\) = [0-9]+<(.+)>$/gi;
// open("/opt/tiger/tiktok_web_monorepo/packages/libs/tux-h5-color/package.json", O_RDONLY|O_CLOEXEC) = 17</opt/tiger/tiktok_web_monorepo/packages/libs/tux-h5-color/package.json>
interface IFileOperateKindResult {
  kind: "read" | "write";
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
  private _straceLogFolderPath: string;
  private _logFolder: string;
  private _startLinesToProjectParseContext: Record<
    string,
    IProjectParseContext
  > = {};
  private _pidToProjectParseContext: Record<string, IProjectParseContext> = {};
  private _filePathType: Record<string, "file" | "director" | "no_exist"> = {};

  public readonly projectParseContextMap: Map<string, IProjectParseContext>;

  public constructor(options: IStraceLogParserOptions) {
    this._straceLogFolderPath = options.straceLogFolderPath;
    this._logFolder = options.logFolder;

    this.projectParseContextMap = new Map<string, IProjectParseContext>();

    for (const project of options.projects) {
      const parsedLogFilePath: string = path.join(
        options.logFolder,
        project.packageName,
        "strace.log"
      );
      FileSystem.deleteFile(parsedLogFilePath);
      FileSystem.writeFile(parsedLogFilePath, "", {
        ensureFolderExists: true,
      });
      const projectParseContext: IProjectParseContext = {
        packageName: project.packageName,
        started: false,
        writeFiles: new Set<string>(),
        readFiles: new Set<string>(),
        parsedLogFilePath,
      };
      this.projectParseContextMap.set(project.packageName, projectParseContext);

      const startLine: string = `${OPERATION_START_LINE_PREFIX}${project.projectFolder}${OPERATION_START_LINE_SUFFIX}`;
      this._startLinesToProjectParseContext[startLine] = projectParseContext;
    }
  }

  public async parseAsync(): Promise<ITraceResult> {
    const startTime: number = Date.now();
    //Warning: This API is now obsolete.
    // Use FileSystem.readFolderItemNames() instead.
    const allLogs: string[] = FileSystem.readFolder(
      this._straceLogFolderPath
    ).filter((name) => name.startsWith(`${TRACE_LOG_FILENAME}.`));
    allLogs.sort((nameA, nameB) => {
      const pidA: number = +nameA.split(".")[2];
      const pidB: number = +nameB.split(".")[2];
      return pidA - pidB;
    });

    const result: ITraceResult = {};

    for (const logName of allLogs) {
      const pId: string = logName.split(".")[2];
      const straceReadStream: fs.ReadStream = fs.createReadStream(
        path.join(this._straceLogFolderPath, logName)
      );
      const rl: Interface = createInterface({
        input: straceReadStream,
        crlfDelay: Infinity,
      });

      for await (const line of rl) {
        this._parseLine(line, pId);
      }

      // write result in json files for each projects
      for (const projectParseContext of this.projectParseContextMap.values()) {
        result[projectParseContext.packageName] = {
          writeFiles: projectParseContext.writeFiles,
          readFiles: projectParseContext.readFiles,
        };
      }
    }

    const resultFilePath: string = path.join(
      this._logFolder,
      "parseResult.json"
    );

    FileSystem.writeFile(
      resultFilePath,
      JSON.stringify(
        result,
        (key, value) => {
          if (value instanceof Set) {
            return Array.from(value);
          }
          return value;
        },
        2
      )
    );
    const endTime: number = Date.now();

    const duration: string = durationToString((endTime - startTime) / 1000);

    terminal.writeLine(`Parsing strace log end (${duration})`);
    return result;
  }

  private _parseLine(line: string, pId: string): void {
    if (!pId) {
      return;
    }

    let projectParseContext: IProjectParseContext | undefined =
      this._pidToProjectParseContext[pId];

    if (!projectParseContext) {
      Object.keys(this._startLinesToProjectParseContext).some(
        (startLine: string) => {
          if (
            line.includes(startLine) &&
            !this._startLinesToProjectParseContext[startLine].started
          ) {
            terminal.writeDebugLine(`start line ${startLine}`);
            projectParseContext =
              this._startLinesToProjectParseContext[startLine];
            // project operation start
            projectParseContext.started = true;
            this._pidToProjectParseContext[pId] = projectParseContext;
            FileSystem.appendToFile(
              projectParseContext.parsedLogFilePath,
              `${line}\n`
            );
            return true;
          }
          return false;
        }
      );
    } else {
      FileSystem.appendToFile(
        projectParseContext.parsedLogFilePath,
        `${line}\n`
      );

      // handle fork process
      const childProcessId: string | undefined =
        this._parseChildProcessId(line);
      if (childProcessId) {
        this._pidToProjectParseContext[childProcessId] = projectParseContext;
      }

      // record read/write files
      const fileOperateKindResult: IFileOperateKindResult | undefined =
        this._parseFileOperateKind(line);
      if (fileOperateKindResult) {
        switch (fileOperateKindResult.kind) {
          case "read": {
            projectParseContext.readFiles.add(fileOperateKindResult.filePath);
            break;
          }
          case "write": {
            projectParseContext.writeFiles.add(fileOperateKindResult.filePath);
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

  private _handleFileOperate(params: {
    operations: string[];
    filePath: string;
  }): IFileOperateKindResult | undefined {
    const { operations, filePath } = params;
    const kind: IFileOperateKindResult["kind"] | null = operations.find(
      (operation) => operation === "O_DIRECTORY"
    )
      ? null
      : operations.find((operation) => operation === "O_RDONLY")
      ? "read"
      : operations.find((operation) => operation === "O_WRONLY")
      ? "write"
      : null;
    if (!kind) {
      return;
    }
    try {
      const fileType: "file" | "director" | "no_exist" =
        this._filePathType[filePath];
      if (fileType === "director") {
        return;
      }
      if (!fileType) {
        this._filePathType[filePath] = "file";

        if (fs.statSync(filePath).isDirectory()) {
          this._filePathType[filePath] = "director";
          return;
        }
      }
    } catch (e) {
      this._filePathType[filePath] = "no_exist";
    }

    return {
      kind,
      filePath,
    };
  }

  private _parseFileOperateKind(
    line: string
  ): IFileOperateKindResult | undefined {
    const parseOpenLineResult: RegExpExecArray | null =
      OPEN_FINISH_REGEX.exec(line);
    if (parseOpenLineResult?.length) {
      terminal.writeDebugLine(
        `parseOpenLineResult ${JSON.stringify(parseOpenLineResult)}`
      );
      const operations: string[] = parseOpenLineResult[2].split("|");
      return this._handleFileOperate({
        operations,
        filePath: parseOpenLineResult[4] ?? parseOpenLineResult[1],
      });
    }

    const parseOpenAtLineResult: RegExpExecArray | null =
      OPEN_AT_FINISH_REGEX.exec(line);
    if (parseOpenAtLineResult?.length) {
      terminal.writeDebugLine(
        `parseOpenAtLineResult ${JSON.stringify(parseOpenAtLineResult)}`
      );
      const operations: string[] = parseOpenAtLineResult[3].split("|");
      return this._handleFileOperate({
        operations,
        filePath: parseOpenAtLineResult[5] ?? parseOpenAtLineResult[2],
      });
    }

    return;
  }
}
