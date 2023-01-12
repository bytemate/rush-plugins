import type {
  RushConfiguration,
  RushConfigurationProject,
} from "@rushstack/rush-sdk";
import { FileSystem, JsonFile, JsonObject } from "@rushstack/node-core-library";
import * as path from "path";
import * as tar from "tar";
import { getCheckpointBranch, gitCheckIgnored, gitFullClean, pushGitBranch } from "../logic/git";
import { getGraveyardInfo, graveyardRelativeFolder } from "../logic/graveyard";
import { IProjectCheckpointMetadata, ProjectMetadata } from "../logic/projectMetadata";
import ora from "ora";
import inquirer from 'inquirer';
import fs from 'fs';
import { loadRushConfiguration } from "../logic/rushConfiguration";
import { convertProjectMetadataToMD } from "../logic/generateMD";

interface IArchiveConfig {
  packageName: string;
  gitCheckpoint: boolean;
}

export async function archive({ packageName, gitCheckpoint }: IArchiveConfig): Promise<void> {
  let spinner: ora.Ora | undefined;
  const rushConfiguration: RushConfiguration = loadRushConfiguration();
  const monoRoot: string = rushConfiguration.rushJsonFolder;
  const project: RushConfigurationProject | undefined =
    rushConfiguration.getProjectByName(packageName);
  if (!project) {
    throw new Error(`Could not find project with package name ${packageName}`);
  }

  // check project is depended by other projects
  const consumingProjectNames: string[] = Array.from(
    project.consumingProjects
  ).map((x: RushConfigurationProject) => x.packageName);
  if (consumingProjectNames.length) {
    throw new Error(`Target project ${packageName} is depended by other ${
      consumingProjectNames.length
    } project(s):
${consumingProjectNames.join(", ")}`);
  }

  const { projectFolder, projectRelativeFolder } = project;

  // git clean -xdf
  spinner = ora(`Cleaning ${projectRelativeFolder}`).start();
  gitFullClean(projectFolder);
  spinner.succeed(`Clean ${projectRelativeFolder} complete`);

  const { tarballRelativeFolder, tarballFolder, tarballName } =
    getGraveyardInfo({
      monoRoot,
      packageName,
    });
  FileSystem.ensureFolder(tarballFolder);

  if (gitCheckpoint) {
    spinner = ora('Attempting to create a git checkpoint branch');
    const branchName: string = getCheckpointBranch(rushConfiguration.rushJsonFolder,packageName);
    spinner.succeed(`Git Checkpoint created at branch: ${branchName}`);
    // Prompt user to push the newly created branch
    const { pushBranch } = await inquirer.prompt([
      { type: 'confirm', name: 'pushBranch', message: 'Push checkpoint branch to remote?' }
    ])
    if (pushBranch) {
      pushGitBranch(rushConfiguration.rushJsonFolder, branchName);
    }
    // Add data to metadata file
    const archivedProjectMetadataFilePath: string = path.join(monoRoot, graveyardRelativeFolder, 'projectCheckpoints.json');
    const archivedProjectMetadataMdFilePath: string = path.join(monoRoot, graveyardRelativeFolder, 'projectCheckpoints.md');
    let archivedProjectMetadataObject: { [key in string]: IProjectCheckpointMetadata } = {};
    if (FileSystem.exists(archivedProjectMetadataFilePath)) {
      archivedProjectMetadataObject = JsonFile.load(archivedProjectMetadataFilePath);
    }
    // Try to pull a description from the package's package.json file
    let description: string = "";
    const projectJson: string = `${project.projectFolder}/package.json`;
    if (FileSystem.exists(projectJson)) {
      const packageJson: any = JsonFile.load(`${project.projectFolder}/package.json`);
      description = packageJson.description || "";
    }
    archivedProjectMetadataObject[packageName] = {
      checkpointBranch: branchName,
      archivedOn: new Date().toISOString(),
      description
    }
    JsonFile.save(archivedProjectMetadataObject, archivedProjectMetadataFilePath);

    fs.writeFileSync(archivedProjectMetadataMdFilePath, convertProjectMetadataToMD(archivedProjectMetadataObject));
  }

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
