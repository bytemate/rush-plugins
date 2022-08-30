import path from 'path';
import fs from 'fs';
import del from 'del';
import { preparePlop } from "../utils";

import type { NodePlopAPI } from "node-plop";

describe('addManyCustomEngine', () => {
  let plop: NodePlopAPI;
  const baseFolder: string = path.resolve(__dirname, 'plop-templates');
  const destination: string = path.resolve(__dirname, 'output');
  const plopfilePath: string = path.resolve(__dirname, 'plopfile.js');
  beforeEach(async () => {
    await del(destination);
    plop = preparePlop(plopfilePath);
  });
  it('should add many files', async () => {
    const answer = {
      packageName: 'foo'
    }
    plop.setGenerator("testAddManyCustomEngine", {
      description: '',
      prompts: [],
      actions: [
        {
          type: "addMany",
          force: true,
          destination,
          base: baseFolder,
          templateFiles: [`**/*`, "!init.config.ts", "!init.config.js"],
          globOptions: {
            cwd: baseFolder,
            dot: true,
            absolute: true,
          },
          data: {},
        },
      ],
    });

    await plop.getGenerator("testAddManyCustomEngine").runActions(answer);

    const packageJsonFile: string = path.resolve(destination, 'pkg.json');
    expect(fs.existsSync(packageJsonFile)).toBe(true);
    let packageJson = {} as any;
    expect(() => {
      packageJson = JSON.parse(fs.readFileSync(packageJsonFile, 'utf-8'))
    }).not.toThrow();
    expect(packageJson.name).toBe('foo');

    const indexFile: string = path.resolve(destination, 'index');
    expect(fs.existsSync(indexFile)).toBe(true);
    expect(fs.readFileSync(indexFile, 'utf-8')).toMatchSnapshot();
  });
});