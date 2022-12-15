/* eslint-disable @typescript-eslint/member-ordering */
import path from 'path';
import fse from 'fs-extra';
import execa from 'execa';
import { RushConfigurationProject } from '@rushstack/rush-sdk';
import minimatch from 'minimatch';

import { GitLFSBaseModule, IGitLFSModuleContext } from './base';
import { terminal, withPrefix } from '../../helpers/terminal';
import {
  toRelativePath,
  toAbsolutePath,
  RushRootFolder,
  findFileBelongProject,
} from '../../helpers/file-path-analyser';

export interface IGitLFSCheckModuleContext extends IGitLFSModuleContext {
  files: string[];
  result: IGitLFSCheckModuleFileError[];
  fix?: boolean;
}

export interface IGitLFSCheckModuleFileError {
  file: string;
  errorType?: GitLFSCheckModuleErrorType;
}

export const enum GitLFSCheckModuleErrorType {
  FileNeedToBeTrackedByLFS,
  FixFileLFSStatusFail,
}

export class GitLFSCheckModule extends GitLFSBaseModule {
  public isFileNeedToTrack(p: string, pattern: Record<string, number>): boolean {
    const entries: [string, number][] = Object.entries(pattern);

    for (const [ptn, size] of entries) {
      if (minimatch(toRelativePath(p), ptn)) {
        const stat: fse.Stats = fse.statSync(toAbsolutePath(p));
        return stat.size > size;
      }
    }
    return false;
  }

  public isTrackedByLFS = (p: string): boolean => {
    /* use git check-attr to test if a file was managed by git-lfs */
    try {
      const { exitCode, stdout } = execa.commandSync(
        `git check-attr --all -- ${toRelativePath(p)}`,
        {
          cwd: RushRootFolder,
        }
      );
      return exitCode === 0 && stdout.includes('filter: lfs');
    } catch (e) {
      return false;
    }
  };

  public fixFile = (p: string): void => {
    terminal.writeVerboseLine(withPrefix(`Try adding ${toRelativePath(p)} to Git LFS`));
    const project: RushConfigurationProject | undefined = findFileBelongProject(p);
    /* if we can't find a project the file belong to, just run git lfs track at root */
    const runCWD: string = typeof project === 'undefined' ? RushRootFolder : project.projectFolder;
    const relativePath: string = path.relative(runCWD, toRelativePath(p));
    const { exitCode } = execa.commandSync(`git lfs track ${relativePath}`, {
      cwd: toAbsolutePath(runCWD),
    });
    if (exitCode !== 0) {
      throw GitLFSCheckModuleErrorType.FixFileLFSStatusFail;
    }
  };

  public run = async (ctx: IGitLFSCheckModuleContext): Promise<IGitLFSCheckModuleFileError[]> => {
    const {
      files,
      result,
      fix,
      option: { checkPattern },
    } = ctx;

    for (const f of files) {
      terminal.writeVerboseLine(withPrefix(`Checking LFS status for ${toRelativePath(f)}`));

      const isNeedToTrack: boolean = this.isFileNeedToTrack(f, checkPattern);

      if (isNeedToTrack && !this.isTrackedByLFS(f)) {
        result.push({
          file: toRelativePath(f),
          errorType: GitLFSCheckModuleErrorType.FileNeedToBeTrackedByLFS,
        });
        terminal.writeErrorLine(withPrefix(`${toRelativePath(f)} need to be managed by Git LFS`));
      } else {
        result.push({
          file: toRelativePath(f),
        });
      }
    }

    const errors: IGitLFSCheckModuleFileError[] = result.filter(
      e => typeof e.errorType !== 'undefined'
    );
    if (fix && errors.length > 0) {
      terminal.writeLine(withPrefix('Trying to automatically fix files with Git LFS...'));
      let fixedCount: number = 0;
      for (const e of errors) {
        try {
          this.fixFile(e.file);
          fixedCount++;
          terminal.writeLine(withPrefix(e.file + ' ✅'));
        } catch (error) {
          terminal.writeErrorLine(
            withPrefix(`Can't fix ${e.file} automatically, please fix it manually`)
          );
        }
      }
      if (fixedCount === errors.length) {
        terminal.writeLine(
          withPrefix(
            'All files fixed, please add the modified .gitattributes files to git and commit them again'
          )
        );
      }
    }

    return result;
  };
}
