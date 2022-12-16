import path from 'path';
import fse from 'fs-extra';
import execa from 'execa';

export default class TestFileFactory {
  private static _instance?: TestFileFactory;
  public tempFolder: string = path.resolve(__dirname, '../temp');
  public static getInstance(): TestFileFactory {
    if (!this._instance) {
      this._instance = new TestFileFactory();
    }
    return this._instance;
  }

  private _writeFile(fileName: string, data: any): string {
    const filePath: string = path.resolve(this.tempFolder, `${fileName}`);
    fse.ensureDirSync(path.dirname(filePath));
    fse.writeFileSync(filePath, data);
    return filePath;
  }

  public createTextFile(fileName: string): string {
    const str: string = (Math.random() + 1).toString(36).substring(7);

    return this._writeFile(fileName, str);
  }
  public createBinaryFile(fileName: string): string {
    const simplePngBase64Str: string =
      'iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAKElEQVQ4jWNgYGD4Twzu6FhFFGYYNXDUwGFpIAk2E4dHDRw1cDgaCAASFOffhEIO3gAAAABJRU5ErkJggg==';

    return this._writeFile(fileName + '.png', Buffer.from(simplePngBase64Str, 'base64'));
  }
  public createSizedFile(fileName: string, size: number): string {
    const filePath: string = path.resolve(this.tempFolder, fileName);
    fse.ensureFileSync(filePath);
    const f: number = fse.openSync(filePath, 'w');
    fse.writeSync(f, 'ok', Math.max(0, size - 2));
    fse.closeSync(f);
    return filePath;
  }
  public addFileToLFS(filePath: string): void {
    const relativePath: string = path.relative(this.tempFolder, filePath);
    const { exitCode } = execa.commandSync(`git lfs track ${relativePath}`, {
      cwd: this.tempFolder,
    });
    if (exitCode !== 0) {
      throw new Error('Add file to lfs failed');
    }
  }
  public removeFileFromLFS(filePath: string): void {
    const relativePath: string = path.relative(this.tempFolder, filePath);
    const { exitCode } = execa.commandSync(`git lfs untrack ${relativePath}`, {
      cwd: this.tempFolder,
    });
    if (exitCode !== 0) {
      throw new Error('Remove file from lfs failed');
    }
  }

  public cleanTempFolder(): void {
    fse.removeSync(this.tempFolder);
  }
}
