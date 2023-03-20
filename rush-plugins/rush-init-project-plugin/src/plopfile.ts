import type { RushConfiguration } from '@rushstack/rush-sdk';
import { FileSystem, PackageName, Terminal } from '@rushstack/node-core-library';
import hbsHelpersLib from 'handlebars-helpers/lib';
import { Answers, Inquirer } from 'inquirer';
import autocompletePlugin from 'inquirer-autocomplete-prompt';
import { pickBy } from 'lodash';
import type {
  ActionConfig,
  ActionType,
  DynamicPromptsFunction,
  NodePlopAPI,
  PlopCfg,
  PromptQuestion
} from 'node-plop';
import * as path from 'path';
import type { SyncHook } from 'tapable';
import validatePackageName from 'validate-npm-package-name';
import { addProjectToRushJson } from './actions/addProjectToRushJson';
import { runRushUpdate } from './actions/rushRushUpdate';
import { sortPackageJson } from './actions/sortPackageJson';
import { IHooks, getHooks } from './hooks';
import { loadRushConfiguration } from './logic/loadRushConfiguration';
import {
  IDefaultProjectConfiguration,
  IPluginContext,
  TemplateConfiguration
} from './logic/TemplateConfiguration';
import { getTemplatesFolder } from './logic/templateFolder';
import { getGitUserName } from './logic/GitConfig';
import type { ICliParams } from './init-project';
import { TerminalSingleton } from './terminal';
import { IGlobalConfig, loadGlobalConfiguration } from './logic/loadGlobalConfiguration';

export interface IExtendedAnswers extends Answers {
  authorName: string;
  description: string;
  template: string;
  packageName: string;
  unscopedPackageName: string;
  projectFolder: string;
  shouldRunRushUpdate: boolean;
}

export default function (plop: NodePlopAPI, plopCfg: PlopCfg & ICliParams): void {
  const terminal: Terminal = TerminalSingleton.getInstance();
  const rushConfiguration: RushConfiguration = loadRushConfiguration();
  const monorepoRoot: string = rushConfiguration.rushJsonFolder;

  const hooks: IHooks = getHooks();

  const pluginContext: IPluginContext = {
    isDryRun: plopCfg.dryRun || Boolean(process.env.DRY_RUN),
    cliAnswer: typeof plopCfg.answer === 'object' ? plopCfg.answer : {}
  };

  registerActions(plop);
  registerHelpers(plop);

  const defaultPrompts: PromptQuestion[] = [
    {
      type: 'input',
      name: 'authorName',
      message: 'What is your name? (used in package.json)',
      default() {
        return getGitUserName(monorepoRoot).trim();
      },
      validate(input: string) {
        return Boolean(input);
      }
    },
    {
      name: 'packageName',
      type: 'input',
      message: `Input package name`,
      async validate(input: string, answers: Partial<IExtendedAnswers>) {
        if (!input) {
          return 'package name is required';
        }
        if (!validatePackageName(input)) {
          return 'package name is invalid';
        }
        return true;
      }
    },
    {
      type: 'input',
      message: 'Input package description',
      name: 'description',
      validate: (input: string) => {
        if (!input) {
          return 'description is required';
        }
        return true;
      }
    },
    {
      type: 'input',
      message: 'Input a relative path to store this project',
      name: 'projectFolder',
      validate: (input: string) => {
        if (!input) {
          return 'project folder is required';
        }
        if (FileSystem.exists(path.join(monorepoRoot, input))) {
          return 'project folder already exists, please delete it first';
        }
        return true;
      }
    },
    {
      type: 'confirm',
      name: 'shouldRunRushUpdate',
      message: 'Do you need run rush update after init?'
    }
  ];

  // get template config when invoke loadTemplateConfiguration
  let templateConfiguration: TemplateConfiguration | undefined;
  const loadTemplateConfiguration: (
    promptQueue: PromptQuestion[],
    template: string
  ) => Promise<void> = async (promptQueue, template) => {
    templateConfiguration = await TemplateConfiguration.loadFromTemplate(template);
    for (const prompt of templateConfiguration.prompts) {
      promptQueue.push(prompt);
    }
    for (const plugin of templateConfiguration.plugins) {
      plugin.apply(hooks, pluginContext);
    }
    hooks.plop.call(plop);
    await hooks.prompts.promise({
      promptQueue
    });
  };

  const promptsFunc: DynamicPromptsFunction = async (
    inquirerPassed: Parameters<DynamicPromptsFunction>[0]
  ): Promise<Answers> => {
    const inquirer: Inquirer = inquirerPassed as unknown as Inquirer;
    inquirer.registerPrompt('autocomplete', autocompletePlugin);

    const { templateNameList }: IGlobalConfig = await loadGlobalConfiguration(hooks, pluginContext);

    await hooks.templates.promise({
      templates: templateNameList
    });

    const templateChoices: { name: string; value: string }[] = templateNameList.map((x) => ({
      name: x.displayName ? x.displayName : x.templateFolder,
      value: x.templateFolder
    }));

    // default prompt
    const defaultPromptFunc = async (): Promise<Answers> => {
      let allAnswers: Partial<IExtendedAnswers> = {};
      defaultPrompts.unshift({
        type: 'autocomplete',
        name: 'template',
        message: 'Please select a template',
        source: (ans: unknown, input: string) => {
          if (!input) {
            return templateChoices;
          }
          return templateChoices.filter((x) => x.name.includes(input) || x.value.includes(input));
        },
        loop: false,
        pageSize: 20
      } as any);

      const promptQueue: PromptQuestion[] = defaultPrompts.slice();

      // choose selected template
      if (pluginContext.cliAnswer.template) {
        allAnswers.template = pluginContext.cliAnswer.template;
      }

      while (promptQueue.length > 0) {
        const currentPrompt: PromptQuestion = promptQueue.shift()!;

        const hookForCurrentPrompt:
          | SyncHook<[PromptQuestion, Partial<IExtendedAnswers>], null | undefined>
          | undefined = hooks.promptQuestion.get(currentPrompt.name);
        if (hookForCurrentPrompt) {
          const hookResult: null | undefined = hookForCurrentPrompt.call(currentPrompt, allAnswers);
          // hook can return null to skip the prompt
          if (hookResult === null) {
            continue;
          }
        }

        // we don't need to filter prompts, for Inquirer will avoid asking allAnswers already provided here.
        // https://github.com/SBoudrias/Inquirer.js#methods
        const currentAnswers: Partial<IExtendedAnswers> = await inquirer.prompt([currentPrompt], allAnswers);

        // when template decided, load template configuration
        if (currentPrompt?.name === 'template') {
          await loadTemplateConfiguration(promptQueue, currentAnswers.template!);
          const promptQueueNames: Array<string | undefined> = promptQueue.map((x) => x.name);
          // apply cliAnswer
          allAnswers = pickBy(pluginContext.cliAnswer, (v, k) => promptQueueNames.includes(k));
        }
        // merge answers
        allAnswers = { ...allAnswers, ...currentAnswers };
      }
      return allAnswers;
    };

    // terminal ui logic
    const invokeUI = async (): Promise<Answers> => {
      const { initBlessedForm } = await import('./ui');
      return await initBlessedForm(
        defaultPrompts,
        pluginContext,
        plop,
        plopCfg,
        loadTemplateConfiguration,
        templateChoices
      );
    };

    let promptAnswers: Answers;

    if (plopCfg.ui) {
      promptAnswers = await invokeUI();
    } else {
      promptAnswers = await defaultPromptFunc();
    }
    // process answers
    promptAnswers.unscopedPackageName = PackageName.getUnscopedName(promptAnswers.packageName ?? '');
    try {
      await hooks.answers.promise(promptAnswers as IExtendedAnswers);
    } catch (error: any) {
      terminal.writeErrorLine(`Error in "answers" hook, please check your plugins`);
      terminal.writeErrorLine((error ?? 'error')?.toString());
      process.exit(1);
    }
    return promptAnswers;
  };

  plop.setGenerator('rush-init-project', {
    description: 'Rush init project',
    prompts: promptsFunc,
    actions: (answer) => {
      const { template, projectFolder } = answer as IExtendedAnswers;

      const defaultProjectConfiguration: IDefaultProjectConfiguration =
        templateConfiguration?.defaultProjectConfiguration || {};
      hooks.defaultProjectConfiguration.call(defaultProjectConfiguration, answer as IExtendedAnswers);

      const templatesFolder: string = getTemplatesFolder();
      // glob result is always splitted by slash
      const baseFolder: string = path.join(templatesFolder, template).replace(/\\/g, '/');

      const actions: ActionType[] = plopCfg.dryRun
        ? []
        : [
            {
              type: 'addMany',
              destination: path.resolve(monorepoRoot, projectFolder),
              base: baseFolder,
              templateFiles: [`**/*`, '!init.config.ts', '!init.config.js'],
              globOptions: {
                cwd: baseFolder,
                dot: true,
                absolute: true
              },
              data: answer
            },
            {
              type: 'sortPackageJson'
            },
            {
              type: 'addProjectToRushJson',
              data: {
                defaultProjectConfiguration
              }
            },
            {
              type: 'runRushUpdate'
            }
          ];

      hooks.actions.call({ actions });

      return actions;
    }
  });
}

function registerActions(plop: NodePlopAPI): void {
  plop.setActionType('addProjectToRushJson', (ans: Answers, config: ActionConfig | undefined) => {
    const answers: IExtendedAnswers = ans as IExtendedAnswers;
    const { packageName, projectFolder } = answers;
    const defaultProjectConfiguration: IDefaultProjectConfiguration =
      (
        config?.data as {
          defaultProjectConfiguration: IDefaultProjectConfiguration;
        }
      )?.defaultProjectConfiguration || {};
    if (!packageName) {
      throw new Error('packageName is required');
    }
    if (!projectFolder) {
      throw new Error('projectFolder is required');
    }
    addProjectToRushJson({
      packageName,
      projectFolder,
      defaultProjectConfiguration
    });
    return `Add ${packageName} to rush.json successfully`;
  });

  plop.setActionType('runRushUpdate', (ans: Answers) => {
    const { shouldRunRushUpdate } = ans as IExtendedAnswers;
    if (!shouldRunRushUpdate) {
      return 'Skip "rush update", please run it manually';
    }
    runRushUpdate();
    return 'Run rush update successfully';
  });

  plop.setActionType('sortPackageJson', (ans: Answers) => {
    const { projectFolder } = ans as IExtendedAnswers;
    sortPackageJson(projectFolder);
    return 'Sort package.json successfully';
  });
}

function registerHelpers(plop: NodePlopAPI): void {
  // See https://github.com/helpers/handlebars-helpers/blob/master/README.md#helpers
  for (const helpers of Object.values<Record<string, any>>(hbsHelpersLib)) {
    for (const [helperName, helperFunc] of Object.entries(helpers)) {
      plop.setHelper(helperName, helperFunc);
    }
  }
}
