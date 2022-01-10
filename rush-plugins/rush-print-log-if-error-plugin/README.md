# rush-print-log-if-error-plugin

Rush plugin for print entire log if error log exists

# Prerequisite

Rush.js >= 5.57.0

# Usage

```
rush print-log-if-error
```

## Advance Usage

```bash
#!/bin/bash

# logout if error
trap "node common/scripts/install-run-rush.js print-log-if-error" ERR

node common/scripts/install-run-rush.js build
```

# How it works

If `<package_name>.build.error.log` exists, print the content of `<package_name>.build.log`

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
