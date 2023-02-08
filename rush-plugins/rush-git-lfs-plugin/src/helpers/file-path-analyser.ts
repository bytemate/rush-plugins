import path from 'path';
import execa from 'execa';
import fse from 'fs-extra';
import { RushConfiguration, RushConfigurationProject } from '@rushstack/rush-sdk';

import { withPrefix, terminal } from './terminal';

export const RushConfig: RushConfiguration = RushConfiguration.loadFromDefaultLocation();

export const RushRootFolder: string = RushConfig.rushJsonFolder;

export const RushCWD: string = process.env.RUSH_INVOKED_FOLDER!;

export const toAbsolutePath = (p: string): string => {
  return path.resolve(RushCWD, p);
};
export const toRelativePath = (p: string): string => {
  return path.relative(RushRootFolder, toAbsolutePath(p));
};

const enum ErrorMsg {
  GetChangedFileError = 'Error occurs when get changed files by running "git diff --cached --name-only --diff-filter=ACMR", please check your git environment.',
  FilePathNotCorrect = 'The input files pattern is not correct, please make sure you set the correct file paths.',
  FilePathNotExist = 'File path not exist, please check your input file.',
}

export const getFilePathsFromChangedFiles = (): string[] => {
  /* use git diff to get changed files */
  terminal.writeVerboseLine(withPrefix('Using git diff to get changed files.'));
  let files: string[];
  try {
    const { exitCode, stdout, stderr } = execa.commandSync(
      'git diff --name-only --diff-filter=ACMR --cached'
    );
    if (exitCode === 0) {
      files = stdout
        .split(/\r?\n|\r|\n/g)
        .filter(s => s.length)
        .map(p => path.resolve(RushRootFolder, p));
      terminal.writeVerboseLine(withPrefix(`Changed files paths\n${files.join(',\n')}`));
      return files;
    } else {
      terminal.writeErrorLine(withPrefix(stderr));
      throw new Error(ErrorMsg.GetChangedFileError);
    }
  } catch (e: any) {
    terminal.writeErrorLine(withPrefix(e));
    throw new Error(ErrorMsg.GetChangedFileError);
  }
};

export const validateFilePaths = (files: string[]): void => {
  if (!files.every(f => typeof f === 'string')) {
    /* check if every item in array is string */
    throw new Error(ErrorMsg.FilePathNotCorrect);
  }

  if (!files.every(f => fse.existsSync(toAbsolutePath(f)))) {
    /* check if every file was exist */
    throw new Error(ErrorMsg.FilePathNotExist);
  }
};

export const findFileBelongProject = (f: string): RushConfigurationProject | undefined => {
  const projects: RushConfigurationProject[] = RushConfig.projects;

  const relativePath: string = toRelativePath(f);

  for (const p of projects) {
    const pFolder: string = path.relative(RushRootFolder, p.projectFolder);
    if (relativePath.startsWith(pFolder)) {
      return p;
    }
  }
};
