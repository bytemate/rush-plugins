import fs from 'fs';
import path from 'path';

import { RushConfiguration, RushConfigurationProject } from "@rushstack/rush-sdk";
import { loadRushConfiguration } from "../logic/rushConfiguration";
import { log } from 'console';
import { JsonFile } from '@rushstack/node-core-library';
import { ICoreMetadata } from '../template';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { getCustomMetadataInfo } from '../logic/customMeta';
import DefaultFields from '../defaultMetadataFields.json';
import { IMetadataField } from '../types/metadataField';
import { queryFields } from './queryFields';

export const initMeta = async ({project}: {project: string}): Promise<void> => {

  const rushConfiguration: RushConfiguration = loadRushConfiguration();
  const monoRoot: string = rushConfiguration.rushJsonFolder;
  const rushProject: RushConfigurationProject | undefined =
    rushConfiguration.getProjectByName(project);
  if (!rushProject) {
    throw new Error(`Could not find project with package name ${project}`);
  }
  const { projectFolder, projectRelativeFolder } = rushProject;

  // Look for custom plugin configurations
  const { metadataFileName, fields } = getCustomMetadataInfo({
    monoRoot,
    packageName: project
  })

  // Check if metadata file exists already
  const metaFilePath: string = path.join(projectFolder, metadataFileName);

  if (fs.existsSync(metaFilePath)) {
    log('file already exists at location! ', metaFilePath);

    // Read and parse the file
    // const loadedJsonFile: ICoreMetadata = JsonFile.load(metaFilePath);

    log(chalk.red("Please run rush meta update or edit the metadata file directly to make updates"));

    return;

  }

  // Load default fields
  const { fields: defaultFields }: { fields: IMetadataField[] } = DefaultFields as { fields: IMetadataField[] };
  log('Default fields: ', defaultFields);

  console.log('fields', fields)

  // join the custom and default fields
  const allFields: IMetadataField[] = [...defaultFields, ...fields];

  const answers: Record<string, string> = await queryFields(allFields);
  log('Returned answers: ', answers);
    // const metadataContents: ICoreMetadata = {
    //   // description: 'test description',
    //   // pointOfContact: ''
    // };
    // JsonFile.save(metadataContents, metaFilePath);

}