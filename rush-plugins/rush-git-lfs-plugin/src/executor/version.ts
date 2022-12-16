import path from 'path';
import fse from 'fs-extra';

export const version = (): string => {
  // eslint-disable-next-line @typescript-eslint/typedef
  const pkg = fse.readJSONSync(path.resolve(__dirname, '../../package.json'));
  return pkg.version;
};
