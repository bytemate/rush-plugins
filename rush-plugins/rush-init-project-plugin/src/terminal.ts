import {
  ColorValue,
  ConsoleTerminalProvider,
  Terminal,
  TextAttribute,
} from "@rushstack/node-core-library";

export class TerminalSingleton {
  private static _instance: Terminal | undefined;
  private static _verboseEnabled: boolean = false;
  private constructor() {}
  public static getInstance(): Terminal {
    if (!TerminalSingleton._instance) {
      TerminalSingleton._instance = new Terminal(
        new ConsoleTerminalProvider({
          verboseEnabled: TerminalSingleton._verboseEnabled,
        })
      );
    }
    return TerminalSingleton._instance;
  }
  public static setVerboseEnabled(enabled?: boolean): void {
    if (enabled === undefined) {
      return;
    }
    TerminalSingleton._verboseEnabled = enabled;
    TerminalSingleton._instance = new Terminal(
      new ConsoleTerminalProvider({
        verboseEnabled: TerminalSingleton._verboseEnabled,
      })
    );
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
  TerminalSingleton.setVerboseEnabled(verboseEnabled);
  const terminal: Terminal = TerminalSingleton.getInstance();
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
