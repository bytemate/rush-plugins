# rush-upgrade-self-plugin

Rush plugin for upgrade Rush.js itself in monorepo.

# Prerequisite

Rush.js >= 5.57.0

# Usage

1. Create a autoinstaller

> NOTE: you can also reuse a existing autoinstaller. If so, skip this step.

```
rush init-autoinstaller --name command-plugins
```

2. Install this plugin into autoinstaller

```
cd common/autoinstallers/command-plugins
pnpm install rush-upgrade-self-plugin
rush update-autoinstaller --name command-plugins
```

3. Update `common/config/rush/rush-plugins.json`

```
{
  "$schema": "https://developer.microsoft.com/json-schemas/rush/v5/rush-plugins.schema.json",
  "plugins": [
    {
      "packageName": "rush-upgrade-self-plugin",
      "pluginName": "rush-upgrade-self-plugin",
      "autoinstallerName": "command-plugins" // the name of autoinstaller you created before
    }
  ]
}
```

4. Run `rush update`

After rush update, `rush-plugin-manifest.json` will be generated. It should be committed into git.

All done! Run `rush upgrade-self` and it should works!

# LICENSE

MIT [@chengcyber](https://github.com/chengcyber)
