import fs from 'fs';
import path from 'path';

import { RushConfiguration, RushConfigurationProject } from '@rushstack/rush-sdk';
import { loadRushConfiguration } from '../logic/rushConfiguration';
import { log } from 'console';
import chalk from 'chalk';
import { getAllMetadataFields, getCustomMetadataInfo } from '../logic/customMeta';
import { IMetadataField } from '../types/metadataField';
import { queryFields } from './queryFields';
import { JsonFile } from '@rushstack/node-core-library';
import { outputToReadme } from '../transformers/outputToReadme';

// Used to initialize a metadata file for a package
export const initMeta = async ({ project }: { project: string }): Promise<void> => {
  const rushConfiguration: RushConfiguration = loadRushConfiguration();
  const rushProject: RushConfigurationProject | undefined = rushConfiguration.getProjectByName(project);
  if (!rushProject) {
    throw new Error(`Could not find project with package name ${project}`);
  }
  const { projectFolder } = rushProject;

  // Look for custom plugin configurations
  const { metadataFileName } = getCustomMetadataInfo();

  // Check if metadata file exists already
  const metaFilePath: string = path.join(projectFolder, metadataFileName);

  if (fs.existsSync(metaFilePath)) {
    log(chalk.red('Please run rush meta update or edit the metadata file directly to make updates'));
    return;
  }

  const allFields: IMetadataField[] = getAllMetadataFields();

  const answers: Record<string, string | string[]> = await queryFields(allFields);

  if (answers.pointOfContact) {
    const enteredPointsOfContact: string = answers.pointOfContact as string;
    answers.pointOfContact = enteredPointsOfContact.split(',').map((s) => s.trim());
  }

  JsonFile.save(answers, metaFilePath, { ensureFolderExists: true });

  const readmeAbsoluteFilePath: string = path.join(rushProject.projectFolder, 'README.md');
  outputToReadme(answers, readmeAbsoluteFilePath);
};
