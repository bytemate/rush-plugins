import type { IRushGitLFSPluginOption } from './options';
import type { NestedRequired } from './helpers/type';

export const DefaultOption: NestedRequired<IRushGitLFSPluginOption> = {
  checkPattern: {},
  errorTips: '',
};

export const PluginName: string = 'rush-git-lfs-plugin';
