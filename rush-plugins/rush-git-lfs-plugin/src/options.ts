import path from 'path';
import { RushConfiguration } from '@rushstack/rush-sdk';

import fse from 'fs-extra';

import { PluginName, DefaultOption } from './constant';
import { NestedRequired } from './helpers/type';

export interface IRushGitLFSPluginOption {
  checkPattern: Record<string, number>;
  errorTips?: string;
}

export const loadPluginOptions = (): NestedRequired<IRushGitLFSPluginOption> => {
  const rushConfig: RushConfiguration = RushConfiguration.loadFromDefaultLocation();
  const pluginConfigFolder: string = rushConfig.rushPluginOptionsFolder;
  const optionFilePath: string = path.resolve(pluginConfigFolder, `${PluginName}.json`);

  const option: NestedRequired<IRushGitLFSPluginOption> = DefaultOption;

  if (fse.existsSync(optionFilePath)) {
    const customOption: Partial<IRushGitLFSPluginOption> = fse.readJSONSync(optionFilePath);

    if (typeof customOption.checkPattern === 'object') {
      option.checkPattern = {
        ...option.checkPattern,
        ...customOption.checkPattern,
      };
    }
    if (customOption.errorTips) {
      option.errorTips = customOption.errorTips;
    }
  }
  return option;
};
