export type {
  IPlugin,
  IConfig,
  IPluginContext,
  IDefaultProjectConfiguration,
} from "./logic/TemplateConfiguration";
export type { IHooks, IActionsHookParams, IPromptsHookParams, IResult } from "./hooks";
export type { NodePlopAPI, PromptQuestion } from "node-plop";
export type { IExtendedAnswers as IAnswers } from "./plopfile";
export * from "./terminal";
