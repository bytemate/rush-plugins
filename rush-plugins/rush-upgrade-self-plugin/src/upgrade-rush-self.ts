import * as path from "path";
import {
  Terminal,
  ConsoleTerminalProvider,
  JsonFile,
  Executable,
} from "@rushstack/node-core-library";
import { RushConfiguration, RushConstants } from "@rushstack/rush-sdk";
import type { Packument } from "pacote";

export const upgradeRushSelf = async (): Promise<void> => {
  const terminal: Terminal = new Terminal(new ConsoleTerminalProvider());

  const rushConfiguration: RushConfiguration =
    RushConfiguration.loadFromDefaultLocation({
      startingFolder: process.cwd(),
    });
  if (!rushConfiguration) {
    throw new Error("Unable to load rush configuration");
  }

  let versions: Packument["versions"] | undefined;
  try {
    const { packument } = await import("pacote");
    const info = await packument("@microsoft/rush", {
      preferOnline: true,
    });
    versions = info.versions;
  } catch {
    throw new Error("Failed to get versions of @microsoft/rush");
  }

  type Answer = {
    version: string;
  };

  const { prompt } = await import("inquirer");
  const answer: Answer = await prompt<Answer>({
    type: "list",
    name: "version",
    message: "Pick up a target version",
    choices: Object.keys(versions),
  });

  const targetVersion: string = answer.version;

  terminal.writeLine(`Upgrading to ${targetVersion}...`);

  const rushJsonPath: string = rushConfiguration.rushJsonFile;
  const monoRoot: string = rushConfiguration.rushJsonFolder;
  const runRushJSPath: string = path.join(
    rushConfiguration.commonScriptsFolder,
    "install-run-rush.js"
  );
  const rushJson: any = JsonFile.load(rushJsonPath);
  const oldVersion: string = rushJson.rushVersion;

  rushJson.rushVersion = targetVersion;
  JsonFile.save(rushJson, rushJsonPath, {
    updateExistingFile: true,
  });

  terminal.writeLine(
    `Successfully upgraded from ${oldVersion} to ${targetVersion}`
  );

  terminal.writeLine("Scanning for package.json files... It may take a while.");

  const fg = await import("fast-glob");

  const allPackageJsonFiles = fg.sync(["**/package.json"], {
    cwd: monoRoot,
    ignore: ["node_modules/**", "**/node_modules/**", "**/temp/**"],
    absolute: true,
  });

  terminal.writeLine(
    "Upgrading Rush.js related dependencies in package.json files..."
  );

  const depVersionMap: Record<string, string> = {};
  for (const [k, v] of Object.entries<string>(
    versions[targetVersion]!.dependencies!
  )) {
    if (k.startsWith("@microsoft/") || k.startsWith("@rushstack/")) {
      depVersionMap[k] = v;
    }
  }
  terminal.writeVerboseLine(
    `rush related deps:\n${JSON.stringify(depVersionMap, null, 2)}`
  );

  const changedPackageJsonFileSet = new Set<string>();
  for (const pkgJsonFile of allPackageJsonFiles) {
    const json = JsonFile.load(pkgJsonFile);
    let changed = false;
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
  }

  terminal.writeLine(
    `${changedPackageJsonFileSet.size} package.json files updated`
  );

  for (const packageJsonFile of changedPackageJsonFileSet) {
    if (packageJsonFile.includes("common/autoinstallers")) {
      const autoinstallerFolder = path.dirname(packageJsonFile);
      const autoinstallerName = path.basename(autoinstallerFolder);
      terminal.writeVerboseLine(`update autoinstaller ${autoinstallerFolder}`);
      try {
        Executable.spawnSync(runRushJSPath, [
          "update-autoinstaller",
          `--name ${autoinstallerName}`,
        ]);
      } catch {
        throw new Error(
          `Failed to update autoinstaller ${autoinstallerFolder}`
        );
      }
      terminal.writeLine(`Updated autoinstaller ${autoinstallerFolder}`);
    }
  }

  type ShouldRunRushUpdateAnswer = {
    shouldRunRushUpdate: boolean;
  };

  const { shouldRunRushUpdate } = await prompt<ShouldRunRushUpdateAnswer>([
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
      Executable.spawnSync(runRushJSPath, ["update"], {
        stdio: "ignore",
      });
    } catch (e) {
      throw new Error("Failed to run rush update");
    }
    terminal.writeLine("Rush update successfully.");
  } else {
    terminal.writeLine("Rush update skipped, please run it manually.");
  }

  terminal.writeLine("Upgrade rush self all done!");
};
