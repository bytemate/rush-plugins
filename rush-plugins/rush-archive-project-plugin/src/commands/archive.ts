import type { RushConfigurationProject } from "@microsoft/rush-lib";
import { RushConfiguration } from "@microsoft/rush-lib";
import { FileSystem, JsonFile, JsonObject } from "@rushstack/node-core-library";
import * as path from "path";
import * as tar from "tar";
import { gitCheckIgnored, gitFullClean } from "../logic/git";
import { getGraveyardInfo } from "../logic/graveyard";
import { ProjectMetadata } from "../logic/projectMetadata";
import ora from "ora";
import { loadRushConfiguration } from "../logic/rushConfiguration";

interface IArchiveConfig {
  packageName: string;
}

export async function archive({ packageName }: IArchiveConfig): Promise<void> {
  let spinner: ora.Ora | undefined;
  const rushConfiguration: RushConfiguration = loadRushConfiguration();
  const monoRoot: string = rushConfiguration.rushJsonFolder;
  const project: RushConfigurationProject | undefined =
    rushConfiguration.getProjectByName(packageName);
  if (!project) {
    throw new Error(`Could not find project with package name ${packageName}`);
  }

  const { projectFolder, projectRelativeFolder } = project;

  // git clean -xdf
  spinner = ora(`Cleaning ${projectRelativeFolder}`).start();
  gitFullClean(projectFolder);
  spinner.succeed(`Clean ${projectRelativeFolder} complete`);

  // create a metadata.json file
  spinner = ora(`Creating metadata.json for ${projectRelativeFolder}`).start();
  const rawRushJson: JsonObject = JsonFile.load(rushConfiguration.rushJsonFile);
  const rawProjectConfig: JsonObject = rawRushJson.projects.find(
    (x: JsonObject) => x.packageName === packageName
  );
  const projectMetadata: ProjectMetadata = new ProjectMetadata(
    rawProjectConfig
  );
  const projectMetadataFilepath: string = path.join(
    projectFolder,
    ProjectMetadata.FILENAME
  );
  projectMetadata.save(projectMetadataFilepath);
  spinner.succeed(`Created metadata.json for ${projectRelativeFolder}`);

  // create archive tarball
  spinner = ora(`Creating tarball for ${projectRelativeFolder}`).start();
  const { tarballRelativeFolder, tarballFolder, tarballName } =
    getGraveyardInfo({
      monoRoot,
      packageName,
    });
  FileSystem.ensureFolder(tarballFolder);
  try {
    //tar -czf test.tar.gz -C project_relative_folder .
    tar.create(
      {
        gzip: true,
        file: tarballName,
        sync: true,
        cwd: projectFolder,
      },
      ["."]
    );
  } catch (e: any) {
    throw new Error(`Failed to create tarball: ${e.message}`);
  }
  spinner.succeed(`Created tarball for ${projectRelativeFolder}`);

  // move the tarball to the graveyard folder
  spinner = ora(`Moving tarball to ${tarballRelativeFolder}`).start();
  const finalTarballPath: string = path.join(tarballFolder, tarballName);
  FileSystem.move({
    sourcePath: tarballName,
    destinationPath: finalTarballPath,
  });
  spinner.succeed(`Moved tarball to ${tarballRelativeFolder}`);

  // check if the tarball is ignored by git
  spinner = ora(`Checking if tarball is ignored by git`).start();
  const checkIgnored: string = gitCheckIgnored(
    rushConfiguration.rushJsonFolder,
    finalTarballPath
  );
  if (checkIgnored) {
    throw new Error(`Tarball is ignored by git: ${checkIgnored}`);
  }
  spinner.succeed(`Tarball is not ignored by git`);

  // remove project config in rush.json
  spinner = ora(`Removing project config from rush.json`).start();
  rawRushJson.projects = rawRushJson.projects.filter(
    (x: JsonObject) => x.packageName !== packageName
  );
  JsonFile.save(rawRushJson, rushConfiguration.rushJsonFile, {
    updateExistingFile: true,
  });
  spinner.succeed(`Removed project config from rush.json`);

  // delete project folder
  spinner = ora(`Deleting project folder ${projectRelativeFolder}`).start();
  FileSystem.deleteFolder(projectFolder);
  spinner.succeed(`Deleted project folder ${projectRelativeFolder}`);
}
