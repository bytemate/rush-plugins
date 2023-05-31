import { ICustomMetadataField } from "./types/metadataField";


// This function takes in the custom fields defined in a specific monorepo and generates
// a JSON schema that can be uploaded to a custom server and referenced in the metadata files.
export const generateSchema = (fields: ICustomMetadataField): void => {

  console.log('generating schema...');

}