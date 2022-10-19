import { RushConfigurationProject } from "@rushstack/rush-sdk";

const packageNameToAllDependencyProjects: Record<string, RushConfigurationProject[]> = {};

/**
 * Get all dependency projects of a project both directly and indirectly,
 * and topologically sort them at the same time.
 */
export const getSortedAllDependencyProjects = (project: RushConfigurationProject): ReadonlyArray<RushConfigurationProject> => {
  let allDependencyProjects: RushConfigurationProject[] | undefined = packageNameToAllDependencyProjects[project.packageName];
  if (!allDependencyProjects) {
    const visited: Set<string> = new Set<string>();
    allDependencyProjects = [];

    for (const dependency of project.dependencyProjects) {
      if (visited.has(dependency.packageName)) {
        continue;
      }
      recursiveGetAndSortAllDependencyProjects(project, visited, allDependencyProjects);
    }

    packageNameToAllDependencyProjects[project.packageName] = allDependencyProjects;
  }
  return allDependencyProjects;
}

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
    recursiveGetAndSortAllDependencyProjects(dependency, visited, allDependencyProjects);
  }
  allDependencyProjects.push(project);
}