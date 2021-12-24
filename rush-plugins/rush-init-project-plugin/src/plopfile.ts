import { RushConfiguration } from "@microsoft/rush-lib";
import { FileSystem, PackageName } from "@rushstack/node-core-library";
import { Answers, Inquirer } from "inquirer";
import autocompletePlugin from "inquirer-autocomplete-prompt";
import type {
  ActionType,
  DynamicPromptsFunction,
  NodePlopAPI,
  PromptQuestion,
} from "node-plop";
import * as path from "path";
import validatePackageName from "validate-npm-package-name";
import hbsHelpersLib from "handlebars-helpers/lib";
import { addProjectToRushJson } from "./actions/addProjectToRushJson";
import { runRushUpdate } from "./actions/rushRushUpdate";
import { sortPackageJson } from "./actions/sortPackageJson";
import { IHooks, initHooks } from "./hooks";
import { loadRushConfiguration } from "./logic/loadRushConfiguration";
import { TemplateConfiguration } from "./logic/TemplateConfiguration";
import { getTemplateFolder, getTemplateNameList } from "./logic/templateFolder";

interface IExtendedAnswers extends Answers {
  template: string;
  packageName: string;
  unscopedPackageName: string;
  projectFolder: string;
  shouldRunRushUpdate: boolean;
}
interface IPluginContext extends Record<string, any> {}

export default function (plop: NodePlopAPI): void {
  const rushConfiguration: RushConfiguration = loadRushConfiguration();
  const monorepoRoot: string = rushConfiguration.rushJsonFolder;
  const isDryRun: boolean =
    process.argv.includes("--dry-run") || Boolean(process.env.DRY_RUN);

  const hooks: IHooks = initHooks();
  const pluginContext: IPluginContext = {
    isDryRun,
  };

  registerActions(plop);
  registerHelpers(plop);

  const templateFolder: string = getTemplateFolder();
  const templateNameList: string[] = getTemplateNameList(templateFolder);
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
  const promptsFunc: DynamicPromptsFunction = async (
    inquirerPassed: Parameters<DynamicPromptsFunction>[0]
  ): Promise<Answers> => {
    const inquirer: Inquirer = inquirerPassed as unknown as Inquirer;
    inquirer.registerPrompt("autocomplete", autocompletePlugin);

    const promptQueue: PromptQuestion[] = defaultPrompts.slice();
    let allAnswers: Partial<IExtendedAnswers> = {};
    while (promptQueue.length > 0) {
      const currentPrompt: PromptQuestion = promptQueue.shift()!;
      const currentAnswers: Partial<IExtendedAnswers> = await inquirer.prompt(
        [currentPrompt],
        allAnswers
      );

      // when template decided, load template configuration
      if (currentPrompt?.name === "template") {
        const templateConfiguration: TemplateConfiguration =
          await TemplateConfiguration.loadFromTemplate(
            currentAnswers.template!
          );
        for (const prompt of templateConfiguration.prompts) {
          promptQueue.push(prompt);
        }
        for (const plugin of templateConfiguration.plugins) {
          plugin.apply(hooks, pluginContext);
        }
        hooks.plop.call(plop);
        const promptsFromHook: PromptQuestion[] = [];
        await hooks.prompts.promise({
          prompts: promptsFromHook,
          promptQueue,
        });
        for (const promptFromHook of promptsFromHook) {
          promptQueue.push(promptFromHook);
        }
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

      const templateFolder: string = getTemplateFolder();
      const baseFolder: string = path.join(templateFolder, template);

      const actions: ActionType[] = isDryRun
        ? []
        : [
            {
              type: "addMany",
              destination: path.resolve(monorepoRoot, projectFolder),
              base: baseFolder,
              templateFiles: [`${templateFolder}/**/*`, "!init.config.ts"],
              data: answer,
            },
            {
              type: "sortPackageJson",
            },
            {
              type: "addProjectToRushJson",
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
  plop.setActionType("addProjectToRushJson", (ans: Answers) => {
    const answers: IExtendedAnswers = ans as IExtendedAnswers;
    const { packageName, projectFolder } = answers;
    if (!packageName) {
      throw new Error("packageName is required");
    }
    if (!projectFolder) {
      throw new Error("projectFolder is required");
    }
    addProjectToRushJson({
      packageName,
      projectFolder,
    });
    return `Add ${packageName} to rush.json successfully`;
  });

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
