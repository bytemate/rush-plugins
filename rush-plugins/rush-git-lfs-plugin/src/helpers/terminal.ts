import {
  Terminal,
  ConsoleTerminalProvider,
} from '@rushstack/node-core-library';

import { PluginName } from '../constant';

export const terminalProvider: ConsoleTerminalProvider = new ConsoleTerminalProvider();
export const terminal: Terminal = new Terminal(terminalProvider);

export const withPrefix = (msg: string): string => {
  return `[${PluginName}]` + msg;
};
