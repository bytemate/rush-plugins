import * as path from "path";
import { RushConfiguration } from "@microsoft/rush-lib";
import { FileSystem, JsonFile, JsonObject } from "@rushstack/node-core-library";
import ora from "ora";
import { getGraveyardInfo } from "../logic/graveyard";
import * as tar from "tar";
import { ProjectMetadata } from "../logic/projectMetadata";

export interface IUnarchiveConfig {
  packageName: string;
}

export async function unarchive({
  packageName,
}: IUnarchiveConfig): Promise<void> {
  let rushConfiguration: RushConfiguration | undefined;
  let spinner: ora.Ora | undefined;
  try {
    rushConfiguration = RushConfiguration.loadFromDefaultLocation({
      startingFolder: process.cwd(),
    });
  } catch {
    // no-catch
  }
  if (!rushConfiguration) {
    throw new Error("Could not load rush configuration");
  }

  // check if package name is existing
  if (rushConfiguration.getProjectByName(packageName)) {
    throw new Error(`Package ${packageName} already exists`);
  }

  const monoRoot: string = rushConfiguration.rushJsonFolder;

  // extract tarball
  const { tarballName, tarballFolder } = getGraveyardInfo({
    monoRoot,
    packageName,
  });
  const tarballPath: string = path.join(tarballFolder, tarballName);
  if (!FileSystem.exists(tarballPath)) {
    throw new Error(
      `Could not find tarball ${tarballName} for package name ${packageName}`
    );
  }
  spinner = ora(`Extracting ${tarballName}`).start();
  // tar xf <package_name>.tar.gz
  const extractWorkingFolder: string = path.join(
    tarballFolder,
    packageName.replace("/", "!")
  );
  FileSystem.ensureFolder(extractWorkingFolder);
  tar.extract({
    file: path.join(tarballFolder, tarballName),
    sync: true,
    cwd: extractWorkingFolder,
  });
  spinner.succeed();

  // read metadata
  const projectMetadata: ProjectMetadata = ProjectMetadata.load(
    path.join(extractWorkingFolder, ProjectMetadata.FILENAME)
  );

  const projectConfig: JsonObject = projectMetadata.projectConfig;
  const projectRelativeFolder: string = projectConfig.projectFolder;
  const projectFolder: string = path.join(monoRoot, projectRelativeFolder);
  if (FileSystem.exists(projectFolder)) {
    throw new Error(`Project folder ${projectRelativeFolder} already exists`);
  }

  // move to project folder
  spinner = ora(`Moving code to ${projectRelativeFolder}`).start();
  FileSystem.move({
    sourcePath: extractWorkingFolder,
    destinationPath: projectFolder,
  });
  spinner.succeed();

  // resume project configuration to rush.json
  spinner = ora(`Resuming project configuration to rush.json`).start();
  const rawRushJson: JsonObject = JsonFile.load(rushConfiguration.rushJsonFile);
  rawRushJson.projects.push(projectConfig);
  JsonFile.save(rawRushJson, rushConfiguration.rushJsonFile, {
    updateExistingFile: true,
    prettyFormatting: true,
  });
  spinner.succeed();

  spinner = ora(`Housekeeping`).start();
  // delete metadata
  FileSystem.deleteFile(path.join(projectFolder, ProjectMetadata.FILENAME));
  // remove tarball from graveyard
  FileSystem.deleteFile(tarballPath);
  spinner.succeed();
}
