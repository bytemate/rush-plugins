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
import { outputToReadme } from '../transformers/outputToReadme';

// Used to sync all the metadata files in the monorepo according to the metadata spec
export const syncMeta = async (): Promise<void> => {
  const rushConfiguration: RushConfiguration = loadRushConfiguration();
  for (const rushProject of rushConfiguration.projects) {
    log('rush project: ', rushProject.projectFolder);

    // Look for custom plugin configurations
    const { metadataFileName } = getCustomMetadataInfo();

    // Check if metadata file exists already
    const metaFilePath: string = path.join(rushProject.projectFolder, metadataFileName);
    let newMetadataFile: any;
    if (fs.existsSync(metaFilePath)) {
      // Read and parse the file
      const loadedJsonFile: ICoreMetadata = JsonFile.load(metaFilePath);

      log(chalk.green(`Updating metadata file at: ${metaFilePath}`));

      newMetadataFile = syncMetadataFile(loadedJsonFile);

      JsonFile.save(newMetadataFile, metaFilePath, { updateExistingFile: true });

      const readmeAbsoluteFilePath: string = path.join(rushProject.projectFolder, 'README.md');
      outputToReadme(loadedJsonFile, readmeAbsoluteFilePath);
    }
  }
};
