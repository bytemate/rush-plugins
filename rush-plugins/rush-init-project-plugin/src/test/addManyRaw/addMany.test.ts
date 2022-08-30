import path from 'path';
import fs from 'fs';
import del from 'del';
import { preparePlop } from "../utils";

import type { NodePlopAPI } from "node-plop";

describe('addMany', () => {
  let plop: NodePlopAPI;
  const destination: string = path.resolve(__dirname, 'output');
  const baseFolder: string = path.resolve(__dirname, 'plop-templates');
  beforeEach(async () => {
    await del(destination);
    plop = preparePlop();
  });
  it('should add many files', async () => {
    const answer = {
      packageName: 'foo'
    }
    plop.setGenerator("testAddMany", {
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

    await plop.getGenerator("testAddMany").runActions(answer);

    const destFile: string = path.resolve(destination, 'pkg.json');
    expect(fs.existsSync(destFile)).toBe(true);
    let packageJson = {} as any;
    expect(() => {
      packageJson = JSON.parse(fs.readFileSync(destFile, 'utf-8'))
    }).not.toThrow();
    expect(packageJson.name).toBe('foo');
  });
});