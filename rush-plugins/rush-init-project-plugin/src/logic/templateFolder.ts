import * as path from "path";
import { FileSystem } from "@rushstack/node-core-library";
import { loadRushConfiguration } from "./loadRushConfiguration";

const templateFolder2templateNameList: Record<string, string[]> = {};

export const getTemplateFolder = (): string => {
  const { commonFolder } = loadRushConfiguration();
  const templateFolder: string = path.join(commonFolder, "_templates");
  return templateFolder;
};

export const getTemplateFolderAndValidate = (): string => {
  const templateFolder: string = getTemplateFolder();
  if (!FileSystem.exists(templateFolder)) {
    FileSystem.ensureFolder(templateFolder);
    throw new Error(
      `Template folder created, please setup template under "${templateFolder}"`
    );
  }

  const templateNameList: string[] = getTemplateNameList(templateFolder);
  if (templateNameList.length === 0) {
    throw new Error(`Please setup template under ${templateFolder}`);
  }

  return templateFolder;
};

export function getTemplateNameList(templateFolder: string): string[] {
  let templateNameList: string[] =
    templateFolder2templateNameList[templateFolder];
  if (!templateNameList) {
    templateNameList = FileSystem.readFolder(templateFolder).filter(
      (filename: string) => {
        return FileSystem.getStatistics(
          path.resolve(templateFolder, filename)
        ).isDirectory();
      }
    );
    templateFolder2templateNameList[templateFolder] = templateNameList;
  }
  return templateNameList;
}
