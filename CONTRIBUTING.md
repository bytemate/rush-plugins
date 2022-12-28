# Setting your machine

1. Install a LTS Node.js version, such as v14.19.1 
2. Install rush globally: `npm install -g @microsoft/rush`
3. Clone the repository: `git clone git@github.com:bytesfriends/rush-plugins.git`

# Building the project

We use Rush tool for building projects in this monorepo.

1. Use rush to install the package dependencies:

```
cd rush-plugins
rush install
```

Note: you need to configure a Github email like **mrexample@users.noreply.github.com**

2. Build the project in the repo:

```
# rush build -t <package_name>
rush build -t rush-archive-project-plugin
```

# Testing the project

This section shows the way to test the plugin in this repo.

Use `rush-archive-project-plugin` for example:

1. Modify **common/autoinstallers/command-plugins/package.json**

```
{
  "name": "command-plugins",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "rush-archive-project-plugin": "1.1.3",
-   "rush-audit-cache-plugin": "0.0.2",
+   "rush-audit-cache-plugin": "link:../../../rush-plugins/rush-archive-project-plugin",
    "rush-init-project-plugin": "0.6.0",
    "rush-lint-staged-plugin": "0.1.6",
    "rush-sort-package-json": "0.0.3",
    "rush-upgrade-self-plugin": "1.0.6",
    "typescript": "4.4.2"
  }
}
```

2. Update the plugins

```
rush update-autoinstaller --name command-plugins

rush update
```

3. Test your plugin

Since `rush-archive-project-plugin` provides `rush archive-project`, you can test it now!

Note: You can see this approach uses a `link:` protocol to install a rush plugin package by relative path. That means you can also configure another local monorepo to use this plugin as well.

# Submitting a Pull Request

We welcome contributions! To submit a feature:

1. Fork the repo.
2. Create a branch and commit your changes.
3. If you modify any package.json files, run `rush update` to make sure the `pnpm-lock.yaml` file is up to date. Commit any changes made to that file.
4. Before creating your PR, run `rush change`; If prompted, enter a change log message, commit the files that get created.
5. Create a [pull request](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request)
6. Add the project name as a prefix to your PR title. For example: "[rush-archive-project-plugin] Added a new API feature" or "[rush-init-project-plugin] Fixed a bug in the plugin".