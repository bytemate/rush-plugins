import { Executable } from '@rushstack/node-core-library';
import { SpawnSyncReturns } from 'child_process';

interface IProject {
  path: string;
}

// get all related packages include project in workspace by projectName
const getPackagesByProjectName = (
  projectNames: Array<string>
): {
  projects: Array<IProject>;
} => {
  const projectParams: Array<Array<string>> = projectNames.map((projectName) => ['-t', projectName]);
  const result: SpawnSyncReturns<string> = Executable.spawnSync(
    'rush',
    ['list'].concat(...projectParams, '--json')
  );
  if (result.status === 0) {
    return JSON.parse(result.stdout);
  }
  throw new Error(`rush list error code  ${result.status}`);
};

const getAllIncludedPaths = (
  projects: Array<{
    path: string;
  }>
): string => projects.map((p) => p.path).join(',');

// default action
const gitLfsPull = (): void => {
  Executable.spawnSync('git', ['lfs', 'pull']);
};
const gitLfsInstall = (): void => {
  Executable.spawnSync('git', ['lfs', 'install']);
};
/**
 *
 * @param {*} to stringList, projectName(s)
 */
const gitLfsPullByProject = (projectNames: Array<string>): void => {
  const {
    projects
  }: {
    projects: Array<IProject>;
  } = getPackagesByProjectName(projectNames);
  // git lfs pull --include paths
  const includePaths: string = getAllIncludedPaths(projects);
  if (projects.length > 0) {
    const result: SpawnSyncReturns<string> = Executable.spawnSync('git', [
      'lfs',
      'pull',
      '--include',
      includePaths
    ]);
    if (result.status !== 0) {
      throw new Error(`git lfs pull --include failed  ${result.status}`);
    }
  } else {
    throw new Error('no projects');
  }
};

export { gitLfsPull, gitLfsInstall, gitLfsPullByProject };
