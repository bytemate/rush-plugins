import * as path from "path";
import { Executable } from "@rushstack/node-core-library";
import { archive } from "../archive";
import { graveyardRelativeFolder } from "../../logic/graveyard";

const fixtureMonorepoPath = path.join(
  __dirname,
  "../../../",
  "fixtures/monorepo-1"
);
const fixtureMonorepoGraveyardPath = path.join(
  fixtureMonorepoPath,
  graveyardRelativeFolder
);

const resumeFixtureMonorepo1 = () => {
  Executable.spawnSync("git", ["checkout", "."], {
    currentWorkingDirectory: fixtureMonorepoPath,
  });
  Executable.spawnSync("git", ["checkout", "."], {
    currentWorkingDirectory: fixtureMonorepoGraveyardPath,
  });
};

describe("archive", () => {
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
      })
    ).rejects.toThrow(`Could not find project with name ${packageName}`);
  });

  describe("fixture monorepo", () => {
    afterEach(() => {
      resumeFixtureMonorepo1();
    });

    it("should work with fixture demo", async () => {
      const packageName = "demo-project";
      await expect(
        archive({
          packageName,
        })
      ).resolves.toBeUndefined();
    });
  });
});
