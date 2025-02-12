import ejs from 'ejs';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { contractsDir } from './paths';

export async function generateInitWorld() {
  const callsPath = path.join(contractsDir, 'initStream.json');
  const systemCalls = JSON.parse(await readFile(callsPath, { encoding: 'utf8' }));

  const InitWorld = await ejs.renderFile(path.join(contractsDir, 'InitWorld.s.ejs'), systemCalls, {
    async: true,
  });
  const initWorldPath = path.join(contractsDir, 'InitWorld.s.sol');
  await writeFile(initWorldPath, InitWorld);
}

export async function clearInitWorld() {
  const InitWorld = await ejs.renderFile(
    path.join(contractsDir, 'InitWorld.s.ejs'),
    { calls: [] },
    {
      async: true,
    }
  );
  const initWorldPath = path.join(contractsDir, 'InitWorld.s.sol');
  await writeFile(initWorldPath, InitWorld);
}
