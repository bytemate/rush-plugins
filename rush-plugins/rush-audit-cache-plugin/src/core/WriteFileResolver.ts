import ignore, { Ignore } from "ignore";
import { BaseFileResolver } from "./base/BaseFileResolver";
import type {
  IUserProjectAfterFileFilter,
  IUserProjectFileFilter,
} from "./base/BaseFileResolver";

export class WriteFileResolver extends BaseFileResolver {
  private _lowRiskNodeWrite: string[] = [
    "**/update-notifier-npm.json*",
    "**/node_modules/.cache/",
    "**/node_modules/.pnpm/",
  ];
  private _lowRiskNodeWriteMatcher: Ignore = ignore();

  public constructor() {
    super();
    this.initDefaultMatchers([
      {
        matcher: this._lowRiskNodeWriteMatcher,
        paths: this._lowRiskNodeWrite,
        option: {
          kind: "node",
        },
      },
    ]);
  }

  public loadProjectFilterConfig(fileFilters: IUserProjectFileFilter[]): void {
    fileFilters.forEach((fileFilter) => {
      if (fileFilter.operate === "write") {
        if ("kind" in fileFilter) {
          this._userProjectAfterFileFilters.unshift(
            fileFilter as IUserProjectAfterFileFilter
          );
        } else {
          this._userProjectBeforeFileFilters.unshift(fileFilter);
        }
      }
    });
  }

  public loadGlobalFilterConfig(fileFilters: IUserProjectFileFilter[]): void {
    fileFilters.forEach((fileFilter) => {
      if (fileFilter.operate === "write") {
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
