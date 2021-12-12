import * as path from "path";
import { PackageName, IParsedPackageName } from "@rushstack/node-core-library";

export const graveyardRelativeFolder: string = "common/_graveyard";

export interface IGraveyardInfo {
  tarballFolder: string;
  tarballRelativeFolder: string;
  tarballName: string;
}

export interface IGetGraveyardInfoParams {
  monoRoot: string;
  packageName: string;
}

export const getGraveyardInfo = ({
  monoRoot,
  packageName,
}: IGetGraveyardInfoParams): IGraveyardInfo => {
  const parsedPackageName: IParsedPackageName = PackageName.parse(packageName);
  const tarballRelativeFolder: string = path.join(
    graveyardRelativeFolder,
    parsedPackageName.scope
  );
  const tarballFolder: string = path.join(monoRoot, tarballRelativeFolder);
  return {
    tarballFolder,
    tarballRelativeFolder,
    tarballName: `${parsedPackageName.unscopedName}.tar.gz`,
  };
};
