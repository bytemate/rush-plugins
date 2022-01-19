import {
  Terminal,
  ConsoleTerminalProvider,
} from "@rushstack/node-core-library";

export const terminal: Terminal = new Terminal(new ConsoleTerminalProvider());
