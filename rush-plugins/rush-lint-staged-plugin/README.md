# rush-lint-staged-plugin

Rush plugin for lint-staged

# Prerequisite

- Rush.js >= 5.57.0
- Node >= 12

# Quick Start

1. Enabling this rush plugin

Please follow the [official doc](https://rushjs.io/pages/maintainer/using_rush_plugins/) to enable this plugin in your repo.

2. Running `lint-staged`

```
rush lint-staged
```

3. Set up Git `pre-commit` hook

**common/git-hooks/pre-commit**

```
#!/bin/sh

node common/scripts/install-run-rush.js lint-staged || exit $?
```

4. Add a placeholder `lint-staged` config in root path.

The reason of adding this file is the fact that `lint-staged` behaves differently with the number of config files. With this placeholder config, `lint-staged` will always find multiple config files in your monorepo, which corrects the working directory of each task.

**<monorepo_root_path>/.lintstagedrc.json**

```
{
  "*": "echo ok"
}
```

# Rational

`lint-staged@>=12.2.1` supports a new feature called multiple config files. With this feature, each staged files can load different lint-staged configuration. This plugin invokes `lintStaged` for you. No more no less.

For example,

```
monorepo-root
├── scripts
|   └── index.js
├── apps/my-app
|   ├── index.js
|   └── .lintstagedrc.js
└── libraries/my-lib
    ├── index.js
    └── .lintstagedrc.js
```

Assuming git staged `apps/my-app/index.js`, `libraries/my-lib/index.js` and `scripts/index.js`

when `rush lint-staged` runs,

1. `apps/my-app/index.js` uses config from `apps/my-app/.lintstagedrc.js`
2. `libraries/my-lib/index.js` uses config from `libraries/my-lib/.lintstagedrc.js`
3. `scripts/index.js` has no related config, nothing runs for this file

# LICENSE

MIT [@chengcyber](https://github.com/chengcyber)
