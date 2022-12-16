import path from 'path';
import fs from 'fs';

import { version } from '../../executor/version';

describe('version parameter', () => {
  it('version should match current version in package.json', () => {
    const pkg = JSON.parse(
      fs
        .readFileSync(path.resolve(__dirname, '../../../package.json'), { encoding: 'utf-8' })
        .toString()
    );
    expect(version()).toStrictEqual(pkg.version);
  });
});
