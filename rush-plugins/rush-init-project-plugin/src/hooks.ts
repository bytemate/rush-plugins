import { AsyncSeriesHook, HookMap, SyncHook } from "tapable";

import type { Answers } from "inquirer";
import type { ActionType, NodePlopAPI, PromptQuestion } from "node-plop";
import type { IDefaultProjectConfiguration } from "./logic/TemplateConfiguration";

export interface IPromptsHookParams {
  /**
   * The queue of prompt question. and question will be prompt to use in sequence order
   */
  promptQueue: PromptQuestion[];
}

export interface IActionsHookParams {
  /**
   * A list of plop action. These actions will be registered into plop
   */
  actions: ActionType[];
}

export interface IHooks {
  prompts: AsyncSeriesHook<IPromptsHookParams>;
  actions: SyncHook<IActionsHookParams>;
  answers: AsyncSeriesHook<Answers>;
  plop: SyncHook<NodePlopAPI>;
  promptQuestion: HookMap<
    SyncHook<[PromptQuestion, Answers], null | undefined>
  >;
  defaultProjectConfiguration: SyncHook<
    [IDefaultProjectConfiguration, Answers]
  >;
}

export const initHooks = (): IHooks => {
  return {
    prompts: new AsyncSeriesHook<IPromptsHookParams>(["promptsHookParams"]),
    answers: new AsyncSeriesHook<Answers>(["answers"]),
    actions: new SyncHook<IActionsHookParams>(["actionsHookParams"]),
    plop: new SyncHook<NodePlopAPI>(["plop"]),
    promptQuestion: new HookMap(
      (key: string) =>
        new SyncHook<[PromptQuestion, Answers], null | undefined>([
          "promptQuestion",
          "answersSoFar",
        ])
    ),
    defaultProjectConfiguration: new SyncHook<
      [IDefaultProjectConfiguration, Answers]
    >(["defaultProjectConfiguration", "answers"]),
  };
};
