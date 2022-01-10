import { RushConfiguration } from "@microsoft/rush-lib";
import { JsonFile, JsonObject } from "@rushstack/node-core-library";

const cwd2RushConfiguration: Record<string, RushConfiguration> = {};

export const loadRushConfiguration = (
  cwd: string = process.cwd()
): RushConfiguration => {
  let rushConfiguration: RushConfiguration = cwd2RushConfiguration[cwd];
  if (!rushConfiguration) {
    try {
      const rushJsonFilePath: string | undefined =
        RushConfiguration.tryFindRushJsonLocation({
          startingFolder: cwd,
        });
      if (!rushJsonFilePath) {
        throw new Error(`Not found rush.json`);
      }
      const rushJson: JsonObject = JsonFile.load(rushJsonFilePath);
      // HACK!!! await merge this PR https://github.com/microsoft/rushstack/pull/3091
      rushConfiguration = new (RushConfiguration as any)(
        rushJson,
        rushJsonFilePath
      );
      if (!rushConfiguration) {
        throw new Error("Rush configuration not found");
      }
      cwd2RushConfiguration[cwd] = rushConfiguration;
    } catch (e) {
      throw new Error("Load rush configuration failed");
    }
  }
  return rushConfiguration;
};
