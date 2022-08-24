import { Colors, Terminal } from "@rushstack/node-core-library";
import chalk from "chalk";
import type { Answers } from "inquirer";
import type { NodePlopAPI, PlopGenerator } from "node-plop";
import nodePlop from "node-plop";
import ora, { Ora } from "ora";
import * as path from "path";
import { TerminalSingleton } from "./terminal";

export interface ICliParams {
  answer?: string | Record<string, string>;
  verbose: boolean;
  dryRun: boolean;
}

export const initProject = async (params: ICliParams): Promise<void> => {
  const terminal: Terminal = TerminalSingleton.getInstance();
  // validate if external answer is valid JSON
  if (params.answer && typeof params.answer === "string") {
    try {
      params.answer = JSON.parse(params.answer);
    } catch (error: any) {
      params.answer = "";
      terminal.writeErrorLine(`Invalid JSON answer: ${error?.message}`);
    }
  }
  const plopfilePath: string = path.join(__dirname, "./plopfile.js");

  const plop: NodePlopAPI = nodePlop(plopfilePath, {
    destBasePath: process.cwd(),
    force: false,
    ...params,
  });

  const generators: { name: string; description: string }[] =
    plop.getGeneratorList();

  if (generators.length !== 1) {
    throw new Error(
      "It should never run into this line. Please report to the author."
    );
  }

  const generator: PlopGenerator = plop.getGenerator(generators[0].name);
  await doThePlop(generator, []);

  TerminalSingleton.getInstance().writeLine(Colors.green("ALL DONE!"));
};

async function doThePlop(
  generator: PlopGenerator,
  bypassArr: string[]
): Promise<void> {
  const spinner: Ora = ora();
  const answers: Answers = await generator.runPrompts(bypassArr);
  const noMap: boolean = false;
  let failedActions: boolean = false;
  await generator.runActions(answers, {
    onComment: (msg) => {
      spinner.info(msg);
      spinner.start();
    },
    onSuccess: (change) => {
      let line: string = "";
      if (change.type) {
        line += ` ${typeMap(change.type, noMap)}`;
      }
      if (change.path) {
        line += ` ${change.path}`;
      }
      spinner.succeed(line);
      spinner.start();
    },
    onFailure: (failure) => {
      let line: string = "";
      if (failure.type) {
        line += ` ${typeMap(failure.type, noMap)}`;
      }
      if (failure.path) {
        line += ` ${failure.path}`;
      }
      const errMsg: string = failure.error || failure.message;
      if (errMsg) {
        line += ` ${errMsg}`;
      }
      spinner.fail(line);
      failedActions = true;
      spinner.start();
    },
  });
  spinner.stop();
  if (failedActions) {
    throw new Error("Failed to init project");
  }
}

const typeDisplay: Record<string, string> = {
  function: chalk.yellow("->"),
  add: chalk.green("++"),
  addMany: chalk.green("+!"),
  modify: `${chalk.green("+")}${chalk.red("-")}`,
  append: chalk.green("_+"),
  skip: chalk.green("--"),
};
function typeMap(name: string, noMap: boolean): string {
  const dimType: string = chalk.dim(name);
  if (!noMap && name in typeDisplay) {
    return typeDisplay[name as keyof typeof typeDisplay];
  }
  return dimType;
}
