import { WriteFileResolver } from "../WriteFileResolver";
import { IAnalyzeResult, IRisk } from "../Analyzer";
import { IFileResolveResult } from "../base/BaseFileResolver";

type IAnalyzeResultWithSafe = IAnalyzeResult[string] & { safe: IRisk[] };

describe("WriteFileResolver", () => {
  const handleResolveResult = (
    result: IAnalyzeResultWithSafe,
    resolveResult: IFileResolveResult,
    writeFilePath: string
  ): void => {
    if (resolveResult.level === "safe") {
      result.safe.push({
        kind: "writeFile",
        filePath: writeFilePath,
      });
      return;
    }

    if (resolveResult.level === "low") {
      result.lowRisk.push({
        kind: "writeFile",
        filePath: writeFilePath,
      });
      return;
    }
    result.highRisk.push({
      kind: "writeFile",
      filePath: writeFilePath,
    });
  };

  it("should audit 1 high risk and 1 low risk", async () => {
    const writeFiles = [
      "/tmp/rollup-plugin-progress",
      "/root/node_modules/.cache/rollup-plugin-typescript2/umd/rpt2_ce91b375290c4fee5b255c9d9f687d89e0587857/code/cache/435d89aa78",
    ];
    const writeFileResolver = new WriteFileResolver();
    const result: IAnalyzeResultWithSafe = {
      lowRisk: [],
      highRisk: [],
      safe: [],
    };

    for (const writeFilePath of writeFiles) {
      const resolveResult: IFileResolveResult =
        writeFileResolver.resolve(writeFilePath);
      handleResolveResult(result, resolveResult, writeFilePath);
    }

    expect(result).toEqual({
      lowRisk: [
        {
          filePath:
            "/root/node_modules/.cache/rollup-plugin-typescript2/umd/rpt2_ce91b375290c4fee5b255c9d9f687d89e0587857/code/cache/435d89aa78",
          kind: "writeFile",
        },
      ],
      highRisk: [
        {
          filePath: "/tmp/rollup-plugin-progress",
          kind: "writeFile",
        },
      ],
      safe: [],
    });
  });

  it("should audit 2 safe file write", async () => {
    const writeFiles = [
      "/tmp/rollup-plugin-progress",
      "/root/node_modules/.cache/rollup-plugin-typescript2/umd/rpt2_ce91b375290c4fee5b255c9d9f687d89e0587857/code/cache/435d89aa78",
      "/workspaceRepo/a/dist/src/utils/types.js",
      "/workspaceRepo/a/dist/src/utils/uid.js",
    ];
    const writeFileResolver = new WriteFileResolver();
    const result: string[] = [];

    writeFileResolver.projectSafeMatcher.add("/workspaceRepo/a/dist");

    for (const writeFilePath of writeFiles) {
      const resolveResult: IFileResolveResult =
        writeFileResolver.resolve(writeFilePath);
      if (resolveResult.level === "safe") {
        result.push(writeFilePath);
      }
    }

    expect(result).toEqual([
      "/workspaceRepo/a/dist/src/utils/types.js",
      "/workspaceRepo/a/dist/src/utils/uid.js",
    ]);
  });

  it("should load global config, audit 1 high risk, 1 low risk and 2 safe file read", async () => {
    const writeFiles = [
      "/tmp/rollup-plugin-progress",
      "/root/node_modules/.cache/rollup-plugin-typescript2/umd/rpt2_ce91b375290c4fee5b255c9d9f687d89e0587857/code/cache/435d89aa78",
      "/workspaceRepo/a/dist/src/utils/types.js",
      "/workspaceRepo/a/dist/src/utils/uid.js",
    ];
    const writeFileResolver = new WriteFileResolver();
    const result: IAnalyzeResultWithSafe = {
      lowRisk: [],
      highRisk: [],
      safe: [],
    };

    writeFileResolver.projectSafeMatcher.add("/workspaceRepo/a/dist");
    writeFileResolver.loadGlobalFilterConfig([
      { operate: "write", kind: "node", level: "high" },
      {
        operate: "write",
        pattern: "^/tmp/rollup-plugin-progress$",
        level: "low",
      },
    ]);

    for (const writeFilePath of writeFiles) {
      const resolveResult: IFileResolveResult =
        writeFileResolver.resolve(writeFilePath);
      handleResolveResult(result, resolveResult, writeFilePath);
    }

    expect(result).toEqual({
      lowRisk: [
        {
          filePath: "/tmp/rollup-plugin-progress",
          kind: "writeFile",
        },
      ],
      highRisk: [
        {
          filePath:
            "/root/node_modules/.cache/rollup-plugin-typescript2/umd/rpt2_ce91b375290c4fee5b255c9d9f687d89e0587857/code/cache/435d89aa78",
          kind: "writeFile",
        },
      ],
      safe: [
        {
          filePath: "/workspaceRepo/a/dist/src/utils/types.js",
          kind: "writeFile",
        },
        {
          filePath: "/workspaceRepo/a/dist/src/utils/uid.js",
          kind: "writeFile",
        },
      ],
    });
  });

  it("should load project and repo config, audit 0 high risk, 1 low risk and 3 safe file read", async () => {
    const writeFiles = [
      "/tmp/rollup-plugin-progress",
      "/root/node_modules/.cache/rollup-plugin-typescript2/umd/rpt2_ce91b375290c4fee5b255c9d9f687d89e0587857/code/cache/435d89aa78",
      "/workspaceRepo/a/dist/src/utils/types.js",
      "/workspaceRepo/a/dist/src/utils/uid.js",
    ];
    const writeFileResolver = new WriteFileResolver();
    const result: IAnalyzeResultWithSafe = {
      lowRisk: [],
      highRisk: [],
      safe: [],
    };

    writeFileResolver.projectSafeMatcher.add("/workspaceRepo/a/dist");
    writeFileResolver.loadGlobalFilterConfig([
      { operate: "write", kind: "node", level: "high" },
      {
        operate: "write",
        pattern: "^/tmp/rollup-plugin-progress$",
        level: "low",
      },
    ]);
    writeFileResolver.loadProjectFilterConfig([
      { operate: "write", kind: "node", level: "low" },
      {
        operate: "write",
        pattern: "^/tmp/rollup-plugin-progress$",
        level: "safe",
      },
    ]);

    for (const writeFilePath of writeFiles) {
      const resolveResult: IFileResolveResult =
        writeFileResolver.resolve(writeFilePath);
      handleResolveResult(result, resolveResult, writeFilePath);
    }

    expect(result).toEqual({
      highRisk: [],
      lowRisk: [
        {
          filePath:
            "/root/node_modules/.cache/rollup-plugin-typescript2/umd/rpt2_ce91b375290c4fee5b255c9d9f687d89e0587857/code/cache/435d89aa78",
          kind: "writeFile",
        },
      ],
      safe: [
        {
          filePath: "/tmp/rollup-plugin-progress",
          kind: "writeFile",
        },
        {
          filePath: "/workspaceRepo/a/dist/src/utils/types.js",
          kind: "writeFile",
        },
        {
          filePath: "/workspaceRepo/a/dist/src/utils/uid.js",
          kind: "writeFile",
        },
      ],
    });
  });
});
