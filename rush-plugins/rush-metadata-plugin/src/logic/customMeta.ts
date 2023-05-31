import { RushConfiguration } from "@rushstack/rush-sdk";
import path from 'path';

import { loadRushConfiguration } from "./rushConfiguration";
import { JsonFile, FileSystem } from "@rushstack/node-core-library";
import { ICustomMetadataField } from "../types/metadataField";
import { IPluginConfig } from "../types/pluginConfig";

export const defaultMetadataRelativeFolder: string = 'incorrect-package-meta.json';

export interface IGetCustomMetadataInfoParams {
  monoRoot: string;
  packageName: string;
}

export const getCustomMetadataInfo = ({ monoRoot, packageName }: IGetCustomMetadataInfoParams): IPluginConfig => {

  const rushConfiguration: RushConfiguration = loadRushConfiguration();

  const pluginOptionsJsonFilePath: string = path.join(
    rushConfiguration.rushPluginOptionsFolder,
    'rush-metadata-plugin.json'
  )

  // Custom configurations for plugin
  let metadataRelativeFolder: string = defaultMetadataRelativeFolder;
  let customFields: ICustomMetadataField[] = [];

  let metaConfigs: IPluginConfig | undefined;
  try {
    metaConfigs = JsonFile.load(pluginOptionsJsonFilePath);
  } catch (e) {
    if (!FileSystem.isNotExistError(e as Error)) {
      throw e;
    }
  }
  if (metaConfigs) {
    if (metaConfigs.metadataFileName) {
      metadataRelativeFolder = metaConfigs.metadataFileName;
    }
    if (metaConfigs.fields) {
      customFields = metaConfigs.fields;
    }
  }

  console.log('custom metadata folder: ', metadataRelativeFolder);

  return {
    metadataFileName: metadataRelativeFolder,
    fields: customFields
  }
}