import type { IConfig, IHooks, IAnswers, PromptQuestion } from "../../autoinstallers/command-plugins/node_modules/rush-init-project-plugin";

const config: IConfig = {
  prompts: [],
  plugins: [
    {
      apply: (hooks: IHooks) => {
        hooks.promptQuestion.for("projectFolder").tap("command-plugin", (promptQuestion: PromptQuestion, answersSoFar: IAnswers) => {
          const { unscopedPackageName } = answersSoFar;
          promptQuestion.default = `rush-plugins/${unscopedPackageName}`
        });
      },
    },
  ],
};

export default config;