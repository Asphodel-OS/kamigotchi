import ejs from 'ejs';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { deployConfigPath, deploymentDir } from './paths';

export async function generateImports(out: string) {
  const config = JSON.parse(await readFile(deployConfigPath, { encoding: 'utf8' }));
  // component & system import script
  const Imports = await ejs.renderFile(path.join(deploymentDir, 'contracts/Imports.ejs'), config, {
    async: true,
  });
  const ImportsPath = path.join(out, 'Imports.sol');
  await writeFile(ImportsPath, Imports);
}
