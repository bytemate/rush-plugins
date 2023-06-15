import json2md from 'json2md';
import fs from 'fs';
import { IMetadataField } from '../types/metadataField';
import { getAllMetadataFields } from '../logic/customMeta';
import { convertFieldValue } from '../logic/convertFieldValue';

export const MDStartKey: string =
  '========== This section is auto-generated by the rush metadata plugin. ==========';
export const MDEndKey: string = '========== End of auto-generated section. ==========';

export const outputToReadme = (currentValues: any, outputFileLocation: string): void => {
  let prevMDContents: string = '';
  let postMDContents: string = '';

  // Check if readme file already exists
  if (fs.existsSync(outputFileLocation)) {
    const readmeContents: string = fs.readFileSync(outputFileLocation, 'utf8');
    // Check if the start and end key exist
    if (readmeContents.indexOf(MDStartKey) !== -1 && readmeContents.indexOf(MDEndKey)) {
      prevMDContents = readmeContents.slice(0, readmeContents.indexOf(MDStartKey));
      postMDContents = readmeContents.slice(readmeContents.indexOf(MDEndKey) + MDEndKey.length);
    } else {
      // Preserve previous content in prevMDContents
      prevMDContents = readmeContents + '\n';
    }
  }

  const allFields: IMetadataField[] = getAllMetadataFields();
  // Generate md file
  const mdFileContents: any = [
    { p: MDStartKey },
    {
      p: 'This section is auto-generated and will be auto-updated. Anything added manually outside this section will be preserved.'
    }
  ];

  for (const field of allFields) {
    let fieldValue: string = '';
    if (!currentValues[field.name]) {
      continue;
    }
    fieldValue = convertFieldValue(field, currentValues[field.name]);
    mdFileContents.push(...[{ h2: field.name }, { h4: field.description }, { p: fieldValue }]);
  }

  mdFileContents.push({ p: MDEndKey });

  const mdContents: string = json2md(mdFileContents);

  const mdToOutput: string = prevMDContents + mdContents.trim() + postMDContents;

  fs.writeFileSync(outputFileLocation, mdToOutput);
};
