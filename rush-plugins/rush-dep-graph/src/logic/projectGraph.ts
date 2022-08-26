import { RushConfiguration } from '@rushstack/rush-sdk';
import { loadRushConfiguration } from 'rush-plugin-utils';
import type { IGraph, NodeKey } from 'rush-dep-graph-web/src/graph/types';


export function createWorkspacesProjectGraph(): IGraph {
  const rushConfiguration: RushConfiguration = loadRushConfiguration();
  const graph: IGraph = {
    nodes: [],
    edges: []
  };
  // nodes
  rushConfiguration.projects.forEach(({packageJsonEditor: p}) => {
    const id: NodeKey = `${p.name}@${p.version}`;
    graph.nodes.push(
      {
        id,
        name: p.name,
        version: p.version,
        isProject: true,
      }
    )
  })
  // edges
  rushConfiguration.projects.forEach(p => {
    const source: NodeKey = `${p.packageJsonEditor.name}@${p.packageJsonEditor.version}`;
    p.dependencyProjects.forEach((dep) => {
      const target: NodeKey = `${dep.packageJsonEditor.name}@${dep.packageJsonEditor.version}`;
      graph.edges.push({
        source,
        target,
      })
    })
  })

  return graph;
}

createWorkspacesProjectGraph();