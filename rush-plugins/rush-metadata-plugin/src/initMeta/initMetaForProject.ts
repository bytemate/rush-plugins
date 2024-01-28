import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

import { RushConfigurationProject } from '@rushstack/rush-sdk';
import { getAllMetadataFields, getCustomMetadataInfo } from '../logic/customMeta';
import { IMetadataField } from '../types/metadataField';
import { queryFields } from './queryFields';
import { JsonFile } from '@rushstack/node-core-library';
import { outputToReadme } from '../transformers/outputToReadme';

export const initMetaForProject = async (
  rushProject: RushConfigurationProject,
  queryForAnswers: boolean
): Promise<void> => {
  const { projectFolder } = rushProject;

  // Look for custom plugin configurations
  const { metadataFileName } = getCustomMetadataInfo();

  // Check if metadata file exists already
  const metaFilePath: string = path.join(projectFolder, metadataFileName);

  if (fs.existsSync(metaFilePath)) {
    console.log(chalk.red('Please run rush meta update or edit the metadata file directly to make updates'));
    return;
  }

  const allFields: IMetadataField[] = getAllMetadataFields();

  let answers: Record<string, string | string[]>;
  if (queryForAnswers) {
    answers = await queryFields(allFields);

    if (answers.pointOfContact) {
      const enteredPointsOfContact: string = answers.pointOfContact as string;
      answers.pointOfContact = enteredPointsOfContact.split(',').map((s) => s.trim());
    }
  } else {
    answers = {};
    for (const field of allFields) {
      answers[field.name] = '';
    }
  }

  JsonFile.save(answers, metaFilePath, { ensureFolderExists: true });

  const readmeAbsoluteFilePath: string = path.join(rushProject.projectFolder, 'README.md');
  outputToReadme(answers, readmeAbsoluteFilePath);
};
