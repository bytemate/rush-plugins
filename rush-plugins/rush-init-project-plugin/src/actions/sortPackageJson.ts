import * as path from "path";
import { FileSystem } from "@rushstack/node-core-library";
import sort from "sort-package-json";
import { loadRushConfiguration } from "../logic/loadRushConfiguration";

export const sortPackageJson = (projectFolder: string): void => {
  const { rushJsonFolder } = loadRushConfiguration();
  const packageJsonPath: string = path.join(
    rushJsonFolder,
    projectFolder,
    "package.json"
  );
  if (!FileSystem.exists(packageJsonPath)) {
    throw new Error(`package.json for ${projectFolder} does not exist`);
  }

  const input: string = FileSystem.readFile(packageJsonPath);
  FileSystem.writeFile(packageJsonPath, sort(input));
};
