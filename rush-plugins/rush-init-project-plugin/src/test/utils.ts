import nodePlop, { NodePlopAPI } from "node-plop";
export const preparePlop = (plopfilePath: string = ''): NodePlopAPI => {
  const plop: NodePlopAPI = nodePlop(plopfilePath, {} as any);
  return plop
}