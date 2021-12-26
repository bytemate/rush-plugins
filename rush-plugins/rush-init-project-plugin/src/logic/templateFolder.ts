import * as path from "path";
import { FileSystem } from "@rushstack/node-core-library";
import { loadRushConfiguration } from "./loadRushConfiguration";

const templatesFolder2templateNameList: Record<string, string[]> = {};

export const getTemplatesFolder = (): string => {
  const { commonFolder } = loadRushConfiguration();
  const templatesFolder: string = path.join(commonFolder, "_templates");
  return templatesFolder;
};

export const getTemplatesFolderAndValidate = (): string => {
  const templatesFolder: string = getTemplatesFolder();
  if (!FileSystem.exists(templatesFolder)) {
    FileSystem.ensureFolder(templatesFolder);
    throw new Error(
      `Templates folder created, please setup template under "${templatesFolder}"`
    );
  }

  const templateNameList: string[] = getTemplateNameList(templatesFolder);
  if (templateNameList.length === 0) {
    throw new Error(`Please setup template under ${templatesFolder}`);
  }

  return templatesFolder;
};

export function getTemplateNameList(templatesFolder: string): string[] {
  let templateNameList: string[] =
    templatesFolder2templateNameList[templatesFolder];
  if (!templateNameList) {
    templateNameList = FileSystem.readFolder(templatesFolder)
      .filter((filename: string) => {
        return FileSystem.getStatistics(
          path.resolve(templatesFolder, filename)
        ).isDirectory();
      })
      .filter((filename: string) => {
        return !filename.startsWith("_");
      });
    templatesFolder2templateNameList[templatesFolder] = templateNameList;
  }
  return templateNameList;
}

export function getTemplateFolder(template: string): string {
  const templatesFolder: string = getTemplatesFolder();
  const templateFolder: string = path.join(templatesFolder, template);
  return templateFolder;
}
