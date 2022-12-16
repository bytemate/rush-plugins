jest.mock('execa');
import execa from 'execa';
import path from 'path';

import {
  getFilePathsFromChangedFiles,
  findFileBelongProject,
  validateFilePaths,
} from '../../helpers/file-path-analyser';
import { terminal, terminalProvider } from '../../helpers/terminal';

const mockCommandSyncReturn = (result: Partial<execa.ExecaSyncReturnValue>): void => {
  (
    execa.commandSync as unknown as jest.MockedFunction<typeof execa.commandSync>
  ).mockImplementation((() => {
    return result;
  }) as any);
};

describe('test file path analyser', () => {
  it('should get changed files by git diff', () => {
    const testPath = path.resolve(__dirname);
    mockCommandSyncReturn({
      exitCode: 0,
      stdout: testPath,
    });
    expect(getFilePathsFromChangedFiles()?.[0]).toStrictEqual(testPath);
  });

  it('should throw error if git diff run failed', () => {
    mockCommandSyncReturn({ exitCode: 1, stderr: 'This should be an error' });
    terminal.unregisterProvider(terminalProvider);
    expect(getFilePathsFromChangedFiles).toThrowError();
    terminal.registerProvider(terminalProvider);
  });

  it('should find file path belong package correctly', () => {
    const p1 = path.resolve(__dirname);

    const p2 = path.resolve(__dirname, '../../../../../rush.json');
    const p3 = path.resolve('/some/path/that/incorrect');
    expect(findFileBelongProject(p1)?.packageName).toStrictEqual('rush-git-lfs-plugin');
    expect(findFileBelongProject(p2)).toBeUndefined();
    expect(findFileBelongProject(p3)).toBeUndefined();
  });

  it('should valid path correctly', () => {
    const pathsCorrect = [
      path.resolve(__dirname),
      path.resolve(__dirname, '../../../package.json'),
    ];

    const pathsPatternIncorrect = [path.resolve(__dirname), 20, Boolean];

    const pathsFileNotExist = [
      path.resolve(__dirname),
      path.resolve(__dirname, './not-exist-file.ts'),
    ];

    expect(() => validateFilePaths(pathsCorrect)).not.toThrow();
    expect(() => validateFilePaths(pathsPatternIncorrect as string[])).toThrowError();
    expect(() => validateFilePaths(pathsFileNotExist)).toThrowError();
  });
});
