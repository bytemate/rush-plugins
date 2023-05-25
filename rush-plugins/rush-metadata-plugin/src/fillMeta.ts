import fs from 'fs';
import path from 'path';

import { RushConfiguration, RushConfigurationProject } from "@rushstack/rush-sdk";
import { loadRushConfiguration } from "./logic/rushConfiguration";
import { log } from 'console';

const META_FILE_NAME: string = 'project-metadata.json';

export const fillMeta = async ({project}: {project: string}): Promise<void> => {
  console.log('creating metadata for project: ', project);
  const rushConfiguration: RushConfiguration = loadRushConfiguration();
  const rushProject: RushConfigurationProject | undefined =
    rushConfiguration.getProjectByName(project);
  if (!rushProject) {
    throw new Error(`Could not find project with package name ${project}`);
  }
  const { projectFolder, projectRelativeFolder } = rushProject;
  console.log('projecrt folder: ', projectFolder, projectRelativeFolder);

  // Check if metadata file exists already
  const metaFilePath: string = path.join(projectFolder, META_FILE_NAME);
  console.log('Checking metadata file: ', metaFilePath);
  if (fs.existsSync(metaFilePath)) {
    log('file exists at location: ', metaFilePath);
  } else {
    log('Creating metadata file at location: ', metaFilePath);
  }
}