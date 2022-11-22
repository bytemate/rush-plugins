import * as path from "path";
import ignore, { Ignore } from "ignore";

export type IResolveKind = "system" | "node" | "tool" | "project";
export interface IFileResolveResult {
  level: "low" | "high" | "safe";
  kind?: IResolveKind;
}

type OneOf<T, P extends keyof T = keyof T> = {
  [K in P]-?: Required<Pick<T, K>> & Partial<Record<Exclude<P, K>, never>>;
}[P];

export type IUserProjectFileFilter = {
  level: IFileResolveResult["level"];
  operate: "write" | "read";
} & OneOf<{
  kind: IResolveKind;
  pattern: string | RegExp;
}>;

export interface IUserProjectBeforeFileFilter {
  level: IFileResolveResult["level"];
  operate: "write" | "read";
  pattern: string | RegExp;
}

export interface IUserProjectAfterFileFilter {
  level: IFileResolveResult["level"];
  operate: "write" | "read";
  kind: IResolveKind;
}

export class BaseFileResolver {
  protected _userProjectBeforeFileFilters: IUserProjectBeforeFileFilter[] = [];
  protected _userProjectAfterFileFilters: IUserProjectAfterFileFilter[] = [];

  private _matcherToResult: Map<Ignore, IFileResolveResult> = new Map();

  public projectSafeMatcher: Ignore = ignore();

  protected constructor() {}

  private _applyUserBeforeFilter(
    filePath: string
  ): IFileResolveResult | undefined {
    for (const fileFilter of this._userProjectBeforeFileFilters) {
      if (
        fileFilter.pattern &&
        new RegExp(fileFilter.pattern, "g").test(filePath)
      ) {
        return {
          level: fileFilter.level,
        };
      }
    }
    return;
  }

  private _applyUserAfterFilter(
    originMatcherResult: IFileResolveResult
  ): IFileResolveResult {
    const matcherResult: IFileResolveResult = {
      ...originMatcherResult,
    };

    for (const userProjectFilter of this._userProjectAfterFileFilters) {
      if (matcherResult.kind === userProjectFilter.kind) {
        matcherResult.level = userProjectFilter.level;
      }
      break;
    }
    return matcherResult;
  }

  protected initDefaultMatchers(
    params: {
      matcher: Ignore;
      paths: string[];
      option: {
        kind?: IResolveKind;
        level?: "low" | "high" | "safe";
      };
    }[]
  ): void {
    params.forEach(({ matcher, option, paths }) => {
      const { kind, level = "low" } = option;
      matcher.add(paths);
      this.setMatcher(matcher, {
        kind,
        level,
      });
    });
  }

  public setMatcher(matcher: Ignore, result: IFileResolveResult): void {
    this._matcherToResult.set(matcher, result);
  }

  public resolve(filePath: string): IFileResolveResult {
    const result: IFileResolveResult | undefined =
      this._applyUserBeforeFilter(filePath);
    if (result) {
      return result;
    }

    const relativePathToRoot: string = path.relative("/", filePath);
    if (!ignore.isPathValid(relativePathToRoot)) {
      throw new Error(`wrong path ${relativePathToRoot}`);
    }

    if (this.projectSafeMatcher.ignores(relativePathToRoot)) {
      return this._applyUserAfterFilter({ level: "safe", kind: "project" });
    }

    const ignored: Ignore | undefined = [...this._matcherToResult.keys()].find(
      (ig) => ig.ignores(relativePathToRoot)
    );

    if (ignored) {
      const matcherResult: IFileResolveResult = this._matcherToResult.get(
        ignored
      ) as IFileResolveResult;

      return this._applyUserAfterFilter(matcherResult);
    }

    return {
      level: "high",
    };
  }
}
