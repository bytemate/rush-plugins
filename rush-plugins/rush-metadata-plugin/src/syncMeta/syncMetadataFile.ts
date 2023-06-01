import { getAllMetadataFields } from '../logic/customMeta';
import { ICoreMetadata } from '../template';

export const syncMetadataFile = (currMetadata: ICoreMetadata): void => {
  const allFields = getAllMetadataFields();

  console.log('syncing file: ', currMetadata);
};
