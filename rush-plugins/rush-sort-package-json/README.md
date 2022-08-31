# rush-sort-package-json

Rush plugin for sort package.json file in the project.

# Quick Start

1. Enabling this rush plugin

Please follow the [official doc](https://rushjs.io/pages/maintainer/using_rush_plugins/) to enable this plugin in your repo.

2. Running `sort-package-json`

```
rush sort-package-json
```

# What is the plugin for?

We have noticed that:

1. There is some feedback about the package.json file under the rush repository being out of order.
2. `rush add` only puts the added dependencies at the end of the deps field.

Therefore, this command will sort all package.json files in the rush repository.

# Q: Why not modify the `rush add` command to keep it in order?

A: Because many other commands may also change package.json, such as `rush version --bump` or manually modify dependencies.

# Related issues


[rushstack #2496](https://github.com/microsoft/rushstack/issues/2496)


# LICENSE

MIT