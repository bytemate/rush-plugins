import * as path from 'path';
import { LilconfigResult, lilconfigSync } from 'lilconfig';
import { FileSystem, Terminal, JsonFile, JsonSchema, JsonObject } from '@rushstack/node-core-library';
import templeteSchema from './template.schema.json';
import { TerminalSingleton } from '../terminal';
import { getTemplatesFolder, getTemplateNameList, ITemplatePathNameType } from './templateFolder';
import { IHooks } from '../hooks';
import { IPluginContext } from './TemplateConfiguration';

export interface IGlobalConfig {
  templateNameList: ITemplatePathNameType[];
}

const globalPluginLoaders: Record<string, (path: string) => void> = {
  '.js': (path) => require(path),
  '.ts': (path) => {
    require('ts-node').register({
      transpileOnly: true,
      compilerOptions: {
        esModuleInterop: true
      }
    });
    const module: any = require(path);
    try {
      if ('default' in module) {
        return module.default;
      }
    } catch {
      // no-catch
    }
    return module;
  }
};

// global configuration will load config from `template.json`
export async function loadGlobalConfiguration(
  hooks: IHooks,
  pluginContext: IPluginContext
): Promise<IGlobalConfig> {
  const terminal: Terminal = TerminalSingleton.getInstance();
  const templateFolder: string = getTemplatesFolder();
  const templateConfigPath: string = path.join(templateFolder, 'template.json');
  // if template.json doesn't exists, get the template list from folder
  if (!FileSystem.exists(templateConfigPath)) {
    return {
      templateNameList: getTemplateNameList(templateFolder)
    };
  }
  const jsonSchema: JsonSchema = JsonSchema.fromLoadedObject(templeteSchema);
  const res: JsonObject = await JsonFile.loadAndValidateWithCallbackAsync(
    templateConfigPath,
    jsonSchema,
    ({ details = '' }): void => {
      terminal.writeErrorLine(details);
      process.exit(1);
    }
  );
  const { templates, globalPluginEntryPoint } = res;
  if (globalPluginEntryPoint) {
    const result: LilconfigResult = lilconfigSync('init', {
      searchPlaces: [globalPluginEntryPoint],
      loaders: globalPluginLoaders
    }).search(templateFolder);
    if (result) {
      for (const plugin of result.config?.plugins) {
        plugin.apply(hooks, pluginContext);
      }
    }
  }

  return {
    templateNameList: templates as ITemplatePathNameType[]
  };
}
