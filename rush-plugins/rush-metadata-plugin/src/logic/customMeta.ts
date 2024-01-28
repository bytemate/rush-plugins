import { RushConfiguration } from '@rushstack/rush-sdk';
import path from 'path';

import { loadRushConfiguration } from './rushConfiguration';
import { JsonFile, FileSystem } from '@rushstack/node-core-library';
import { IMetadataField } from '../types/metadataField';
import { IPluginConfig } from '../types/pluginConfig';
import DefaultFields from '../defaultMetadataFields.json';

export const getDefaultMetadataFileName = (): string => {
  // Load default fields
  const { metadataFileName }: { metadataFileName: string } = DefaultFields;

  return metadataFileName;
};

export const getDefaultCodeownersFileName = (): string => {
  const { codeownersFileName }: { codeownersFileName: string } = DefaultFields;
  return codeownersFileName;
};

export interface ICustomMetadataInfo {
  metadataFileName: string;
  codeownersFileName: string;
  fields: IMetadataField[];
}
export const getCustomMetadataInfo = (): ICustomMetadataInfo => {
  const rushConfiguration: RushConfiguration = loadRushConfiguration();

  const pluginOptionsJsonFilePath: string = path.join(
    rushConfiguration.rushPluginOptionsFolder,
    'rush-metadata-plugin.json'
  );

  // Custom configurations for plugin
  let metadataRelativeFolder: string = getDefaultMetadataFileName();
  let codeownersFileName: string = getDefaultCodeownersFileName();
  let customFields: IMetadataField[] = [];

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
    if (metaConfigs.codeownersFileName) {
      codeownersFileName = metaConfigs.codeownersFileName;
    }
    if (metaConfigs.fields) {
      customFields = metaConfigs.fields;
    }
  }

  return {
    metadataFileName: metadataRelativeFolder,
    codeownersFileName,
    fields: customFields
  };
};

export const getAllMetadataFields = (): IMetadataField[] => {
  // Look for custom plugin configurations
  const { fields } = getCustomMetadataInfo();

  // Load default fields
  const { fields: defaultFields }: { fields: IMetadataField[] } = DefaultFields as {
    fields: IMetadataField[];
  };

  // join the custom and default fields
  const allFields: IMetadataField[] = [...defaultFields, ...fields];

  return allFields;
};
