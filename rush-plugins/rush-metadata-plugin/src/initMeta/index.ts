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

export const initMeta = async ({project}: {project: string}): Promise<void> => {

  const rushConfiguration: RushConfiguration = loadRushConfiguration();
  const monoRoot: string = rushConfiguration.rushJsonFolder;
  const rushProject: RushConfigurationProject | undefined =
    rushConfiguration.getProjectByName(project);
  if (!rushProject) {
    throw new Error(`Could not find project with package name ${project}`);
  }
  const { projectFolder, projectRelativeFolder } = rushProject;

  // Load default fields
  const { fields: defaultFields } = JsonFile.load(path.relative("../defaultMetadataFields.json"));
  log('Default fields: ', defaultFields);

  // Look for custom plugin configurations
  const { metadataFileName, fields } = getCustomMetadataInfo({
    monoRoot,
    packageName: project
  })

  console.log('fields', fields)

  // Check if metadata file exists already
  const metaFilePath: string = path.join(projectFolder, metadataFileName);

  if (fs.existsSync(metaFilePath)) {
    log('file exists at location: ', metaFilePath);

    // Read and parse the file
    const loadedJsonFile: ICoreMetadata = JsonFile.load(metaFilePath);

    log('Loaded metadata file: ', loadedJsonFile.purpose);

  } else {
    log('Creating metadata file at location: ', metaFilePath);
    log(chalk.green(`Creating a new metadata file for project: ${project}...`));
    const answers: any = await inquirer.prompt([
      {
        type: 'input',
        name: 'purpose',
        message: 'What is the purpose of this package?'
      },
      {
        type: 'input',
        name: 'pointOfContact',
        message: 'Who are the POCs of this package? (Separated by ",")'
      },
      {
        type: 'input',
        name: 'projectGroup',
        message: 'What is the project group for this package?'
      },
      {
        type: 'list',
        name: 'targetRuntime',
        choices: ['node', 'browser', 'cli'],
        message: 'What is the target runtime?'
      },
      {
        type: 'list',
        name: 'riskLevel',
        choices: [
          '0 - Low Risk (Internal Library)',
          '1 - Medium Risk (External Library)',
          '2 - High Risk (Production Application)'
        ],
        message: 'What is the Risk Level of this package?'
      }
    ]);
    console.log('The answers entered are: ', answers);
    const {confirmAnswers}: any = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmAnswers',
        message: 'Do you want to save the above answers to the metadata file?'
      }
    ])
    if (!confirmAnswers) {
      console.log('Discarding answers...');
      return;
    }
    // const metadataContents: ICoreMetadata = {
    //   // description: 'test description',
    //   // pointOfContact: ''
    // };
    // JsonFile.save(metadataContents, metaFilePath);
  }
}