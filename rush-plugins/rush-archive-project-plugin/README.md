# rush-archive-project-plugin

Rush plugin for archive/unarchive project code in monorepo.

# Prerequisite

Rush.js >= 5.57.0

# Usage

```
rush archive-project --package-name <your_package_name>
rush unarchive-project --package-name <your_package_name>
```

# How archive works

1. find project configuration via Rush.js, such as project folder
2. `git clean -xdf` under project folder
3. record project configuration into `rush-metadata.json` file
4. run sth like `tar -czf <unscoped_package_name>.tar.gz -C <project_folder> .` to create a tarball
5. move tarball to `common/_graveyard` folder
6. remove project config to `rush.json`
7. delete project folder

# How unarchive works

1. extract tarball by `packageName`
2. run std like `tar xf <package_name>.tar.gz` to extract tarball
3. read metadata file to get project configuration
4. move source code to project folder
5. resume project configuration into `rush.json`
6. delete metadata file and tarball

# How to use

1. Create an autoinstaller

> NOTE: you can also reuse a existing autoinstaller. If so, skip this step.

```
rush init-autoinstaller --name command-plugins
```

2. Install this plugin into autoinstaller

```
cd common/autoinstallers/command-plugins
pnpm install rush-archive-project-plugin
rush update-autoinstaller --name command-plugins
```

3. Update `common/config/rush/rush-plugins.json`

```
{
  "$schema": "https://developer.microsoft.com/json-schemas/rush/v5/rush-plugins.schema.json",
  "plugins": [
    {
      "packageName": "rush-archive-project-plugin",
      "pluginName": "rush-archive-project-plugin",
      "autoinstallerName": "command-plugins" // the name of autoinstaller you created before
    }
  ]
}
```

4. Run `rush update`

After rush update, `rush-plugin-manifest.json` and `command-line.json` will be synced. They should be committed into git.

All done!

Run `rush archive-project --package-name <package_name>` to archive a project.

And `rush unarchive-project --package-name <package_name>` to unarchive a project.

# LICENSE

MIT [@chengcyber](https://github.com/chengcyber)
