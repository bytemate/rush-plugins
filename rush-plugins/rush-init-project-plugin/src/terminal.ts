import {
  ColorValue,
  ConsoleTerminalProvider,
  Terminal,
  TextAttribute,
} from "@rushstack/node-core-library";

const verboseEnabled: boolean = process.argv.includes("--verbose");

export const terminal: Terminal = new Terminal(
  new ConsoleTerminalProvider({
    verboseEnabled,
  })
);

export interface LogOption {
  prefix: string;
}

export type Logger = {
  info(msg: string): void;
  warn(msg: string): void;
  error(msg: string): void;
  success(msg: string): void;
  verbose(msg: string): void;
};

export function createLog(logOption: LogOption): Logger {
  const { prefix } = logOption;
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
