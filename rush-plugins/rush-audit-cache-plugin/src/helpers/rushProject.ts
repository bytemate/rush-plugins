import * as path from "path";

import {
  RushConfiguration,
  RushConfigurationProject,
} from "@rushstack/rush-sdk";
import { FileSystem, JsonFile } from "@rushstack/node-core-library";

export interface IRushProjectJson {
  operationSettings: {
    operationName: string;
    outputFolderNames: string[];
  }[];
  incrementalBuildIgnoredGlobs: string[];
}

const packageNameToAllDependencyProjects: Record<
  string,
  RushConfigurationProject[]
> = {};

/**
 * Get all dependency projects of a project both directly and indirectly,
 * and topologically sort them at the same time.
 */
export const getSortedAllDependencyProjects = (
  project: RushConfigurationProject
): ReadonlyArray<RushConfigurationProject> => {
  let allDependencyProjects: RushConfigurationProject[] | undefined =
    packageNameToAllDependencyProjects[project.packageName];
  if (!allDependencyProjects) {
    const visited: Set<string> = new Set<string>();
    allDependencyProjects = [];

    for (const dependency of project.dependencyProjects) {
      if (visited.has(dependency.packageName)) {
        continue;
      }
      recursiveGetAndSortAllDependencyProjects(
        project,
        visited,
        allDependencyProjects
      );
    }

    packageNameToAllDependencyProjects[project.packageName] =
      allDependencyProjects;
  }
  return allDependencyProjects;
};

/**
 * recursively walk through all dependency projects of a project,
 */
function recursiveGetAndSortAllDependencyProjects(
  project: RushConfigurationProject,
  visited: Set<string>,
  allDependencyProjects: RushConfigurationProject[]
): void {
  visited.add(project.packageName);
  for (const dependency of project.dependencyProjects) {
    if (visited.has(dependency.packageName)) {
      continue;
    }
    recursiveGetAndSortAllDependencyProjects(
      dependency,
      visited,
      allDependencyProjects
    );
  }
  allDependencyProjects.push(project);
}

/**
 * try to load json for project
 */

export function tryLoadJsonForProject(
  resolvedConfigurationFilePath: string
): IRushProjectJson | undefined {
  try {
    const rushProjectJson: IRushProjectJson = JsonFile.load(
      resolvedConfigurationFilePath
    );
    return rushProjectJson;
  } catch (e) {
    if (FileSystem.isFileDoesNotExistError(e as Error)) {
      return;
    } else {
      throw e;
    }
  }
}

/**
 * get all build cache configured project
 */
export function getAllCacheConfiguredProjects(
  rushConfiguration: RushConfiguration
): RushConfigurationProject[] {
  const projects: RushConfigurationProject[] = rushConfiguration.projects;
  return projects.filter((project) => {
    const rushProjectJsonPath: string = path.join(
      project.projectFolder,
      "./config/rush-project.json"
    );

    const rushProjectJson: IRushProjectJson | undefined =
      tryLoadJsonForProject(rushProjectJsonPath);
    if (!rushProjectJson) {
      return false;
    }
    const { operationSettings = [] } = rushProjectJson;
    return Boolean(operationSettings.length);
  });
}
