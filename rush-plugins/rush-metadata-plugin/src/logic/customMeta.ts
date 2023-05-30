import { RushConfiguration } from "@rushstack/rush-sdk";
import path from 'path';

import { loadRushConfiguration } from "./rushConfiguration";
import { JsonFile, FileSystem } from "@rushstack/node-core-library";

export const defaultMetadataRelativeFolder: string = 'incorrect-package-meta.json';

export interface IGetCustomMetadataInfoParams {
  monoRoot: string;
  packageName: string;
}

export interface ICustomMetadata {
  metadataFileName: string;
  fields: any[];
}

export const getCustomMetadataInfo = ({ monoRoot, packageName }: IGetCustomMetadataInfoParams): ICustomMetadata => {

  const rushConfiguration: RushConfiguration = loadRushConfiguration();

  const pluginOptionsJsonFilePath: string = path.join(
    rushConfiguration.rushPluginOptionsFolder,
    'rush-metadata-plugin.json'
  )

  let metadataRelativeFolder: string = defaultMetadataRelativeFolder;
  let metaConfigs: ICustomMetadata | undefined;
  try {
    metaConfigs = JsonFile.load(pluginOptionsJsonFilePath);
  } catch (e) {
    if (!FileSystem.isNotExistError(e as Error)) {
      throw e;
    }
  }

  if (metaConfigs?.metadataFileName) {
    metadataRelativeFolder = metaConfigs.metadataFileName;
  }

  console.log('custom metadata folder: ', metadataRelativeFolder);

  return {
    metadataFileName: metadataRelativeFolder,
    fields: []
  }
}