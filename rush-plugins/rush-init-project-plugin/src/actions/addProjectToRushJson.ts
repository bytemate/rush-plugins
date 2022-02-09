import { JsonFile, JsonObject } from "@rushstack/node-core-library";
import { loadRushConfiguration } from "../logic/loadRushConfiguration";

import type { RushConfiguration } from "@rushstack/rush-sdk";
import type { IDefaultProjectConfiguration } from "../logic/TemplateConfiguration";

export interface IAddProjectToRushJsonParams {
  packageName: string;
  projectFolder: string;
  defaultProjectConfiguration?: IDefaultProjectConfiguration;
}

export const addProjectToRushJson = ({
  packageName,
  projectFolder,
  defaultProjectConfiguration = {},
}: IAddProjectToRushJsonParams): void => {
  const rushConfiguration: RushConfiguration =
    loadRushConfiguration() as unknown as RushConfiguration;
  const { rushJsonFile } = rushConfiguration;
  const rawRushConfigJson: JsonObject = JsonFile.load(rushJsonFile);
  const projectConfiguration: JsonObject = {
    packageName,
    projectFolder,
    ...defaultProjectConfiguration,
  };
  rawRushConfigJson.projects.push({
    ...projectConfiguration,
  });
  JsonFile.save(rawRushConfigJson, rushJsonFile, {
    updateExistingFile: true,
  });
};
