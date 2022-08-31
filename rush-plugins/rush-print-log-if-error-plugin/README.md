# rush-print-log-if-error-plugin

Rush plugin for print entire log if error log exists

# Prerequisite

Rush.js >= 5.57.0

# Quick Start

1. Enabling this rush plugin

Please follow the [official doc](https://rushjs.io/pages/maintainer/using_rush_plugins/) to enable this plugin in your repo.

2. Print log if error log exists

```
rush print-log-if-error
```

If `<package_name>.build.error.log` exists, print the content of `<package_name>.build.log`

## Advance Usage

```bash
#!/bin/bash

# logout if error
trap "node common/scripts/install-run-rush.js print-log-if-error" ERR

node common/scripts/install-run-rush.js build
```

# LICENSE

MIT [@chengcyber](https://github.com/chengcyber)
