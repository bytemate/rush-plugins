import { GitLFSCheckModule } from '../../executor/modules/check';
import FileFactory from '../setup/TestFileFactory';

describe('lfs file detect', () => {
  it('should detect binary image file correctly', () => {
    const factory = FileFactory.getInstance();
    const bFile = factory.createBinaryFile('test-b');
    const tFile = factory.createTextFile('test-t');
    const checker = new GitLFSCheckModule();
    expect(checker.isFileNeedToTrack(bFile, { '**/*.png': 0, '**/*': 5 * 1024 * 1024 })).toBe(true);
    expect(checker.isFileNeedToTrack(tFile, { '**/*.png': 0, '**/*': 5 * 1024 * 1024 })).toBe(
      false
    );
  });

  it('should detect large file correctly', () => {
    const factory = FileFactory.getInstance();

    const smallFile = factory.createSizedFile('sFile', 4 * 1024);
    const largeFile = factory.createSizedFile('lFile', 6 * 1024 * 1024);
    const checker = new GitLFSCheckModule();

    expect(checker.isFileNeedToTrack(smallFile, { '**/*': 5 * 1024 * 1024 })).toBe(false);
    expect(checker.isFileNeedToTrack(largeFile, { '**/*': 5 * 1024 * 1024 })).toBe(true);
  });

  it('should detect large file with customized files threshold correctly', () => {
    const factory = FileFactory.getInstance();

    const tsFile = factory.createSizedFile('tsFile.ts', 6 * 1024 * 1024);
    const jsFile = factory.createSizedFile('jsFile.js', 2 * 1024 * 1024);
    const checker = new GitLFSCheckModule();

    expect(checker.isFileNeedToTrack(tsFile, { '**/*.ts': 7 * 1024 * 1024 })).toBe(false);
    expect(checker.isFileNeedToTrack(jsFile, { '**/*.js': 1 * 1024 * 1024 })).toBe(true);
  });

  it('should detect LFS status correctly', () => {
    const factory = FileFactory.getInstance();

    const lfsFile = factory.createBinaryFile('lfsFile');
    const checker = new GitLFSCheckModule();

    factory.addFileToLFS(lfsFile);

    expect(checker.isTrackedByLFS(lfsFile)).toBe(true);

    factory.removeFileFromLFS(lfsFile);
    expect(checker.isTrackedByLFS(lfsFile)).toBe(false);
  });

  it('should add file to git correctly', () => {
    const factory = FileFactory.getInstance();
    const checker = new GitLFSCheckModule();

    const tempFile = factory.createTextFile('tempFile');

    expect(() => checker.addFileToGit(tempFile)).toThrow();
  });

  afterAll(() => {
    FileFactory.getInstance().cleanTempFolder();
  });
});

// describe('file parameters', () => {
//   it('should get changed files when file parameters are not array', () => {
//     const checker = new GitLFSCheckModule();
//     // @ts-ignore
//     const files = checker._normalizeFilePaths(1 as any);
//     expect(Array.isArray(files)).toBe(true);
//   });
//   it('should throw error when file parameters are not correct', () => {
//     const checker = new GitLFSCheckModule();
//     // @ts-ignore
//     expect(() => checker._normalizeFilePaths([1, 2] as any[])).toThrowError();
//   });
// });
