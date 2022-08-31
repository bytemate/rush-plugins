# rush-upgrade-self-plugin

Rush plugin for upgrade Rush.js itself in monorepo.

# Prerequisite

Rush.js >= 5.57.0

# Quick Start

1. Enabling this rush plugin

Please follow the [official doc](https://rushjs.io/pages/maintainer/using_rush_plugins/) to enable this plugin in your repo.

2. Upgrade Rush.js

```
rush upgrade-self
```

## Working process

1. Fetch `microsoft/rush` versions by `pacote`
2. Prompt user to choose a version, which decides the target versions of dependencies should be updated.(Those who prefixes with `@microsoft/` or `@rushstack/`)
3. Update dependencies(including devDependencies) in all `package.json` files
4. Update autoinstallers accordingly.
5. Prompt user whether to run `rush update`

# Something went wrong?

- Run `git checkout .` to revert all changes by this plugin.
- This plugin is designed to be idempotent. just run it again!

# LICENSE

MIT [@chengcyber](https://github.com/chengcyber)
