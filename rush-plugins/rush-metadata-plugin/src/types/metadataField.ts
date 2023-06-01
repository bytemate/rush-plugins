export type FieldTypes = 'string' | 'number' | 'list' | 'choice' | 'selector';

export enum FIELD_TYPES {
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
  fieldType: FIELD_TYPES;
  required: boolean;
  choices?: string[] | { label: string; value: string | number }[];
  defaultValue?: string;
}
