import * as path from "path";
import { Executable } from "@rushstack/node-core-library";
import { archive } from "../archive";
import { defaultGraveyardRelativeFolder } from "../../logic/graveyard";

const folderSet = new Set<string>();

const resume = (folders: string[]) => {
  for (const folder of folders) {
    Executable.spawnSync("git", ["checkout", "."], {
      currentWorkingDirectory: folder,
    });
    Executable.spawnSync("git", ["clean", "-xdf"], {
      currentWorkingDirectory: folder,
    });
  }
};

describe("archive", () => {
  afterAll(() => {
    resume(Array.from(folderSet));
  });

  describe("archive basic", () => {
    const fixtureMonorepoPath = path.join(
      __dirname,
      "../../../",
      "fixtures/monorepo-1"
    );
    const fixtureMonorepoGraveyardPath = path.join(
      fixtureMonorepoPath,
      defaultGraveyardRelativeFolder
    );
    folderSet.add(fixtureMonorepoPath);
    folderSet.add(fixtureMonorepoGraveyardPath);
    beforeEach(() => {
      jest.spyOn(process, "cwd").mockReturnValue(fixtureMonorepoPath);
    });
    afterEach(() => {
      jest.resetAllMocks();
    });

    it("should not work with non existing package name", async () => {
      const packageName = "non-exist";
      await expect(
        archive({
          packageName,
          gitCheckpoint: false
        })
      ).rejects.toThrow(
        `Could not find project with package name ${packageName}`
      );
    });

    describe("fixture monorepo", () => {
      it("should work with fixture demo", async () => {
        const packageName = "demo-project";
        await expect(
          archive({
            packageName,
            gitCheckpoint: false
          })
        ).resolves.toBeUndefined();
      });
    });
  });

  describe("archive package with scope", () => {
    const fixtureMonorepoPath = path.join(
      __dirname,
      "../../../",
      "fixtures/monorepo-3"
    );
    const fixtureMonorepoGraveyardPath = path.join(
      fixtureMonorepoPath,
      defaultGraveyardRelativeFolder
    );
    folderSet.add(fixtureMonorepoPath);
    folderSet.add(fixtureMonorepoGraveyardPath);
    beforeEach(() => {
      jest.spyOn(process, "cwd").mockReturnValue(fixtureMonorepoPath);
    });
    afterEach(() => {
      jest.resetAllMocks();
    });

    it("should work with scoped package @my-company/my-app", async () => {
      const packageName = "@my-company/my-app";
      await expect(
        archive({
          packageName,
          gitCheckpoint: false
        })
      ).resolves.toBeUndefined();
    });
  });

  describe("archive package with dependent", () => {
    const fixtureMonorepoPath = path.join(
      __dirname,
      "../../../",
      "fixtures/monorepo-5"
    );
    const fixtureMonorepoGraveyardPath = path.join(
      fixtureMonorepoPath,
      defaultGraveyardRelativeFolder
    );
    folderSet.add(fixtureMonorepoPath);
    folderSet.add(fixtureMonorepoGraveyardPath);
    beforeEach(() => {
      jest.spyOn(process, "cwd").mockReturnValue(fixtureMonorepoPath);
    });
    afterEach(() => {
      jest.resetAllMocks();
    });

    it("should not work with package has dependent", async () => {
      const packageName = "@my-company/my-lib";
      await expect(
        archive({
          packageName,
          gitCheckpoint: false
        })
      ).rejects.toThrowErrorMatchingSnapshot();
    });
  });
});
