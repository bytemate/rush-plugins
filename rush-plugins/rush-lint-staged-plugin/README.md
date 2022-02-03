# rush-lint-staged-plugin

Rush plugin for lint-staged

# Prerequisite

- Rush.js >= 5.57.0
- Node >= 12

# Usage

```
rush lint-staged
```

# How it works

`lint-staged@12.2.1` supports a new feature called multiple config files. With this feature, each staged files can load different lint-staged configuration. This plugin is simplely invoke `lintStaged` for you.

For example,

```
monorepo-root
├── scripts
|   └── index.js
├── apps/my-app
|   ├── index.js
|   └── .lintstagedrc.json
└── libraries/my-lib
    ├── index.js
    └── .lintstagedrc.json
```

Assuming git staged `apps/my-app/index.js`, `libraries/my-lib/index.js` and `scripts/index.js`

when `rush lint-staged` runs,

1. `apps/my-app/index.js` uses config from `apps/my-app/.lintstagedrc.json`
2. `libraries/my-lib/index.js` uses config from `libraries/my-lib/.lintstagedrc.json`
3. `scripts/index.js` has no related config, nothing runs for this file

# How to plugin into your monorepo

1. Create an autoinstaller

> NOTE: you can also reuse a existing autoinstaller. If so, skip this step.

```
rush init-autoinstaller --name command-plugins
```

2. Install this plugin into autoinstaller

```
cd common/autoinstallers/command-plugins
pnpm install rush-lint-staged-plugin
rush update-autoinstaller --name command-plugins
```

3. Update `common/config/rush/rush-plugins.json`

```
{
  "$schema": "https://developer.microsoft.com/json-schemas/rush/v5/rush-plugins.schema.json",
  "plugins": [
    {
      "packageName": "rush-lint-staged-plugin",
      "pluginName": "rush-lint-staged-plugin",
      "autoinstallerName": "command-plugins" // the name of autoinstaller you created before
    }
  ]
}
```

4. Run `rush update`

After rush update, `rush-plugin-manifest.json` and `command-line.json` will be synced. They should be committed into git.

You can run `rush lint-staged` now!

5. Set up Git precommit hook that invokes `rush lint-staged` automatically whenever `git commit` is performed.

**common/git-hooks/pre-commit**

```shell
#!/bin/sh

# Called by "git commit" with no arguments.  The hook should
# exit with non-zero status after issuing an appropriate message if
# it wants to stop the commit.

# Invoke the "rush lint-staged" custom command to perform tasks
# for each file whenever they are committed. The command comes from
# rush-lint-staged-plugin.
node common/scripts/install-run-rush.js lint-staged || exit $?
```

6. Add multiple lint-staged config files

For example,

```
monorepo-root
├── apps/my-app
|   └── .lintstagedrc.json
└── libraries/my-lib
    └── .lintstagedrc.json
```

ALL DONE! try `git add` some files and `git commit`!

# LICENSE

MIT [@chengcyber](https://github.com/chengcyber)
