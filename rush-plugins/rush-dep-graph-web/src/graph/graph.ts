import cy from 'cytoscape';
import cytoscapeDagre from 'cytoscape-dagre';
import type {DagreLayoutOptions} from 'cytoscape-dagre';
import { edgeStyles, nodeStyles } from './style';
import { GraphRenderEvents, IGraph } from './types';

class CyGraph {
  private _traversalGraph: cy.Core;
  private _renderGraph?: cy.Core;
  private _containerId: string;

  public constructor(graph: IGraph, containerId: string) {
    this._containerId = containerId;
    cy.use(cytoscapeDagre);
    const nodes: cy.NodeDefinition[] = graph.nodes.map(node => ({
      data: node,
      group: 'nodes',
      selectable: false,
    }))
    const edges: cy.EdgeDefinition[] = graph.edges.map(edge => ({
      data: {
        id: `${edge.source}|${edge.target}`,
        ...edge
      },
      group: 'edges',
    }))
    this._traversalGraph = cy({
      headless: true,
      elements: {
        nodes,
        edges,
      },
      boxSelectionEnabled: false,
      style: [...nodeStyles, ...edgeStyles]
    })
  }


  public handleEvent(event: GraphRenderEvents): void {
    switch (event.type) {
      case 'notifyGraphInitGraph':
      default:
        this._showAllProjects();
        break;
    }
    if (this._renderGraph) {
      const elements: cy.Collection = this._renderGraph
        .elements()
        .sort(
          (a, b) =>  a.id().localeCompare(b.id())
        );
      const layoutOptions: DagreLayoutOptions = {
        name: 'dagre',
        fit: true,
        nodeDimensionsIncludeLabels: true,
        rankSep: 75,
        rankDir: 'TB',
        edgeSep: 50,
        ranker: 'network-simplex',
      }
      elements
        .layout(layoutOptions)
        .run();
    }
  }

  private _showAllProjects(): void {
    this._transferToRenderGraph(this._traversalGraph.elements());
  }

  private _transferToRenderGraph(elements: cy.Collection): void {
    if (this._renderGraph) {
      this._renderGraph.destroy();
      delete this._renderGraph;
    }
    const container: HTMLElement | null = document.getElementById(this._containerId);
    if (!container) {
      throw Error('Container not found');
    }

    this._renderGraph = cy({
      container,
      boxSelectionEnabled: false,
      style: [...nodeStyles, ...edgeStyles]
    })
    this._renderGraph.add(elements);
  }


  public destroy(): void {
    this._traversalGraph.destroy();
    this._renderGraph?.destroy();
  }

}

export default CyGraph;