export enum FieldTypes {
  STRING = 'string',
  NUMBER = 'number',
  LIST = 'list',
  CHOICE = 'choice',
  SELECTOR = 'selector'
}

export interface IMetadataField {
  name: string;
  description: string;
  prompt: string;
  fieldType: FieldTypes;
  required: boolean;
  choices?: string[] | { label: string; value: string | number }[];
  defaultValue?: string;
}
