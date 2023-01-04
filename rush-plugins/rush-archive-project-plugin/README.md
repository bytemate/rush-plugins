# rush-archive-project-plugin

A rush plugin for archive/unarchive project source code in monorepo.

# Prerequisite

Rush.js >= 5.57.0

# Quick Start

1. Enabling this rush plugin

Please follow the [official doc](https://rushjs.io/pages/maintainer/using_rush_plugins/) to enable this plugin in your repo.


2. Running archive project command

```
rush archive-project --package-name <your_package_name>
```

> restoring your code by `rush unarchive-project --package-name <your_package_name>`

# Archive working process

1. Find project configuration by Rush.js SDK
2. Check whether there are projects depends on target project
3. Run `git clean -xdf` under project folder
4. Create a checkpoint branch with the name `${projectName}-checkpoint-${date}`
5. Update checkpoint branch information in `common/_graveyard/projectCheckpoints.json` file
6. Record project configuration into `rush-metadata.json` file
7. Create a tarball by running `tar -czf <unscoped_package_name>.tar.gz -C <project_folder> .`
8. Move the tarball to `common/_graveyard` folder
9. Remove project config to `rush.json`
10. Delete project folder

# Unarchive working process

1. Find the tarball by `packageName`
2. Extract the tarball by running `tar xf <package_name>.tar.gz`
3. Get project configuration by reading `rush-metadata.json`
4. Remove checkpoint branch information from checkpoint metadata file if it exists
5. Move the code to project folder
6. Restore project configuration into `rush.json`
7. Delete metadata file and tarball

# LICENSE

MIT [@chengcyber](https://github.com/chengcyber)
