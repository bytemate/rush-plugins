import * as path from "path";
import { PackageName, IParsedPackageName, JsonFile } from "@rushstack/node-core-library";
import { RushConfiguration } from "@rushstack/rush-sdk";
import { loadRushConfiguration } from "./rushConfiguration";

export const graveyardRelativeFolder: string = "common/_graveyard";

export interface IGraveyardInfo {
  tarballFolder: string;
  tarballRelativeFolder: string;
  tarballName: string;
}

export interface IGetGraveyardInfoParams {
  monoRoot: string;
  packageName: string;
}

export interface IArchiveConfig {
  graveyardFolder?: string
}

export const getGraveyardInfo = ({
  monoRoot,
  packageName
}: IGetGraveyardInfoParams): IGraveyardInfo => {
  const rushConfiguration: RushConfiguration = loadRushConfiguration();
  // Check for config file

  const pluginOptionsJsonFilePath: string = path.join(
    rushConfiguration.rushPluginOptionsFolder,
    `rush-archive-project-plugin.json`
  );

  try {
  const archiveConfigs: IArchiveConfig | undefined = JsonFile.load(pluginOptionsJsonFilePath);

    console.log(
      `Found target graveyard in ${pluginOptionsJsonFilePath}`
    );

    console.log('configs: ', archiveConfigs);
    process.exit(1);
  } catch (e) {}

  const parsedPackageName: IParsedPackageName = PackageName.parse(packageName);
  const tarballRelativeFolder: string = path.join(
    graveyardRelativeFolder,
    parsedPackageName.scope
  );
  const tarballFolder: string = path.join(monoRoot, tarballRelativeFolder);
  console.log({
    tarballFolder,
    tarballRelativeFolder,
    tarballName: `${parsedPackageName.unscopedName}.tar.gz`,
  });
  return {
    tarballFolder,
    tarballRelativeFolder,
    tarballName: `${parsedPackageName.unscopedName}.tar.gz`,
  };
};