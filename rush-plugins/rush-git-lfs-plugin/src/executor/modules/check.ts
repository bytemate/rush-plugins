/* eslint-disable @typescript-eslint/member-ordering */
import path from 'path';
import fse from 'fs-extra';
import execa from 'execa';
import { RushConfigurationProject } from '@rushstack/rush-sdk';
import minimatch from 'minimatch';
import ora from 'ora';
import chalk from 'chalk';

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
  spinner: ora.Ora;
}

export interface IGitLFSCheckModuleFileError {
  file: string;
  errorType?: GitLFSCheckModuleErrorType;
  fixed?: boolean;
}

export const enum GitLFSCheckModuleErrorType {
  FileNeedToBeTrackedByLFS,
  FixFileLFSStatusFail,
  GitAddFail,
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
    this.addFileToGit(path.resolve(runCWD, '.gitattributes'));
    if (exitCode !== 0) {
      throw GitLFSCheckModuleErrorType.GitAddFail;
    }
  };

  public addFileToGit = (p: string): void => {
    terminal.writeVerboseLine(withPrefix(`Trying git add on ${toRelativePath(p)}`));
    const { exitCode } = execa.commandSync(`git add ${toRelativePath(p)}`, {
      cwd: toAbsolutePath(RushRootFolder),
    });
    if (exitCode !== 0) {
      throw GitLFSCheckModuleErrorType.GitAddFail;
    }
  };

  public run = async (ctx: IGitLFSCheckModuleContext): Promise<IGitLFSCheckModuleFileError[]> => {
    const {
      files,
      result,
      fix,
      option: { checkPattern },
      spinner,
    } = ctx;

    spinner.start('Start Git LFS check...');
    for (const f of files) {
      terminal.writeVerboseLine(withPrefix(`Checking file status for ${toRelativePath(f)}`));
      spinner.text = `Checking file status for ${toRelativePath(f)}`;
      const isNeedToTrack: boolean = this.isFileNeedToTrack(f, checkPattern);

      if (isNeedToTrack && !this.isTrackedByLFS(f)) {
        let isFixed: boolean = false;

        if (fix) {
          try {
            terminal.writeVerboseLine(withPrefix(`Trying to fix ${toRelativePath(f)}`));
            this.fixFile(f);
            isFixed = true;
            terminal.writeVerboseLine(withPrefix(`Fixed ${toRelativePath(f)}`));
          } catch (e) {
            terminal.writeVerboseLine(
              withPrefix(`Error occurs while fixing ${toRelativePath(f)} ${e}`)
            );
          }
        }
        if (isFixed) {
          spinner.warn(
            `Git LFS check failed for ${chalk.red(
              toRelativePath(f)
            )}, but was automatically fixed`
          );
        } else {
          result.push({
            file: toRelativePath(f),
            errorType: GitLFSCheckModuleErrorType.FileNeedToBeTrackedByLFS,
          });
          spinner.fail(
            `Git LFS check failed for ${chalk.red(toRelativePath(f))}${
              fix ? " and can't be automatically fixed" : ''
            }`
          );
        }
      } else {
        result.push({
          file: toRelativePath(f),
        });
      }
    }

    const errors: IGitLFSCheckModuleFileError[] = result.filter(
      e => typeof e.errorType !== 'undefined'
    );
    if (errors.length > 0) {
      spinner.fail('Git LFS check failed');
    } else {
      spinner.succeed('Git LFS check success');
    }

    return result;
  };
}
