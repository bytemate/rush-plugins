export type PackageName = string;
export type Version = string;
export type NodeKey = `${PackageName}@${Version}`;
export interface INode {
    id: NodeKey,
    name: PackageName,
    version: Version,
    isProject: boolean,
}

// type export EdgeType = 'dependency' | 'devDependency';

export interface IEdge {
    // type: EdgeType,
    source: NodeKey,
    target: NodeKey,
}

export interface IGraph  {
  nodes: INode[],
  edges: IEdge[]
}

export type GraphRenderEvents =
  | {
      type: 'notifyGraphInitGraph';
    }