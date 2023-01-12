import json2md from 'json2md';
import { IProjectCheckpointMetadata } from './projectMetadata';

// Generate a md file with the corresponding json content for archived projects
export const convertProjectMetadataToMD = (archivedProjectMetadataObject: { [key in string]: IProjectCheckpointMetadata }): string => {
// Try saving a md file of this json file
    const mdFileContents: any = [
      { h2: "Archived Projects" }
    ];
    const tableRows: any = []
    for (const [projectName, projectMetadata] of Object.entries(archivedProjectMetadataObject)) {
      tableRows.push([
        projectName,
        projectMetadata.checkpointBranch,
        projectMetadata.description,
        projectMetadata.archivedOn
      ])
    }
    mdFileContents.push({
      table: {
        headers: ["Project Name", "Checkpoint Branch", "Description", "Archive Date"],
        rows: tableRows
      }
    })
    return json2md(mdFileContents);
}