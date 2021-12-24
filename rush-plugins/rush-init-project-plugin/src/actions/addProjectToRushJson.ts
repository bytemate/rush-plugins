import type { RushConfiguration } from "@rushstack/rush-sdk";
import { JsonFile, JsonObject } from "@rushstack/node-core-library";
import { loadRushConfiguration } from "../logic/loadRushConfiguration";

export interface IAddProjectToRushJsonParams {
  packageName: string;
  projectFolder: string;
}

export const addProjectToRushJson = ({
  packageName,
  projectFolder,
}: IAddProjectToRushJsonParams): void => {
  const rushConfiguration: RushConfiguration =
    loadRushConfiguration() as unknown as RushConfiguration;
  const { rushJsonFile } = rushConfiguration;
  const rawRushConfigJson: JsonObject = JsonFile.load(rushJsonFile);
  const projectConfiguration: JsonObject = {
    packageName,
    projectFolder,
    cyclicDependencyProjects: [],
  };
  rawRushConfigJson.projects.push({
    ...projectConfiguration,
  });
  JsonFile.save(rawRushConfigJson, rushJsonFile, {
    updateExistingFile: true,
  });
};
