import ignore, { Ignore } from "ignore";
import { BaseFileResolver } from "./base/BaseFileResolver";
import type {
  IUserProjectFileFilter,
  IUserProjectAfterFileFilter,
} from "./base/BaseFileResolver";

export class ReadFileResolver extends BaseFileResolver {
  private _lowRiskSystemRead: string[] = [
    "/usr/lib/",
    "/usr/share/locale/",
    "/usr/share/zoneinfo/",
    "/lib/",
    "/etc/",
    "/sys/",
    "/proc/",
    "/dev/null",
    "/dev/null/",
  ];
  private _lowRiskSystemReadMatcher: Ignore = ignore();
  private _lowRiskNodeRead: string[] = [
    "**/.nvm/",
    "**/.npm/",
    "**/node_modules/npm/",
    "**/node_modules/pnpm/",
    "**/node_modules/.cache/",
    "**/node_modules/.pnpm/",
    "**/.pnpm/",
    "**/.npmrc",
    "**/.nvmrc",
    "**/update-notifier-npm.json*",
  ];
  private _lowRiskNodeReadMatcher: Ignore = ignore();
  private _lowRiskToolRead: string[] = ["**/.git/", "**/.gitconfig"];
  private _lowRiskToolReadMatcher: Ignore = ignore();
  private _safeToolRead: string[] = ["**/common/temp/node_modules/"];
  private _safeToolReadIgnoreMatcher: Ignore = ignore();

  public constructor() {
    super();
    this.initDefaultMatchers([
      {
        matcher: this._lowRiskSystemReadMatcher,
        paths: this._lowRiskSystemRead,
        option: {
          kind: "system",
        },
      },
      {
        matcher: this._lowRiskNodeReadMatcher,
        paths: this._lowRiskNodeRead,
        option: {
          kind: "node",
        },
      },
      {
        matcher: this._lowRiskToolReadMatcher,
        paths: this._lowRiskToolRead,
        option: {
          kind: "tool",
        },
      },
      {
        matcher: this._safeToolReadIgnoreMatcher,
        paths: this._safeToolRead,
        option: {
          kind: "tool",
          level: "safe",
        },
      },
    ]);
  }

  public loadProjectFilterConfig(fileFilters: IUserProjectFileFilter[]): void {
    fileFilters.forEach((fileFilter) => {
      if (fileFilter.operate === "read") {
        if ("kind" in fileFilter) {
          this._userProjectAfterFileFilters.push(
            fileFilter as IUserProjectAfterFileFilter
          );
        } else {
          this._userProjectBeforeFileFilters.push(fileFilter);
        }
      }
    });
  }
}
