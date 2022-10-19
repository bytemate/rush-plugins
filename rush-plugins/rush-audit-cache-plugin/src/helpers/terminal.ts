import {
  Terminal,
  ConsoleTerminalProvider,
} from "@rushstack/node-core-library";

export const terminalProvider: ConsoleTerminalProvider = new ConsoleTerminalProvider();
export const terminal: Terminal = new Terminal(terminalProvider);
