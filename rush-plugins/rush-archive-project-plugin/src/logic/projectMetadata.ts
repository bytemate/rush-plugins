import { JsonObject, JsonFile } from "@rushstack/node-core-library";
export class ProjectMetadata {
  private _projectConfig: JsonObject;
  public static FILENAME: string = "rush-project-metadata.json";

  public constructor(projectConfig: JsonObject) {
    this._projectConfig = projectConfig;
  }

  public static load(filePath: string): ProjectMetadata {
    const { projectConfig } = JsonFile.load(filePath);
    return new ProjectMetadata(projectConfig);
  }

  public save(filePath: string): void {
    JsonFile.save(
      {
        projectConfig: this._projectConfig,
      },
      filePath,
      {
        ensureFolderExists: true,
      }
    );
  }

  public get projectConfig(): JsonObject {
    return this._projectConfig;
  }
}

export interface IProjectCheckpointMetadata {
  checkpointBranch: string;
  archivedOn: string;
  description: string;
}