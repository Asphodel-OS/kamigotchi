import ejs from 'ejs';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { deploymentDir } from '../../utils/paths';

export async function generateInitWorld() {
  const callsPath = path.join(deploymentDir, 'contracts/initStream.json');
  const systemCalls = JSON.parse(await readFile(callsPath, { encoding: 'utf8' }));

  const InitWorld = await ejs.renderFile(
    path.join(deploymentDir, 'contracts/InitWorld.s.ejs'),
    systemCalls,
    {
      async: true,
    }
  );
  const initWorldPath = path.join(deploymentDir, 'contracts/InitWorld.s.sol');
  await writeFile(initWorldPath, InitWorld);
}

export async function clearInitWorld() {
  const InitWorld = await ejs.renderFile(
    path.join(deploymentDir, 'contracts/InitWorld.s.ejs'),
    { calls: [] },
    {
      async: true,
    }
  );
  const initWorldPath = path.join(deploymentDir, 'contracts/InitWorld.s.sol');
  await writeFile(initWorldPath, InitWorld);
}
