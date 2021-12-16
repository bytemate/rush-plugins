import * as path from "path";
import * as fs from "fs";
import {
  Colors,
  Terminal,
  ConsoleTerminalProvider,
  JsonFile,
  Executable,
  Import,
} from "@rushstack/node-core-library";
import findUp from "find-up";
import ora from "ora";

import type { Packument } from "pacote";
import type { RushConfiguration } from "@rushstack/rush-sdk";

export const upgradeSelf = async (): Promise<void> => {
  const terminal: Terminal = new Terminal(new ConsoleTerminalProvider());

  // FIXME: workaround for rush-sdk
  const rushJsonPath: string | undefined = await findUp("rush.json", {
    cwd: process.cwd(),
  });
  if (!rushJsonPath) {
    throw new Error("Could not find rush.json");
  }
  const monoRoot: string = path.dirname(rushJsonPath);

  const rushJson: any = JsonFile.load(rushJsonPath);
  const { rushVersion } = rushJson;

  const installRunNodeModuleFolder: string = path.join(
    monoRoot,
    `common/temp/install-run/@microsoft+rush@${rushVersion}`
  );
  let RushConfiguration: RushConfiguration | undefined;
  if (fs.existsSync(installRunNodeModuleFolder)) {
    try {
      const rushLibModulePath: string = Import.resolveModule({
        modulePath: "@microsoft/rush-lib",
        baseFolderPath: installRunNodeModuleFolder,
      });
      const rushLib: {
        RushConfiguration: RushConfiguration;
      } = require(rushLibModulePath);
      RushConfiguration = rushLib.RushConfiguration;
    } catch {
      throw new Error(
        `Could not load @microsoft/rush-lib from ${installRunNodeModuleFolder}`
      );
    }
  } else {
    // try {
    // global require
    const rushLib: {
      RushConfiguration: RushConfiguration;
    } = require("@microsoft/rush-lib");
    RushConfiguration = rushLib.RushConfiguration;
    // } catch {}
  }

  if (!RushConfiguration) {
    throw new Error(
      `Could not find RushConfiguration from ${installRunNodeModuleFolder}`
    );
  }

  const rushConfiguration: any = (
    RushConfiguration as any
  ).loadFromDefaultLocation({
    startingFolder: process.cwd(),
  });
  if (!rushConfiguration) {
    throw new Error("Unable to load rush configuration");
  }

  let versions: Packument["versions"] | undefined;
  try {
    const { packument } = await import("pacote");
    const info: Packument = await packument("@microsoft/rush", {
      preferOnline: true,
    });
    versions = info.versions;
  } catch {
    throw new Error("Failed to get versions of @microsoft/rush");
  }

  interface IAnswer {
    version: string;
  }

  const { prompt } = await import("inquirer");
  const answer: IAnswer = await prompt<IAnswer>({
    type: "list",
    name: "version",
    message: "Pick up a target version",
    choices: Object.keys(versions).reverse(),
  });

  const targetVersion: string = answer.version;

  let spinner: ora.Ora | undefined;
  spinner = ora(`Updating rush.json with ${targetVersion}...`).start();

  // const rushJsonPath: string = rushConfiguration.rushJsonFile;
  // const monoRoot: string = rushConfiguration.rushJsonFolder;
  const runRushJSPath: string = path.join(
    rushConfiguration.commonScriptsFolder,
    "install-run-rush.js"
  );
  // const rushJson: any = JsonFile.load(rushJsonPath);
  const oldVersion: string = rushJson.rushVersion;

  rushJson.rushVersion = targetVersion;
  JsonFile.save(rushJson, rushJsonPath, {
    updateExistingFile: true,
  });

  spinner.succeed(`Updated rush.json from ${oldVersion} to ${targetVersion}`);

  spinner = ora("Scanning for package.json files...").start();
  // eslint-disable-next-line @typescript-eslint/typedef
  const fg = await import("fast-glob");

  const allPackageJsonFiles: string[] = fg.sync(["**/package.json"], {
    cwd: monoRoot,
    ignore: ["node_modules/**", "**/node_modules/**", "**/temp/**"],
    absolute: true,
  });

  spinner.succeed(`Found ${allPackageJsonFiles.length} package.json files`);

  spinner = ora(
    "Updating Rush.js related dependencies in package.json files..."
  ).start();

  const depVersionMap: Record<string, string> = {
    "@rushstack/rush-sdk": targetVersion,
  };
  for (const [k, v] of Object.entries<string>(
    versions[targetVersion]!.dependencies!
  )) {
    if (k.startsWith("@microsoft/") || k.startsWith("@rushstack/")) {
      depVersionMap[k] = v;
    }
  }

  const changedPackageJsonFileSet: Set<string> = new Set<string>();
  for (const pkgJsonFile of allPackageJsonFiles) {
    try {
      const json: any = JsonFile.load(pkgJsonFile);
      let changed: boolean = false;
      for (const [pkgName, pkgVersion] of Object.entries(depVersionMap)) {
        if (json.dependencies && json.dependencies[pkgName]) {
          json.dependencies[pkgName] = pkgVersion;
          changed = true;
        }
        if (json.devDependencies && json.devDependencies[pkgName]) {
          json.devDependencies[pkgName] = pkgVersion;
          changed = true;
        }
      }
      if (changed) {
        JsonFile.save(json, pkgJsonFile, {
          onlyIfChanged: true,
        });
        changedPackageJsonFileSet.add(pkgJsonFile);
        terminal.writeVerboseLine(`${pkgJsonFile} updated`);
      }
    } catch {
      terminal.writeWarningLine(
        `${pkgJsonFile} is not a valid JSON file, ignored`
      );
    }
  }

  spinner.succeed(
    `Updated ${changedPackageJsonFileSet.size} package.json files`
  );

  for (const packageJsonFile of changedPackageJsonFileSet) {
    if (packageJsonFile.includes("common/autoinstallers")) {
      const autoinstallerFolder: string = path.dirname(packageJsonFile);
      const autoinstallerName: string = path.basename(autoinstallerFolder);
      spinner = ora(`Updating autoinstaller ${autoinstallerName}`).start();
      try {
        Executable.spawnSync("node", [
          runRushJSPath,
          "update-autoinstaller",
          "--name",
          autoinstallerName,
        ]);
      } catch {
        throw new Error(`Failed to update autoinstaller ${autoinstallerName}`);
      }
      spinner.succeed(`Updated autoinstaller ${autoinstallerName}`);
    }
  }

  interface IShouldRunRushUpdateAnswer {
    shouldRunRushUpdate: boolean;
  }

  const { shouldRunRushUpdate } = await prompt<IShouldRunRushUpdateAnswer>([
    {
      type: "confirm",
      name: "shouldRunRushUpdate",
      message: "Run rush update right now?",
      default: true,
    },
  ]);

  if (shouldRunRushUpdate) {
    terminal.writeLine("Run rush update...");
    try {
      Executable.spawnSync("node", [runRushJSPath, "update"], {
        stdio: "inherit",
      });
    } catch (e) {
      throw new Error("Failed to run rush update");
    }
    terminal.writeLine("Rush update successfully.");
  } else {
    terminal.writeWarningLine("Rush update skipped, please run it manually.");
  }

  terminal.writeLine(Colors.green("ALL DONE!"));
};
