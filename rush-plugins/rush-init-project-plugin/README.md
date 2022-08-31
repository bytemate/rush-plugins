# rush-init-project-plugin

Initialize project in Rush.js monorepo like a pro!

# Prerequisite

Rush.js >= 5.57.0

# Quick Start

1. Enabling this rush plugin

Please follow the [official doc](https://rushjs.io/pages/maintainer/using_rush_plugins/) to enable this plugin in your repo.

2. Adding your first template

Let's say you want to add a new template named `my-template`, put the template files under `common/_templates/my-template` folder.

```
common/_templates
└── my-template
    ├── README.md
    └── package.json
```

Now, run `rush init-project` prompts you select a template list, which contains `my-template`.

After you answer some simple questions, files under `common/_templates/my-template` will be added into your project folder, and project configuration will be added to `rush.json` as well.

# Advance Usage

Kind of boring in a template way?

You can create a configuration file to extend initialization process.

See [HERE](./docs/init_project_configuration.md) for detail.

# Tech Notes

The whole CLI is based on [node-plop](https://www.npmjs.com/package/plop)

All directories under `common/_templates/<template_name>` are template source code, except those who prefixes with `_`. For instance, folder named `_plugins` is treated as internal folder not template folder where you can store shared code across templates.

All source code will be rendered by [handlebars](https://handlebarsjs.com/guide/), while using custom render engine is supported.

Plenty of handlebar helpers are provided as default by [handlebars-helpers](https://www.npmjs.com/package/handlebars-helpers)

Third party node modules can be used in `init.config` configuration file by installing them into the corresponding autoinstaller folder, such as `common/autoinstallers/rush-plugins/`.

Default prompts includes:
- `packageName`: `"name"` field in `package.json`
- `unscopedPackageName`: `packageName` without npm scope
- `projectFolder`: the dest file path where the template will be rendered
- `description`: project description
- `authorName`: author name

# LICENSE

MIT [@chengcyber](https://github.com/chengcyber)
