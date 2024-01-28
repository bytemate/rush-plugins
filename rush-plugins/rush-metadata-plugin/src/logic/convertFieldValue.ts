import { IMetadataField } from '../types/metadataField';

export const convertFieldValue = (field: IMetadataField, value: string | number | string[]): string => {
  if (Array.isArray(value)) {
    return value.join(',');
  }

  if (field.fieldType === 'list') {
    if (field.choices && typeof field.choices[0] === 'string') {
      return value as string;
    }
    // Try to decode the field value into it's label
    if (field.choices && field.choices.length) {
      for (const choice of field.choices as {
        name: string;
        value: string | number;
      }[]) {
        if (choice?.value === value) {
          return choice.name;
        }
      }
    }
    return '';
  }
  return value as string;
};
