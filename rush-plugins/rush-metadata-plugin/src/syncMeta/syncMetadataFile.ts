import { getAllMetadataFields } from '../logic/customMeta';
import { ICoreMetadata } from '../template';
import { IMetadataField } from '../types/metadataField';

export const syncMetadataFile = (currMetadata: any): ICoreMetadata => {
  const allFields: IMetadataField[] = getAllMetadataFields();
  const newMetadata: any = {};

  for (const field of allFields) {
    // @ts-ignore
    if (field.required && !currMetadata[field.name]) {
      // Fill in the field with a default value
      newMetadata[field.name] = '';
    } else if (!field.required && !currMetadata[field.name]) {
      // Don't care if the field doesn't exist on a field that is not required
    } else {
      newMetadata[field.name] = currMetadata[field.name];
    }
  }

  return newMetadata;
};
