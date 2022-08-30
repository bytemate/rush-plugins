# rush-init-project-plugin

Initialize project in Rush.js monorepo like a pro!

# Prerequisite

Rush.js >= 5.57.0

See [Rush plugin](https://rushjs.io/pages/maintainer/using_rush_plugins/) for more details.

# Quick start

1. Ensure an autoinstaller for plugins

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
      "autoinstallerName": "command-plugins" // the name of autoinstaller which installs the plugin
    }
  ]
}
```

4. Run `rush update`

After rush update, `rush-plugin-manifest.json` and `command-line.json` will be synced. Please commit them into git.

5. Add your first template

Let's say you want to add a new template named `my-template`, put your project templates under `common/_templates/my-template` folder.

```
common/_templates
└── my-template
    ├── README.md
    └── package.json
```

Now, run `rush init-project` prompts you select a template list, which contains `my-template`.

After you answer some simple questions, files under `common/_templates/<template_name>` will be added into your project folder, and project configuration will be added to `rush.json` as well.

# Advance Usage

Kind of boring in a template way?

You can create a configuration file to extend initialization process.

See [HERE](./docs/init_project_configuration.md) for detail.

# Tech Notes

The whole CLI is based on [node-plop](https://www.npmjs.com/package/plop)

All directories under `common/_templates/<template_name>` are template source code, except those who prefixes with `_`. For instance folder named `_internal` is treated as internal folder not template folder.

All source code will be rendered by [handlebars](https://handlebarsjs.com/guide/).

Plenty of handlebar helpers are provided as default by [handlebars-helpers](https://www.npmjs.com/package/handlebars-helpers)


Default prompts includes:
- `packageName`: `"name"` field in `package.json`
- `unscopedPackageName`: `packageName` without npm scope
- `projectFolder`: the dest file path where the template will be rendered
- `description`: project description
- `authorName`: author name

# LICENSE

MIT [@chengcyber](https://github.com/chengcyber)
