import { RushConfiguration, RushConfigurationProject } from '@rushstack/rush-sdk';
import { loadRushConfiguration } from '../logic/rushConfiguration';
import { initMetaForProject } from './initMetaForProject';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';
import { getCustomMetadataInfo } from '../logic/customMeta';

// Used to initialize a metadata file for a package
export const initMeta = async ({ project, all }: { project?: string; all?: boolean }): Promise<void> => {
  const rushConfiguration: RushConfiguration = loadRushConfiguration();

  if (project) {
    const rushProject: RushConfigurationProject | undefined = rushConfiguration.getProjectByName(project);
    if (!rushProject) {
      throw new Error(`Could not find project with package name ${project}`);
    }
    await initMetaForProject(rushProject, true);
  } else if (all) {
    const allRushProjects: RushConfigurationProject[] = rushConfiguration.projects;
    // Look for custom plugin configurations
    const { metadataFileName } = getCustomMetadataInfo();
    for (const rushProject of allRushProjects) {
      // Check if metadata file exists already
      const { projectFolder } = rushProject;
      const metaFilePath: string = path.join(projectFolder, metadataFileName);
      if (!fs.existsSync(metaFilePath)) {
        // Only initialize for projects that don't already have a metadata file
        await initMetaForProject(rushProject, false);
      }
    }
  } else {
    console.log(
      chalk.red(
        'Please specify a project with the --project parameter, or --all to initialize metadata for all packages.'
      )
    );
  }
};
