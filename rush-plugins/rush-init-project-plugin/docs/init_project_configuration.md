# Configuration to manage templates
You can create a configuration file called `template.json` with your templates.

For instance,

```
common/_templates
├── rush-plugin-for-command
└── template.json
```

For `template.json`
```
{
  "templates": [
    {
      "displayName": "command template",
      "templateFolder": "rush-plugin-for-command", // relative to template.json
    }
  ]
}
```
# Configuration for initialize project

You can create a configuration file called `init.config.js` or `init.config.ts` under your template folder.

For instance,

```
common/_templates
└── rush-plugin-for-command
    ├── README.md
    ├── init.config.js  // <---
    ├── init.config.ts  // <---
```

## Example for JavaScript configuration file:

```javascript
/** @type {import('../../autoinstallers/command-plugins/node_modules/rush-init-project-plugin').IConfig} */
const config = {
  prompts: [],
  plugins: [],
  defaultProjectConfiguration: {},
};
module.exports = config;
```

The comment contains `@types` tell your IDE where is the type of configuration.

NOTE: you should replace `autoinstallers/command-plugins` with a real directory `autoinstallers/<real_plugin_installed_autoinstaller_name>`

## Example for TypeScript configuration file:

```typescript
import type { IConfig } from "../../autoinstallers/command-plugins/node_modules/rush-init-project-plugin";

const config: IConfig = {
  prompts: [],
  plugins: [],
  defaultProjectConfiguration: {},
};

export default config;
```

❗️❗️❗️ **NOTE**:

1. You should install `typescript` as a dependencies in according autoinstaller
2. You should replace `autoinstallers/command-plugins` with a real directory `autoinstallers/<real_plugin_installed_autoinstaller_name>` to make type works.
Or, you can add a `tsconfig.json` file under your `common/_templates/_plugins` folder and set up `paths` to make type works.

e.g.

**common/autoinstallers/command-plugins/package.json**

```json
{
  "name": "command-plugins",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "rush-init-project-plugin": "0.1.1",
    "typescript": "4.4.2"
  }
}
```

**common/_templates/_plugins/tsconfig.json**

```json
{
  "compilerOptions": {
    "paths": {
      "rush-init-project-plugin": ["../../autoinstallers/command-plugins/node_modules/rush-init-project-plugin"],
    }
  }
}
```

**common/_templates/_plugins/demoPlugin.ts**

```typescript
import type { IConfig, IPlugin } from 'rush-init-project-plugin';
```


❗️❗️❗️

# `prompts`

prompts is a list of `PromptQuestion`. The will be appended to internal questions, and prompt user to answer them.

e.g.

```javascript
const config = {
  prompts: [
    {
      type: "input",
      name: "cdnHost",
      message: "Input your CDN Host",
    },
  ],
};
```

then `cdnHost` is added to `answers`, and becomes one of the data when rendering template. That says `{{ cdnHost }}` in template file, will be replaced with the string user input.

# `defaultProjectConfiguration`

`defaultProjectConfiguration` is used to specify the project configuration in `rush.json`

For example,

```typescript
import type {
  IConfig,
  IHooks,
  IPluginContext,
} from "../../autoinstallers/command-plugins/node_modules/rush-init-project-plugin";

const config: IConfig = {
  defaultProjectConfiguration: {
    reviewCategory: "libraries",
  },
};

export default config;
```

The initialized project configuration is `rush.json` will be

```json
{
  "projects": [
    {
      "packageName": "<real_package_name>",
      "projectFolder": "<real_project_folder>",
      "reviewCategory": "libraries" // <--- comes from defaultProjectConfiguration
    }
  ]
}
```

## `defaultProjectConfiguration` properties

Current defaultProjectConfiguration supports the following properties:

- `reviewCategory`
- `decoupledLocalDependencies`
- `shouldPublish`
- `skipRushCheck`
- `versionPolicyName`
- `publishFolder`
- `tags`

Please check [Rush documentation](https://rushjs.io/pages/configs/rush_json/) for more details.

# `plugins`

For flexibility, a tiny plugin system is created inside this plugin (Yes! Yet another plugin system upon rush plugin system)

A plugin instance is JavaScript object which has an `apply` method. The method is called by this plugin, giving extensibility of initialization process.

## Plugin Usage

```typescript
import type {
  IConfig,
  IHooks,
  IPluginContext,
} from "../../autoinstallers/command-plugins/node_modules/rush-init-project-plugin";

const config: IConfig = {
  prompts: [],
  plugins: [
    {
      apply: (hooks: IHooks, pluginContext: IPluginContext) => {
        // plugin logic here
      },
    },
  ],
};

export default config;
```

You can also extract plugin logic and reuse it across multiple configuration file.

```typescript
import type {
  IConfig,
  IHooks,
  IPluginContext,
} from "../../autoinstallers/command-plugins/node_modules/rush-init-project-plugin";
import { CDNPlugin } from "../_plugins/cdn-plugin";

const config: IConfig = {
  prompts: [],
  plugins: [new CDNPlugin()],
};

export default config;
```

```typescript
import type {
  IPlugin,
  IHooks,
  IPromptsHookParams,
} from "../../autoinstallers/command-plugins/node_modules/rush-init-project-plugin/lib";

export class CDNPlugin implements IPlugin {
  apply(hooks: IHooks): void {
    hooks.prompts.tap("CDNPlugin", (prompts: IPromptsHookParams) => {
      // unshift make this question prompt to user just after template is answered.
      prompts.promptQueue.unshift({
        type: "input",
        name: "cdnHost",
        message: "Input your CDN host",
      });
    });
  }
}
```

Now, the former functionality is extracted to a individual file at `common/_templates/_plugins/cdn-plugin.ts`.

Thus, plugins can be used across templates.

> NOTE: The folders startsWith `_` are not treated as template folder. No worries :)

## Plugin Hooks

The plugin system is based on `tapable`, if you are familiar with `webpack` plugin, it's pretty easy to follow.

Plugin hooks Workflow:

```
┌─────────────────────────────┐
│                             │
│ prompt to select a template │
│                             │
└──────────────┬──────────────┘
               │
               │
┌──────────────▼──────────────────────┐
│                                     │
│ Load Configuration                  │
│ <template_name>/init.config.[js|ts] │
│                                     │
└──────────────┬──────────────────────┘
               │
               │
┌──────────────▼────────────────────┐
│ Apply plugins in a sequence order │
└──────────────┬────────────────────┘
               │
               │
┌──────────────▼──────────┐
│ hooks.plop.call(plop)   │
└──────────────┬──────────┘
               │
               │
┌──────────────▼─────────────────────────┐
│ hooks.prompts.promise({ promptQueue }) │
└──────────────┬─────────────────────────┘
               │
               │
               │
┌──────────────▼───────────────────────┐
│ hooks.promptQuestion                 ◄───┐
│    .get(currentPrompt.name)          │   │
│    .call(currentPrompt, answerSoFar) │   │
└──────────────┬─────────────┬─────────┘   │
               │             │             │
               │             └─────────────┘
               │
               │
┌──────────────▼────────────────────┐
│ hooks.answers.promise(allAnswers) │
└──────────────┬────────────────────┘
               │
               │
┌──────────────▼──────────────────┐
│ hooks.actions.call({ actions }) │
└─────────────────────────────────┘
               │
               │
┌──────────────▼──────────────────────┐
│ hooks.done.promise(result, answers) │
└─────────────────────────────────────┘
```

### prompts

- AsyncSeriesHook
- params: `IPromptsHookParams`
  - { promptQueue: PromptQuestion[] }

`promptQueue` is internal queue of prompt question. and question will be prompt to use in sequence order.

Mutate the `promptQueue` makes you access the whole prompt process in initialization.

### promptQuestion

- HookMap
- Each hook params: `promptQuestion`, `answersSoFar`

Hooks inside a HookMap is dynamically created in runtime. You can use `hooks.promptQuestion.for('projectFolder')` to get the hook for `projectFolder` prompt question.

and then, use `tap` to access the original promptQuestion and answers so far

e.g.

```typescript
hooks.promptQuestion
  .for("projectFolder")
  .tap("yourPluginName", (promptQuestion, answersSoFar) => {
    // logic here
  });
```

You can mutate `promptQuestion` and `answersSoFar`.

And, if the callback function returns `null`, this question will be no longer prompt to user.

### actions

- SyncHook
- params: `IActionsHookParams`
  - { actions: ActionType[] }

`actions` are extra actions will be registered into plop.

See [plop#ActionConfig](https://github.com/plopjs/plop#interface-actionconfig) for detail.

default actions as follow:

- `addProjectToRushJson`
- `runRushUpdate`
- `sortPackageJson`
- [plop built-in actions](https://github.com/plopjs/plop#built-in-actions)

### answers

- AsyncSeriesHook
- Params: `Answers`

`answers` is all answers collected after the end of prompts. You can mutate answers in this hook. Since this object is used as handlebars data. You can inject more template data information into this object as well.

### defaultProjectConfiguration

- SyncHook
- Params: `IDefaultProjectConfiguration`, `Answers`
  - `({ // defaultProjectConfiguration }, { // answers }`

`defaultProjectConfiguration` with all answers is passed. You can mutate `defaultProjectConfiguration` here.

### plop

- SyncHook
- Params: `NodePlopAPI`

This hooks exposes the internal `plop` API.

### done

- AsyncSeriesHook
- Params: `IResult`, `Answers`

1. IResult = 'Failed' | 'Succeeded'
2. `Answers` is all answers collected after the end of prompts.

# How to develop a plugin

## Case 1: Add a new prompt question called `needCreateFoo`

```typescript
import type {
  IPlugin,
  IHooks,
  IPromptsHookParams,
} from "../../autoinstallers/command-plugins/node_modules/rush-init-project-plugin/lib";

export class FooPlugin implements IPlugin {
  apply(hooks: IHooks): void {
    hooks.prompts.tap("CDNPlugin", (prompts: IPromptsHookParams) => {
      prompts.promptQueue.push({
        type: "confirm",
        name: "needCreateFoo",
        message: "Do you need create foo?",
      });
    });
  }
}
```

## Case 2: Add a custom action and run depends on `needCreateFoo`

```typescript
import type {
  IPlugin,
  IHooks,
  IPromptsHookParams,
  IAnswers,
} from "../../autoinstallers/command-plugins/node_modules/rush-init-project-plugin/lib";

interface IAnswersWithFoo extends IAnswers {
  needCreateFoo?: boolean;
}

export class FooPlugin implements IPlugin {
  apply(hooks: IHooks): void {
    /// ...snip

    // create a custom action called `createFoo`
    hooks.plop.tap("FooPlugin", (plop) => {
      plop.setActionType("createFoo", async (_ans: any) => {
        const answers = _ans as IAnswersWithFoo;
        if (!answers.needCreateFoo) {
          return "Skip create foo";
        }
        // do create foo logic
        return "Create foo successfully";
      });
    });

    // push `createFoo` action into plop actions
    hooks.actions.tap("FooPlugin", ({ actions }) => {
      actions.push({
        type: "createFoo",
      });
    });
  }
}
```

## Case 3: Replace render engine with [ejs](https://www.npmjs.com/package/ejs)

```typescript
import ejs from 'ejs';
import type { IAnswers, IPlugin, IHooks, IPromptsHookParams } from 'rush-init-project-plugin';

export class EJSPlugin implements IPlugin {
  public static readonly pluginName: string = 'ejsPlugin';
  apply(hooks: IHooks): void {
    hooks.plop.tap(EJSPlugin.pluginName, (plop) => {
      plop.renderString = (template: string, data: IAnswers) => {
        return ejs.render(template, data);
      }
    });
  };
}
```

NOTE: `ejs` is installed by `autoinstaller`

```json
// common/autoinstallers/command-plugins/package.json
{
  "dependencies": {
    "ejs": "3.8.1"
  }
}
```

## Case 4: Add predefined variables to template

```typescript
import type { IAnswers, IPlugin, IHooks, IPromptsHookParams } from 'rush-init-project-plugin';

export class MyDataPlugin implements IPlugin {
  public static readonly pluginName: string = 'MyDataPlugin';
  apply(hooks: IHooks): void {
    hooks.answers.tap(MyDataPlugin.pluginName, (answers) => {
      // mutate answers here
      answers.foo = 'foo';
      answers.bar = 'bar';
    });
  };
}
```

## Case 5: Report init-project usage to telemetry server

```typescript
import type { IAnswers, IPlugin, IHooks, IResult } from 'rush-init-project-plugin';

export class MyTelemetryPlugin implements IPlugin {
  apply(hooks: IHooks): void {
    hooks.done.tapPromise("my-telemetry-plugin", async (result: IResult, answers: IAnswers) => {
      // report to telemetry server...
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          console.log(result, answers);
        }, 1000);
        resolve();
      });
    });
  };
}
```