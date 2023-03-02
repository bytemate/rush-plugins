import type { PromptQuestion } from 'node-plop';
import { getTemplateFolder } from './templateFolder';
import { lilconfigSync, LilconfigResult } from 'lilconfig';
import type { IHooks } from '../hooks';

const searchPlaces: string[] = ['init.config.ts', 'init.config.js'];

const loaders: Record<string, (path: string) => IConfig> = {
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

/**
 * See https://rushjs.io/pages/configs/rush_json/
 */
export interface IDefaultProjectConfiguration {
  reviewCategory?: string;
  /**
   * @deprecated Use `decoupledLocalDependencies` instead.
   */
  cyclicDependencyProjects?: string[];
  decoupledLocalDependencies?: string[];
  shouldPublish?: boolean;
  skipRushCheck?: boolean;
  versionPolicyName?: string;
  publishFolder?: string;
  tags?: string[];
}

export interface IConfig {
  prompts?: PromptQuestion[];
  plugins?: IPlugin[];
  defaultProjectConfiguration?: IDefaultProjectConfiguration;
  displayName?: string;
  tags?: string[];
}

export interface IPlugin {
  apply: (hook: IHooks, pluginContext: IPluginContext) => void;
}

export interface IPluginContext extends Record<string, any> {
  isDryRun: boolean;
  cliAnswer: Record<string, string>;
}

export class TemplateConfiguration {
  private _prompts: PromptQuestion[];
  private _plugins: IPlugin[];
  private _defaultProjectConfiguration: IDefaultProjectConfiguration;
  public displayName: string;
  public tags: string[] | undefined;
  private constructor(template: string) {
    const templateFolder: string = getTemplateFolder(template);
    const result: LilconfigResult = lilconfigSync('init', {
      searchPlaces,
      loaders
    }).search(templateFolder);
    this._prompts = [];
    this._plugins = [];
    this._defaultProjectConfiguration = {};
    this.displayName = '';
    if (result && result.config) {
      if (result.config.prompts) {
        this._prompts = result.config.prompts;
      }
      if (result.config.plugins) {
        this._plugins = result.config.plugins;
      }
      if (result.config.defaultProjectConfiguration) {
        this._defaultProjectConfiguration = result.config.defaultProjectConfiguration;
      }
      if (result.config.displayName) {
        this.displayName = result.config.displayName;
      }
      if (result.config.tags) {
        this.tags = result.config.tags;
      }
    }
  }
  public static async loadFromTemplate(template: string): Promise<TemplateConfiguration> {
    if (!template) {
      throw new Error('template is required when loading template configuration');
    }
    return new TemplateConfiguration(template);
  }

  public get prompts(): PromptQuestion[] {
    return this._prompts;
  }

  public get plugins(): IPlugin[] {
    return this._plugins;
  }

  public get defaultProjectConfiguration(): IDefaultProjectConfiguration {
    return this._defaultProjectConfiguration;
  }
}
