import { RushConfiguration } from "@microsoft/rush-lib"

let rushConfiguration: RushConfiguration | undefined;

export const loadRushConfiguration = (): RushConfiguration => {
  if (!rushConfiguration) {
    try {
      rushConfiguration = RushConfiguration.loadFromDefaultLocation({
        startingFolder: process.cwd(),
      });
    } catch {
      // no-catch
    }
    if (!rushConfiguration) {
      throw new Error("Could not load rush configuration");
    }
  }
  return rushConfiguration;
}