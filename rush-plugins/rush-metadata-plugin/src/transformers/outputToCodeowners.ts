import fs from 'fs';

export const outputToCodeowners = (pointsOfContact: string[], outputFileLocation: string): void => {
  // Output to gitlab format codeowners

  console.log('outputting these POCs to the codeowners file: ', pointsOfContact);
  console.log('at location: ', outputFileLocation);

  fs.writeFileSync(outputFileLocation, pointsOfContact.join(','));
};
