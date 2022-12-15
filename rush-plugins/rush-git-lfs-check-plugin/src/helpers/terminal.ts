import {
  Terminal,
  ConsoleTerminalProvider,
  IColorableSequence,
} from '@rushstack/node-core-library';
import chalk from 'chalk';

import { PluginName } from '../constant';

export const terminalProvider: ConsoleTerminalProvider = new ConsoleTerminalProvider();
export const terminal: Terminal = new Terminal(terminalProvider);

export const withPrefix = (msg: string): string => {
  return `[${PluginName}]` + msg;
};
