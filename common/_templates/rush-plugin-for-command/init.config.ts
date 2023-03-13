import type {
  IConfig,
  IHooks,
  IAnswers,
  PromptQuestion
} from '../../autoinstallers/command-plugins/node_modules/rush-init-project-plugin';

const config: IConfig = {
  prompts: [],
  plugins: [
    {
      apply: (hooks: IHooks) => {
        hooks.promptQuestion
          .for('projectFolder')
          .tap('command-plugin', (promptQuestion: PromptQuestion, answersSoFar: IAnswers) => {
            const { unscopedPackageName } = answersSoFar;
            promptQuestion.default = `rush-plugins/${unscopedPackageName}`;
            return undefined;
          });
        // hooks.done.tapPromise("command-plugin", async (result, answers) => {
        //   await new Promise<void>((resolve) => {
        //     setTimeout(() => {
        //       console.log(result, answers);
        //     }, 1000);
        //     resolve();
        //   });
        // });
      }
    }
  ],
  defaultProjectConfiguration: {}
};

export default config;
