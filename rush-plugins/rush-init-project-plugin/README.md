# rush-init-project-plugin

Rush plugin for initialize project in monorepo

# Prerequisite

Rush.js >= 5.57.0

# Usage

Put your project templates under `common/_templates/<template_name>` folder.

Assuming

```
common/_templates
└── rush-plugin-for-command
    ├── README.md
    ├── command-line.json
    ├── config
    │   └── heft.json
    ├── package.json
    ├── rush-plugin-manifest.json
    ├── src
    │   ├── helpers
    │   │   └── terminal.ts
    │   └── index.ts
    └── tsconfig.json
```

then, you can run

```
rush init-project
```

it will prompt you select a template list, which contains `rush-plugin-for-command`.

After you answer some simple questions, files under `common/_templates/<template_name>` will be added into your project folder, and configuration will be added to `rush.json` as well.

# How it works

The whole CLI is based on [node-plop](https://www.npmjs.com/package/plop)

All directory under `common/_templates/<template_name>` are template source code, except those who prefixes with `_`. For instance folder named `_internal` is treated as internal folder not template folder.

After template is chosen, all template source code will be rendered by handlebars. i.e. variables like `{{ packageName }}` in file content will be expanded to your package name.

Current available tokens are `packageName`, `unscopedPackageName`, `projectFolder`, `authorName`.

Plenty of handlebar helpers are provided as default by [handlebars-helpers](https://www.npmjs.com/package/handlebars-helpers)

# How to plugin into your monorepo

1. Create an autoinstaller

> NOTE: you can also reuse a existing autoinstaller. If so, skip this step.

```
rush init-autoinstaller --name command-plugins
```

2. Install this plugin into autoinstaller

```
cd common/autoinstallers/command-plugins
pnpm install rush-init-project-plugin
rush update-autoinstaller --name command-plugins
```

3. Update `common/config/rush/rush-plugins.json`

```
{
  "$schema": "https://developer.microsoft.com/json-schemas/rush/v5/rush-plugins.schema.json",
  "plugins": [
    {
      "packageName": "rush-init-project-plugin",
      "pluginName": "rush-init-project-plugin",
      "autoinstallerName": "command-plugins" // the name of autoinstaller you created before
    }
  ]
}
```

4. Run `rush update`

After rush update, `rush-plugin-manifest.json` and `command-line.json` will be synced. They should be committed into git.

All done! You can run `rush init-project` now!

# Advance Usage

Kind of boring in a template way?

You can create a configuration file to extend initialization process.

See [HERE](./docs/init_project_configuration.md) for detail.

# LICENSE

MIT [@chengcyber](https://github.com/chengcyber)
