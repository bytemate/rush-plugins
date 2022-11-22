import * as child_process from 'child_process';

export const getGitUserName = (cwd: string): string => {

  const options: child_process.SpawnSyncOptions = {
    cwd,
    shell: true,
    stdio: ['pipe', 'pipe', 'pipe'],
    env: {}
  };
  try {
    const result: child_process.SpawnSyncReturns<Buffer> = child_process.spawnSync(
      'git',
      ['config', 'user.name'],
      options
    );
    return result.stdout.toString() ?? '';
  } catch (e) {
    // no-catch
    return '';
  }
}