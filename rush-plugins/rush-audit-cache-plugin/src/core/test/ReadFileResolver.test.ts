import { ReadFileResolver } from "../ReadFileResolver";
import { IAnalyzeResult, IRisk } from "../Analyzer";
import { IFileResolveResult } from "../base/BaseFileResolver";

type IAnalyzeResultWithSafe = IAnalyzeResult[string] & { safe: IRisk[] };

describe("ReadFileResolver", () => {
  const handleResolveResult = (
    result: IAnalyzeResultWithSafe,
    resolveResult: IFileResolveResult,
    readFilePath: string
  ): void => {
    if (resolveResult.level === "safe") {
      result.safe.push({
        kind: "readFile",
        filePath: readFilePath,
      });
      return;
    }

    if (resolveResult.level === "low") {
      result.lowRisk.push({
        kind: "readFile",
        filePath: readFilePath,
      });
      return;
    }
    result.highRisk.push({
      kind: "readFile",
      filePath: readFilePath,
    });
  };

  it("should audit 1 high risk and 2 low risk", async () => {
    const readFiles = [
      "/tmp/rollup-plugin-progress",
      "/usr/lib/x86_64-linux-gnu/libm-2.28.so",
      "/root/node_modules/.pnpm/rollup-plugin-typescript2/umd/rpt2_ce91b375290c4fee5b255c9d9f687d89e0587857/code/cache/435d89aa78",
    ];
    const readFileResolver = new ReadFileResolver();
    const result: IAnalyzeResultWithSafe = {
      lowRisk: [],
      highRisk: [],
      safe: [],
    };

    for (const readFilePath of readFiles) {
      const resolveResult: IFileResolveResult =
        readFileResolver.resolve(readFilePath);
      handleResolveResult(result, resolveResult, readFilePath);
    }

    expect(result).toEqual({
      lowRisk: [
        {
          filePath: "/usr/lib/x86_64-linux-gnu/libm-2.28.so",
          kind: "readFile",
        },
        {
          filePath:
            "/root/node_modules/.pnpm/rollup-plugin-typescript2/umd/rpt2_ce91b375290c4fee5b255c9d9f687d89e0587857/code/cache/435d89aa78",
          kind: "readFile",
        },
      ],
      highRisk: [
        {
          filePath: "/tmp/rollup-plugin-progress",
          kind: "readFile",
        },
      ],
      safe: [],
    });
  });

  it("should audit 2 safe file read", async () => {
    const readFiles = [
      "/tmp/rollup-plugin-progress",
      "/usr/lib/x86_64-linux-gnu/libm-2.28.so",
      "/root/node_modules/.pnpm/rollup-plugin-typescript2/umd/rpt2_ce91b375290c4fee5b255c9d9f687d89e0587857/code/cache/435d89aa78",
      "/workspaceRepo/a/src/utils/types.ts",
      "/workspaceRepo/a/src/utils/uid.ts",
    ];
    const readFileResolver = new ReadFileResolver();
    const result: string[] = [];

    readFileResolver.projectSafeMatcher.add("/workspaceRepo/a");

    for (const readFilePath of readFiles) {
      const resolveResult: IFileResolveResult =
        readFileResolver.resolve(readFilePath);
      if (resolveResult.level === "safe") {
        result.push(readFilePath);
      }
    }

    expect(result).toEqual([
      "/workspaceRepo/a/src/utils/types.ts",
      "/workspaceRepo/a/src/utils/uid.ts",
    ]);
  });

  it("should load global config, audit 1 high risk, 2 low risk and 2 safe file read", async () => {
    const readFiles = [
      "/tmp/rollup-plugin-progress",
      "/usr/lib/x86_64-linux-gnu/libm-2.28.so",
      "/root/node_modules/.pnpm/rollup-plugin-typescript2/umd/rpt2_ce91b375290c4fee5b255c9d9f687d89e0587857/code/cache/435d89aa78",
      "/workspaceRepo/a/src/utils/types.ts",
      "/workspaceRepo/a/src/utils/uid.ts",
    ];
    const readFileResolver = new ReadFileResolver();
    const result: IAnalyzeResultWithSafe = {
      lowRisk: [],
      highRisk: [],
      safe: [],
    };

    readFileResolver.projectSafeMatcher.add("/workspaceRepo/a");
    readFileResolver.loadGlobalFilterConfig([
      { operate: "read", kind: "system", level: "high" },
      {
        operate: "read",
        pattern: "^/tmp/rollup-plugin-progress$",
        level: "low",
      },
    ]);

    for (const readFilePath of readFiles) {
      const resolveResult: IFileResolveResult =
        readFileResolver.resolve(readFilePath);
      handleResolveResult(result, resolveResult, readFilePath);
    }

    expect(result).toEqual({
      lowRisk: [
        {
          filePath: "/tmp/rollup-plugin-progress",
          kind: "readFile",
        },
        {
          filePath:
            "/root/node_modules/.pnpm/rollup-plugin-typescript2/umd/rpt2_ce91b375290c4fee5b255c9d9f687d89e0587857/code/cache/435d89aa78",
          kind: "readFile",
        },
      ],
      highRisk: [
        {
          filePath: "/usr/lib/x86_64-linux-gnu/libm-2.28.so",
          kind: "readFile",
        },
      ],
      safe: [
        {
          filePath: "/workspaceRepo/a/src/utils/types.ts",
          kind: "readFile",
        },
        {
          filePath: "/workspaceRepo/a/src/utils/uid.ts",
          kind: "readFile",
        },
      ],
    });
  });

  it("should load project and repo config, audit 0 high risk, 1 low risk and 4 safe file read", async () => {
    const readFiles = [
      "/tmp/rollup-plugin-progress",
      "/usr/lib/x86_64-linux-gnu/libm-2.28.so",
      "/root/node_modules/.pnpm/rollup-plugin-typescript2/umd/rpt2_ce91b375290c4fee5b255c9d9f687d89e0587857/code/cache/435d89aa78",
      "/workspaceRepo/a/src/utils/types.ts",
      "/workspaceRepo/a/src/utils/uid.ts",
    ];
    const readFileResolver = new ReadFileResolver();
    const result: IAnalyzeResultWithSafe = {
      lowRisk: [],
      highRisk: [],
      safe: [],
    };

    readFileResolver.projectSafeMatcher.add("/workspaceRepo/a");
    readFileResolver.loadGlobalFilterConfig([
      { operate: "read", kind: "system", level: "high" },
      {
        operate: "read",
        pattern: "^/tmp/rollup-plugin-progress$",
        level: "low",
      },
    ]);
    readFileResolver.loadProjectFilterConfig([
      { operate: "read", kind: "system", level: "safe" },
      {
        operate: "read",
        pattern: "^/tmp/rollup-plugin-progress$",
        level: "safe",
      },
    ]);

    for (const readFilePath of readFiles) {
      const resolveResult: IFileResolveResult =
        readFileResolver.resolve(readFilePath);
      handleResolveResult(result, resolveResult, readFilePath);
    }

    expect(result).toEqual({
      lowRisk: [
        {
          filePath:
            "/root/node_modules/.pnpm/rollup-plugin-typescript2/umd/rpt2_ce91b375290c4fee5b255c9d9f687d89e0587857/code/cache/435d89aa78",
          kind: "readFile",
        },
      ],
      highRisk: [],
      safe: [
        {
          filePath: "/tmp/rollup-plugin-progress",
          kind: "readFile",
        },
        {
          filePath: "/usr/lib/x86_64-linux-gnu/libm-2.28.so",
          kind: "readFile",
        },
        {
          filePath: "/workspaceRepo/a/src/utils/types.ts",
          kind: "readFile",
        },
        {
          filePath: "/workspaceRepo/a/src/utils/uid.ts",
          kind: "readFile",
        },
      ],
    });
  });
});
