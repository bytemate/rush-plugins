import type { RushConfiguration } from "@rushstack/rush-sdk";
import { FileSystem, PackageName } from "@rushstack/node-core-library";
import hbsHelpersLib from "handlebars-helpers/lib";
import { Answers, Inquirer } from "inquirer";
import autocompletePlugin from "inquirer-autocomplete-prompt";
import { pickBy } from "lodash";
import type {
  ActionConfig,
  ActionType,
  DynamicPromptsFunction,
  NodePlopAPI,
  PlopCfg,
  PromptQuestion,
} from "node-plop";
import * as path from "path";
import type { SyncHook } from "tapable";
import validatePackageName from "validate-npm-package-name";
import { addProjectToRushJson } from "./actions/addProjectToRushJson";
import { runRushUpdate } from "./actions/rushRushUpdate";
import { sortPackageJson } from "./actions/sortPackageJson";
import { IHooks, initHooks } from "./hooks";
import { loadRushConfiguration } from "./logic/loadRushConfiguration";
import {
  IDefaultProjectConfiguration,
  IPluginContext,
  TemplateConfiguration,
} from "./logic/TemplateConfiguration";
import {
  getTemplateNameList,
  getTemplatesFolder,
} from "./logic/templateFolder";
import { getGitUserName } from "./logic/GitConfig";
import type { ICliParams } from "./init-project";

export interface IExtendedAnswers extends Answers {
  authorName: string;
  description: string;
  template: string;
  packageName: string;
  unscopedPackageName: string;
  projectFolder: string;
  shouldRunRushUpdate: boolean;
}

export default function (
  plop: NodePlopAPI,
  plopCfg: PlopCfg & ICliParams
): void {
  const rushConfiguration: RushConfiguration = loadRushConfiguration();
  const monorepoRoot: string = rushConfiguration.rushJsonFolder;

  const hooks: IHooks = initHooks();
  const pluginContext: IPluginContext = {
    isDryRun: plopCfg.dryRun || Boolean(process.env.DRY_RUN),
    cliAnswer: typeof plopCfg.answer === "object" ? plopCfg.answer : {},
  };

  registerActions(plop);
  registerHelpers(plop);

  const templatesFolder: string = getTemplatesFolder();
  const templateNameList: string[] = getTemplateNameList(templatesFolder);
  const templateChoices: { name: string; value: string }[] =
    templateNameList.map((x) => ({
      name: x,
      value: x,
    }));

  const defaultPrompts: PromptQuestion[] = [
    {
      type: "autocomplete",
      name: "template",
      message: "Please select a template",
      source: (ans: unknown, input: string) => {
        if (!input) {
          return templateChoices;
        }
        return templateChoices.filter((x) => x.name.includes(input));
      },
      loop: false,
      pageSize: 20,
    } as any,
    {
      type: "input",
      name: "authorName",
      message: "What is your name? (used in package.json)",
      default() {
        return getGitUserName(monorepoRoot).trim();
      },
      validate(input: string) {
        return Boolean(input);
      },
    },
    {
      name: "packageName",
      type: "input",
      message: `Input package name`,
      async validate(input: string, answers: Partial<IExtendedAnswers>) {
        if (!input) {
          return "package name is required";
        }
        if (!validatePackageName(input)) {
          return "package name is invalid";
        }
        answers.unscopedPackageName = PackageName.getUnscopedName(input);
        return true;
      },
    },
    {
      type: "input",
      message: "Input package description",
      name: "description",
      validate: (input: string) => {
        if (!input) {
          return "description is required";
        }
        return true;
      },
    },
    {
      type: "input",
      message: "Input a relative path to store this project",
      name: "projectFolder",
      validate: (input: string) => {
        if (!input) {
          return "project folder is required";
        }
        if (FileSystem.exists(path.join(monorepoRoot, input))) {
          return "project folder already exists, please delete it first";
        }
        return true;
      },
    },
    {
      type: "confirm",
      name: "shouldRunRushUpdate",
      message: "Do you need run rush update after init?",
    },
  ];

  let templateConfiguration: TemplateConfiguration | undefined;
  const loadTemplateConfiguration: (
    promptQueue: PromptQuestion[],
    template: string
  ) => Promise<void> = async (promptQueue, template) => {
    templateConfiguration = await TemplateConfiguration.loadFromTemplate(
      template
    );
    for (const prompt of templateConfiguration.prompts) {
      promptQueue.push(prompt);
    }
    for (const plugin of templateConfiguration.plugins) {
      plugin.apply(hooks, pluginContext);
    }
    hooks.plop.call(plop);
    await hooks.prompts.promise({
      promptQueue,
    });
  };

  const promptsFunc: DynamicPromptsFunction = async (
    inquirerPassed: Parameters<DynamicPromptsFunction>[0]
  ): Promise<Answers> => {
    const inquirer: Inquirer = inquirerPassed as unknown as Inquirer;
    inquirer.registerPrompt("autocomplete", autocompletePlugin);

    let promptQueue: PromptQuestion[] = defaultPrompts.slice();
    let allAnswers: Partial<IExtendedAnswers> = {};

    if (pluginContext.cliAnswer) {
      // if some answers are provided externally, use them instead of prompting.
      // if template is provided externally, load template configuration.
      if (pluginContext.cliAnswer?.template) {
        await loadTemplateConfiguration(
          promptQueue,
          pluginContext.cliAnswer.template
        );
      }
      const promptQueueNames: Array<string | undefined> = promptQueue.map(
        (x) => x.name
      );
      allAnswers = pickBy(pluginContext.cliAnswer, (v, k) =>
        promptQueueNames.includes(k)
      );
      // filter out prompts that are provided externally.
      const answeredPrompts: string[] = Object.keys(allAnswers);
      promptQueue = promptQueue.filter((it) => {
        if (it.name) {
          return !answeredPrompts.includes(it.name);
        }
      });
    }

    while (promptQueue.length > 0) {
      const currentPrompt: PromptQuestion = promptQueue.shift()!;

      const hookForCurrentPrompt:
        | SyncHook<
            [PromptQuestion, Partial<IExtendedAnswers>],
            null | undefined
          >
        | undefined = hooks.promptQuestion.get(currentPrompt.name);
      if (hookForCurrentPrompt) {
        const hookResult: null | undefined = hookForCurrentPrompt.call(
          currentPrompt,
          allAnswers
        );
        // hook can return null to skip the prompt
        if (hookResult === null) {
          continue;
        }
      }
      const currentAnswers: Partial<IExtendedAnswers> = await inquirer.prompt(
        [currentPrompt],
        allAnswers
      );

      // when template decided, load template configuration
      if (currentPrompt?.name === "template") {
        await loadTemplateConfiguration(promptQueue, currentAnswers.template!);
      }

      // merge answers
      allAnswers = { ...allAnswers, ...currentAnswers };
    }

    await hooks.answers.promise(allAnswers);

    return allAnswers;
  };

  plop.setGenerator("rush-init-project", {
    description: "Rush init project",
    prompts: promptsFunc,
    actions: (answer) => {
      const { template, projectFolder } = answer as IExtendedAnswers;

      const defaultProjectConfiguration: IDefaultProjectConfiguration =
        templateConfiguration?.defaultProjectConfiguration || {};
      hooks.defaultProjectConfiguration.call(
        defaultProjectConfiguration,
        answer as IExtendedAnswers
      );

      const templatesFolder: string = getTemplatesFolder();
      // glob result is always splitted by slash
      const baseFolder: string = path
        .join(templatesFolder, template)
        .replace(/\\/g, "/");

      const actions: ActionType[] = plopCfg.dryRun
        ? []
        : [
            {
              type: "addMany",
              destination: path.resolve(monorepoRoot, projectFolder),
              base: baseFolder,
              templateFiles: [`**/*`, "!init.config.ts", "!init.config.js"],
              globOptions: {
                cwd: baseFolder,
                dot: true,
                absolute: true,
              },
              data: answer,
            },
            {
              type: "sortPackageJson",
            },
            {
              type: "addProjectToRushJson",
              data: {
                defaultProjectConfiguration,
              },
            },
            {
              type: "runRushUpdate",
            },
          ];

      hooks.actions.call({ actions });

      return actions;
    },
  });
}

function registerActions(plop: NodePlopAPI): void {
  plop.setActionType(
    "addProjectToRushJson",
    (ans: Answers, config: ActionConfig | undefined) => {
      const answers: IExtendedAnswers = ans as IExtendedAnswers;
      const { packageName, projectFolder } = answers;
      const defaultProjectConfiguration: IDefaultProjectConfiguration =
        (
          config?.data as {
            defaultProjectConfiguration: IDefaultProjectConfiguration;
          }
        )?.defaultProjectConfiguration || {};
      if (!packageName) {
        throw new Error("packageName is required");
      }
      if (!projectFolder) {
        throw new Error("projectFolder is required");
      }
      addProjectToRushJson({
        packageName,
        projectFolder,
        defaultProjectConfiguration,
      });
      return `Add ${packageName} to rush.json successfully`;
    }
  );

  plop.setActionType("runRushUpdate", (ans: Answers) => {
    const { shouldRunRushUpdate } = ans as IExtendedAnswers;
    if (!shouldRunRushUpdate) {
      return 'Skip "rush update", please run it manually';
    }
    runRushUpdate();
    return "Run rush update successfully";
  });

  plop.setActionType("sortPackageJson", (ans: Answers) => {
    const { projectFolder } = ans as IExtendedAnswers;
    sortPackageJson(projectFolder);
    return "Sort package.json successfully";
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
