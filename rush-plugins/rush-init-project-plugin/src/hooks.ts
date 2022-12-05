import { AsyncSeriesHook, HookMap, SyncHook } from "tapable";

import type { ActionType, NodePlopAPI, PromptQuestion } from "node-plop";
import type { IDefaultProjectConfiguration } from "./logic/TemplateConfiguration";
import type { IExtendedAnswers } from "./plopfile";

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

type IAnswers = IExtendedAnswers

export type IResult = 'Succeeded' | 'Failed';

export interface IHooks {
  prompts: AsyncSeriesHook<IPromptsHookParams>;
  actions: SyncHook<IActionsHookParams>;
  answers: AsyncSeriesHook<IAnswers>;
  plop: SyncHook<NodePlopAPI>;
  promptQuestion: HookMap<
    SyncHook<[PromptQuestion, IAnswers], null | undefined>
  >;
  defaultProjectConfiguration: SyncHook<
    [IDefaultProjectConfiguration, IAnswers]
  >;
  done: AsyncSeriesHook<[IResult, IAnswers]>;
}

const initHooks = (): IHooks => {
  return {
    prompts: new AsyncSeriesHook<IPromptsHookParams>(["promptsHookParams"]),
    answers: new AsyncSeriesHook<IAnswers>(["answers"]),
    actions: new SyncHook<IActionsHookParams>(["actionsHookParams"]),
    plop: new SyncHook<NodePlopAPI>(["plop"]),
    promptQuestion: new HookMap(
      (key: string) =>
        new SyncHook<[PromptQuestion, IAnswers], null | undefined>([
          "promptQuestion",
          "answersSoFar",
        ])
    ),
    defaultProjectConfiguration: new SyncHook<
      [IDefaultProjectConfiguration, IAnswers]
    >(["defaultProjectConfiguration", "answers"]),
    done: new AsyncSeriesHook<[IResult, IAnswers]>(["result", "answers"]),
  };
};

const hooks: IHooks = initHooks();

export const getHooks: () => IHooks = (): IHooks => {
  return hooks;
}