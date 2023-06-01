import { RushConfiguration } from '@rushstack/rush-sdk';
import { JsonFile } from '@rushstack/node-core-library';
import { log } from 'console';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';

import { loadRushConfiguration } from '../logic/rushConfiguration';
import { getCustomMetadataInfo } from '../logic/customMeta';
import { ICoreMetadata } from '../template';
import { syncMetadataFile } from './syncMetadataFile';

// Used to sync all the metadata files in the monorepo according to the metadata spec
export const syncMeta = async (): Promise<void> => {
  const rushConfiguration: RushConfiguration = loadRushConfiguration();
  for (const rushProject of rushConfiguration.projects) {
    log('rush project: ', rushProject.projectFolder);

    // Look for custom plugin configurations
    const { metadataFileName, fields } = getCustomMetadataInfo();

    // Check if metadata file exists already
    const metaFilePath: string = path.join(rushProject.projectFolder, metadataFileName);
    if (fs.existsSync(metaFilePath)) {
      // Read and parse the file
      const loadedJsonFile: ICoreMetadata = JsonFile.load(metaFilePath);

      log(chalk.green(`Updating metadata file at: ${metaFilePath}`));

      const newMetadataFile: any = syncMetadataFile(loadedJsonFile);

      JsonFile.save(newMetadataFile, metaFilePath, { updateExistingFile: true });
    }
  }
};
