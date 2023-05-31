export interface ICustomMetadataField {
  name: string;
  description: string;
  type: "string" | "number" | "string[]" | "number[]";
  isSelect: boolean;
  required: boolean;
}