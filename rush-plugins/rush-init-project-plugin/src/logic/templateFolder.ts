import * as path from 'path';
import { FileSystem } from '@rushstack/node-core-library';
import { loadRushConfiguration } from './loadRushConfiguration';

export interface ITemplatePathNameType {
  templateFolder: string;
  displayName?: string;
}

const templatesFolder2templateNameList: Record<string, Array<ITemplatePathNameType>> = {};

export const getTemplatesFolder = (): string => {
  const { commonFolder } = loadRushConfiguration();
  const templatesFolder: string = path.join(commonFolder, '_templates');
  return templatesFolder;
};

export const getTemplatesFolderAndValidate = (): string => {
  const templatesFolder: string = getTemplatesFolder();
  if (!FileSystem.exists(templatesFolder)) {
    FileSystem.ensureFolder(templatesFolder);
    throw new Error(`Templates folder created, please setup template under "${templatesFolder}"`);
  }

  const templateNameList: ITemplatePathNameType[] = getTemplateNameList(templatesFolder);
  if (templateNameList.length === 0) {
    throw new Error(`Please setup template under ${templatesFolder}`);
  }

  return templatesFolder;
};

// get template list from folder
export function getTemplateNameList(templatesFolder: string): ITemplatePathNameType[] {
  let templateNameList: ITemplatePathNameType[] = templatesFolder2templateNameList[templatesFolder];
  if (!templateNameList) {
    const templateFolderList: string[] = FileSystem.readFolder(templatesFolder)
      .filter((filename: string) => {
        return FileSystem.getStatistics(path.resolve(templatesFolder, filename)).isDirectory();
      })
      .filter((filename: string) => {
        return !filename.startsWith('_');
      });
    templateNameList = templateFolderList.map((templateFolder: string) => ({ templateFolder }));
  }
  // eslint-disable-next-line require-atomic-updates
  templatesFolder2templateNameList[templatesFolder] = templateNameList;
  return templateNameList;
}

export function getTemplateFolder(template: string): string {
  const templatesFolder: string = getTemplatesFolder();
  const templateFolder: string = path.join(templatesFolder, template);
  return templateFolder;
}
