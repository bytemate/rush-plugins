import { RushConfiguration } from "@microsoft/rush-lib"

const cwd2rushConfiguration: Record<string, RushConfiguration> = {};

export const loadRushConfiguration = (cwd: string = process.cwd()): RushConfiguration => {
  let rushConfiguration: RushConfiguration | undefined = cwd2rushConfiguration[cwd];
  if (!rushConfiguration) {
    try {
      rushConfiguration = RushConfiguration.loadFromDefaultLocation({
        startingFolder: cwd,
      });
    } catch {
      // no-catch
    }
    if (!rushConfiguration) {
      throw new Error("Could not load rush configuration");
    }
    cwd2rushConfiguration[cwd] = rushConfiguration;
  }
  return rushConfiguration;
}