# rush-print-log-if-error-plugin

Rush plugin for print entire log if error log exists

# Prerequisite

Rush.js >= 5.57.0

# Usage

```
rush print-log-if-error
```

# How it works

1. If `<package_name>.build.error.log` exists
2. Run `cat <package_name>.build.log`

# How to use

1. Create an autoinstaller

> NOTE: you can also reuse a existing autoinstaller. If so, skip this step.

```
rush init-autoinstaller --name command-plugins
```

2. Install this plugin into autoinstaller

```
cd common/autoinstallers/command-plugins
pnpm install rush-print-log-if-error-plugin
rush update-autoinstaller --name command-plugins
```

3. Update `common/config/rush/rush-plugins.json`

```
{
  "$schema": "https://developer.microsoft.com/json-schemas/rush/v5/rush-plugins.schema.json",
  "plugins": [
    {
      "packageName": "rush-print-log-if-error-plugin",
      "pluginName": "rush-print-log-if-error-plugin",
      "autoinstallerName": "command-plugins" // the name of autoinstaller you created before
    }
  ]
}
```

4. Run `rush update`

After rush update, `rush-plugin-manifest.json` and `command-line.json` will be synced. They should be committed into git.

All done! Run `rush print-log-if-error` and it should works!

# LICENSE

MIT [@chengcyber](https://github.com/chengcyber)
