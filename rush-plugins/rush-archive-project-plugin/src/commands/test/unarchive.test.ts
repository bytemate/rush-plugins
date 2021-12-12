import * as path from "path";
import { Executable } from "@rushstack/node-core-library";
import { unarchive } from "../unarchive";
import { graveyardRelativeFolder } from "../../logic/graveyard";

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

describe("unarchive", () => {
  afterAll(() => {
    resume(Array.from(folderSet));
  });

  describe("unarchive basic", () => {
    const fixtureMonorepoPath = path.join(
      __dirname,
      "../../../",
      "fixtures/monorepo-2"
    );
    const fixtureMonorepoGraveyardPath = path.join(
      fixtureMonorepoPath,
      graveyardRelativeFolder
    );
    folderSet.add(fixtureMonorepoPath);
    folderSet.add(fixtureMonorepoGraveyardPath);

    beforeEach(() => {
      jest.spyOn(process, "cwd").mockReturnValue(fixtureMonorepoPath);
    });
    afterEach(() => {
      jest.resetAllMocks();
    });

    it("should not work with no existing package name", async () => {
      const packageName = "non-exist";
      await expect(
        unarchive({
          packageName,
        })
      ).rejects.toThrow(
        `Could not find tarball ${packageName}.tar.gz for package name ${packageName}`
      );
    });

    describe("fixture monorepo", () => {
      it("should work with fixture demo", async () => {
        const packageName = "demo-project";
        await expect(
          unarchive({
            packageName,
          })
        ).resolves.toBeUndefined();
      });
    });
  });

  describe("unarchive package with scope", () => {
    const fixtureMonorepoPath = path.join(
      __dirname,
      "../../../",
      "fixtures/monorepo-4"
    );
    const fixtureMonorepoGraveyardPath = path.join(
      fixtureMonorepoPath,
      graveyardRelativeFolder
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
        unarchive({
          packageName,
        })
      ).resolves.toBeUndefined();
    });
  });
});
