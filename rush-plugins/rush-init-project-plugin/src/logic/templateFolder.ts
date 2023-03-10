import * as path from 'path';
import { FileSystem, Terminal, JsonFile, JsonSchema, JsonObject } from '@rushstack/node-core-library';
import { loadRushConfiguration } from './loadRushConfiguration';
import templeteSchema from './template.schema.json';
import { TerminalSingleton } from '../terminal';

export interface ITemplatePathNameType {
  folderName: string;
  displayName?: string;
}

const templatesFolder2templateNameList: Record<string, Array<ITemplatePathNameType>> = {};

export const getTemplatesFolder = (): string => {
  const { commonFolder } = loadRushConfiguration();
  const templatesFolder: string = path.join(commonFolder, '_templates');
  return templatesFolder;
};

export const getTemplatesFolderAndValidate = async (): Promise<string> => {
  const templatesFolder: string = getTemplatesFolder();
  if (!FileSystem.exists(templatesFolder)) {
    FileSystem.ensureFolder(templatesFolder);
    throw new Error(`Templates folder created, please setup template under "${templatesFolder}"`);
  }

  const templateNameList: ITemplatePathNameType[] = await getTemplateNameList(templatesFolder);
  if (templateNameList.length === 0) {
    throw new Error(`Please setup template under ${templatesFolder}`);
  }

  return templatesFolder;
};

export async function getTemplateNameList(templatesFolder: string): Promise<ITemplatePathNameType[]> {
  const terminal: Terminal = TerminalSingleton.getInstance();
  let templateNameList: ITemplatePathNameType[] = templatesFolder2templateNameList[templatesFolder];
  if (!templateNameList) {
    const templateConfigPath: string = path.join(getTemplatesFolder(), 'template.json');

    // if template.json doesn't exists, get the template list from folder
    if (!FileSystem.exists(templateConfigPath)) {
      const templateFolderList: string[] = FileSystem.readFolder(templatesFolder)
        .filter((filename: string) => {
          return FileSystem.getStatistics(path.resolve(templatesFolder, filename)).isDirectory();
        })
        .filter((filename: string) => {
          return !filename.startsWith('_');
        });
      templateNameList = templateFolderList.map((folderName: string) => ({ folderName }));
    } else {
      const jsonSchema: JsonSchema = JsonSchema.fromLoadedObject(templeteSchema);
      const res: JsonObject = await JsonFile.loadAndValidateWithCallbackAsync(
        templateConfigPath,
        jsonSchema,
        ({ details = '' }): void => {
          terminal.writeErrorLine(details);
          process.exit(1);
        }
      );
      const { templates } = res;
      templateNameList = templates as ITemplatePathNameType[];
    }

    // eslint-disable-next-line require-atomic-updates
    templatesFolder2templateNameList[templatesFolder] = templateNameList;
  }
  return templateNameList;
}

export function getTemplateFolder(template: string): string {
  const templatesFolder: string = getTemplatesFolder();
  const templateFolder: string = path.join(templatesFolder, template);
  return templateFolder;
}
