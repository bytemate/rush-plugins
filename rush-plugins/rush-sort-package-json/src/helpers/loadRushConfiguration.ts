import { RushConfiguration } from "@rushstack/rush-sdk";

const cwd2RushConfiguration: Record<string, RushConfiguration> = {};

export const loadRushConfiguration = (
  cwd: string = process.cwd()
): RushConfiguration => {
  let rushConfiguration: RushConfiguration = cwd2RushConfiguration[cwd];
  if (!rushConfiguration) {
    try {
      rushConfiguration = RushConfiguration.loadFromDefaultLocation({
        startingFolder: cwd,
      });
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
