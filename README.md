This monorepo hosts unofficial rush plugins created and used inside ByteDance.

# rush-init-project-plugin

[![npm](https://img.shields.io/npm/dt/rush-init-project-plugin.svg?style=flat-square)](https://www.npmjs.com/package/rush-init-project-plugin)

When you want to create a new project in your monorepo. There are highly chances you need copy and paste from a project already inside your monorepo. Why not reuse them, like create a project template and used in your monorepo. Yes, `rush-init-project-plugin` is for you!

[More](./rush-plugins/rush-init-project-plugin/README.md)

# rush-upgrade-self-plugin

[![npm](https://img.shields.io/npm/dt/rush-upgrade-self-plugin.svg?style=flat-square)](https://www.npmjs.com/package/rush-upgrade-self-plugin)

When you maintain a Rush.js managed monorepo, and you write some toolkit based on rush related module, such as `microsoft/rush-lib`, `@rushstack/node-core-library`. Things become trivial if you want to upgrade Rush.js to latest version. You need keep the versions of those dependencies in consistency. `rush-upgrade-self-plugin` comes into rescue, it aims to help you upgrade/downgrade Rush.js version in one line.

[More](./rush-plugins/rush-upgrade-self-plugin/README.md)

# rush-archive-project-plugin

[![npm](https://img.shields.io/npm/dt/rush-archive-project-plugin.svg?style=flat-square)](https://www.npmjs.com/package/rush-archive-project-plugin)

After you have tons of project in monorepo, install time gets slower, manage dependencies becomes harder, while some projects are eventually inactive. You just want a way to archive projects properly, and maybe retrieve one day :)
Now, it's time to give this plugin a try!

[More](./rush-plugins/rush-archive-project-plugin/README.md)

# rush-print-log-if-error-plugin

[![npm](https://img.shields.io/npm/dt/rush-print-log-if-error-plugin.svg?style=flat-square)](https://www.npmjs.com/package/rush-print-log-if-error-plugin)

Sometimes build errors are collapsed in a remote machine, use this plugin to print the entire log if error occurs.

[More](./rush-plugins/rush-print-log-if-error-plugin/README.md)

# rush-lint-staged-plugin

[![npm](https://img.shields.io/npm/dt/rush-lint-staged-plugin.svg?style=flat-square)](https://www.npmjs.com/package/rush-lint-staged-plugin)

Are you finding alternative to `husky` in your monorepo? Rush takes care of Git hooks natively by sync hook scripts under `common/git-hooks/` folder into `.git/hooks`. So, all you need is `lint-staged`. Use this plugin to setup `lint-staged` in your monorepo!

[More](./rush-plugins/rush-lint-staged-plugin/README.md)

# rush-audit-cache-plugin

[![npm](https://img.shields.io/npm/dt/rush-audit-cache-plugin.svg?style=flat-square)](https://www.npmjs.com/package/rush-audit-cache-plugin)

Use of rush build cache is a great way to speed up your build. But, how to know if the configuration for cache is working as expected? This plugin is for you!

[More](./rush-plugins/rush-audit-cache-plugin/README.md)