import type { Answers } from "inquirer";
import type { ActionType, NodePlopAPI, PromptQuestion } from "node-plop";
import { AsyncSeriesHook, SyncHook } from "tapable";

interface IPromptsHookParams {
  prompts: PromptQuestion[];
  promptQueue: PromptQuestion[];
}

interface IActionsHookParams {
  actions: ActionType[];
}

export interface IHooks {
  prompts: AsyncSeriesHook<IPromptsHookParams>;
  actions: SyncHook<IActionsHookParams>;
  answers: AsyncSeriesHook<Answers>;
  plop: SyncHook<NodePlopAPI>;
}

export const initHooks = (): IHooks => {
  return {
    prompts: new AsyncSeriesHook<IPromptsHookParams>(["promptsHookParams"]),
    answers: new AsyncSeriesHook<Answers>(["answers"]),
    actions: new SyncHook<IActionsHookParams>(["actionsHookParams"]),
    plop: new SyncHook<NodePlopAPI>(["plop"]),
  };
};
