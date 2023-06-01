// Run by the "rush meta sync" command
// Syncs all the metadata files in a monorepo according to the metadata spec.

import { log } from 'console';

export const syncMeta = async (): Promise<void> => {
  log('Syncing metadata...');
};
