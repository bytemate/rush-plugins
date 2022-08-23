import {
  ColorValue,
  ConsoleTerminalProvider,
  Terminal,
  TextAttribute,
} from "@rushstack/node-core-library";

export class TerminalSingleton {
  private static _instance: Terminal | undefined;
  private constructor() {}
  public static getInstance(verboseEnabled?: boolean): Terminal {
    if (!TerminalSingleton._instance) {
      TerminalSingleton._instance = new Terminal(
        new ConsoleTerminalProvider({
          verboseEnabled,
        })
      );
    }
    return TerminalSingleton._instance;
  }
}

export interface ILogOption {
  prefix: string;
  verboseEnabled?: boolean;
}

export interface ILogger {
  info(msg: string): void;
  warn(msg: string): void;
  error(msg: string): void;
  success(msg: string): void;
  verbose(msg: string): void;
}

export function createLog(logOption: ILogOption): ILogger {
  const { prefix, verboseEnabled } = logOption;
  const terminal: Terminal = TerminalSingleton.getInstance(verboseEnabled);
  return {
    info(msg: string) {
      terminal.write({
        text: `${prefix} `,
        backgroundColor: ColorValue.Blue,
        foregroundColor: ColorValue.Black,
      });
      terminal.writeLine({
        text: msg,
        textAttributes: [TextAttribute.Dim],
      });
    },
    warn(msg: string) {
      terminal.write({
        text: `${prefix} `,
        backgroundColor: ColorValue.Yellow,
        foregroundColor: ColorValue.Black,
      });
      terminal.writeLine({
        text: msg,
        foregroundColor: ColorValue.Yellow,
      });
    },
    error(msg: string) {
      terminal.write({
        text: `${prefix} `,
        foregroundColor: ColorValue.White,
        backgroundColor: ColorValue.Red,
      });
      terminal.writeLine({
        text: msg,
        foregroundColor: ColorValue.Red,
      });
    },
    success(msg: string) {
      terminal.write({
        text: `${prefix} `,
        foregroundColor: ColorValue.Black,
        backgroundColor: ColorValue.Green,
      });
      terminal.writeLine({
        text: msg,
        foregroundColor: ColorValue.Green,
      });
    },
    verbose(msg: string) {
      terminal.writeVerboseLine({
        text: `${prefix} ${msg}`,
        textAttributes: [TextAttribute.Dim],
      });
    },
  };
}
