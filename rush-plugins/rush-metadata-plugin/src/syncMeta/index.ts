import { RushConfiguration } from '@rushstack/rush-sdk';
import { loadRushConfiguration } from '../logic/rushConfiguration';
import { log } from 'console';

// Used to sync all the metadata files in the monorepo according to the metadata spec
export const syncMeta = async (): Promise<void> => {
  const rushConfiguration: RushConfiguration = loadRushConfiguration();
  for (const rushProject of rushConfiguration.projects) {
    log('rush project: ', rushProject.projectFolder);
  }
};
