import path from "path";
import { FileSystem } from "@rushstack/node-core-library";
import sort from "sort-package-json";

export const sortPackageJson = (projectPath: string): void => {
  const packageJsonFilePath: string = path.resolve(projectPath, "package.json");
  if (!FileSystem.exists(packageJsonFilePath)) {
    throw new Error(`package.json for ${packageJsonFilePath} does not exist`);
  }
  const input: string = FileSystem.readFile(packageJsonFilePath);
  FileSystem.writeFile(packageJsonFilePath, sort(input));
};
