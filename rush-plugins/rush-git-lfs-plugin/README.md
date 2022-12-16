# rush-git-lfs-plugin

A rush plugin that can check if files are correctly managed by Git LFS.

# Prerequisite

Rush.js >= 5.83.2


# Quick Start

1. Enabling this rush plugin

Please follow the [official doc](https://rushjs.io/pages/maintainer/using_rush_plugins/) to enable this plugin in your repo.

1. Running `git-lfs-check` command

```bash
# auto detect changed files by "git diff"
rush git-lfs-check

# or you can specify the files that need to be check\
rush git-lfs-check --file <my_file_name>

# you can add --fix option to auto fix incorrect lfs status
```
# Configuration

You can specify which paths should be checked by provided a set of glob patterns and the size threshold can be customized.

**JSON Schema For configuration**
```json5
{
  "$schema": "http://json-schema.org/draft-04/schema#",
  "title": "Configuration for Rush Git LFS plugin",
  "type": "object",
  "additionalProperties": false,
  "properties": {
    "$schema": {
      "type": "string",
      "default": "http://json-schema.org/draft-04/schema#"
    },
    "checkPattern": {
      "description": "Glob patterns that need to check",
      "patternProperties": {
        "^.+$": {
          "type": "string",
          "description": "Customized size threshold for this pattern."
        }
      }
    },
    "errorTips": {
      "type": "string",
      "description": "Tips that shown while there are check errors"
    }
  }
}
```

## Example Configurations
* Ban all png and dll files
  ```json5
  {
    "checkPattern": {
      "**/*.png": -1,
      "**/*.dll": -1
    },
  }
  ```
* Ban all files that larger than 5MB
  ```json5
  {
    "checkPattern": {
      "**/*": 5 * 1024 * 124,
    },
  }
  ```
* Ban files in particular folder
  ```json5
  {
    "checkPattern": {
      "**/some_folder_path": -1,
    },
  }
  ```
# LICENSE

MIT [@EscapeB](https://github.com/EscapeB)
