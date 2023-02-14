/**
 * git lfs pull related project files
 * rush git-lsf-pull -t/--to projectName
 */
import { program } from 'commander';
import { gitLfsInstall, gitLfsPullByProject } from './executor';
import { terminal } from './helpers/terminal';

(async () => {
  program.option('--to <project...>', '-t <project...>', 'select project').action(async (params) => {
    const { to } = params;
    gitLfsInstall();
    try {
      gitLfsPullByProject([].concat(to));
      terminal.writeLine(`git-lfs-pull pull ${to} success`);
    } catch (error: any) {
      if (error && error.toString) {
        terminal.writeErrorLine(error.toString());
      } else {
        throw error;
      }
      process.exit(1);
    }
  });

  program.on('command:*', () => {
    console.error('undefined command', program.args.join(' '));
    process.exit(1);
  });

  await program.parseAsync(process.argv);
})().catch((e: any) => console.error(e && e.message ? e.message : e));
