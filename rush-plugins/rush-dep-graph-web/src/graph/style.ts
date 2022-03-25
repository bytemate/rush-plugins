import type { Stylesheet } from 'cytoscape';

const FONTS: string = 'system-ui, "Helvetica Neue", sans-serif';

enum NrwlPalette {
  blue = 'hsla(214, 62%, 21%, 1)',
  green = 'hsla(162, 47%, 50%, 1)',
  lightBlue = 'hsla(192, 75%, 59%, 1)',
  gray = 'hsla(0, 0%, 92%, 1)',
  darkGray = 'hsla(0, 0%, 72%, 1)',
  black = 'hsla(220, 9%, 46%, 1)',
  red = 'hsla(347, 92%, 65%, 1)',
  white = '#fff',
}

const allNodes: Stylesheet = {
  selector: 'node',
  style: {
    shape: 'round-rectangle',
    'font-size': '22px',
    'font-family': FONTS,
    'border-style': 'solid',
    'border-color': NrwlPalette.darkGray,
    'border-width': '1px',
    'text-halign': 'center',
    'text-valign': 'center',
    'padding-left': '16px',
    'padding-right': '16px',
    color: NrwlPalette.black,
    label: 'data(name)',
    width: 'label',
    backgroundColor: NrwlPalette.white,
    'transition-property':
      'background-color, border-color, line-color, target-arrow-color',
    'transition-duration': 250,
    'transition-timing-function': 'ease-out',
  },
};


const focusedNodes: Stylesheet = {
  selector: 'node.focused',
  style: {
    color: NrwlPalette.white,
    'border-color': NrwlPalette.gray,
    backgroundColor: NrwlPalette.green,
  },
};

const affectedNodes: Stylesheet = {
  selector: 'node.affected',
  style: {
    color: NrwlPalette.white,
    'border-color': NrwlPalette.gray,
    backgroundColor: NrwlPalette.red,
  },
};

const parentNodes: Stylesheet = {
  selector: ':parent',
  style: {
    'background-opacity': 0.5,
    'background-color': NrwlPalette.gray,
    'border-color': NrwlPalette.darkGray,
    label: 'data(label)',
    'text-halign': 'center',
    'text-valign': 'top',
    'font-weight': 'bold',
    'font-size': '48px',
  },
};

const highlightedNodes: Stylesheet = {
  selector: 'node.highlight',
  style: {
    color: NrwlPalette.white,
    'border-color': NrwlPalette.gray,
    backgroundColor: NrwlPalette.blue,
  },
};

const transparentProjectNodes: Stylesheet = {
  selector: 'node.transparent:childless',
  style: { opacity: 0.5 },
};

const transparentParentNodes: Stylesheet = {
  selector: 'node.transparent:parent',
  style: {
    'text-opacity': 0.5,
    'background-opacity': 0.25,
    'border-opacity': 0.5,
  },
};

const highlightedEdges: Stylesheet = {
  selector: 'edge.highlight',
  style: { 'mid-target-arrow-color': NrwlPalette.blue },
};

const transparentEdges: Stylesheet = {
  selector: 'edge.transparent',
  style: { opacity: 0.2 },
};

const allEdges: Stylesheet = {
  selector: 'edge',
  style: {
    width: '1px',
    'line-color': NrwlPalette.black,
    'curve-style': 'unbundled-bezier',
    'target-arrow-shape': 'triangle',
    'target-arrow-fill': 'filled',
    'target-arrow-color': NrwlPalette.black,
  },
};

const affectedEdges: Stylesheet = {
  selector: 'edge.affected',
  style: {
    'line-color': NrwlPalette.red,
    'target-arrow-color': NrwlPalette.red,
    'curve-style': 'unbundled-bezier',
  },
};

const implicitEdges: Stylesheet = {
  selector: 'edge.implicit',
  style: {
    label: 'implicit',
    'font-size': '16px',
    'curve-style': 'unbundled-bezier',
  },
};

const dynamicEdges: Stylesheet = {
  selector: 'edge.dynamic',
  style: {
    'line-dash-pattern': [5, 5],
    'line-style': 'dashed',
    'curve-style': 'unbundled-bezier',
  },
};

export const edgeStyles: Stylesheet[] = [
  allEdges,
  affectedEdges,
  implicitEdges,
  dynamicEdges,
];

export const nodeStyles:Stylesheet[] = [
  allNodes,
  focusedNodes,
  affectedNodes,
  parentNodes,
  highlightedNodes,
  transparentProjectNodes,
  transparentParentNodes,
  highlightedEdges,
  transparentEdges,
];
