import { IGraph } from 'rush-dep-graph-web/src/graph/types';
import { createWorkspacesProjectGraph } from './logic/projectGraph';
import { startServer } from './server';

async function run(): Promise<void> {
  const graphData: IGraph = createWorkspacesProjectGraph();
  await startServer(graphData);
}

run().catch(() => {})