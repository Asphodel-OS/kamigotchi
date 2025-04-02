import { keccak256 as keccak256Bytes, toUtf8Bytes } from 'ethers/lib/utils';
import { readFileSync } from 'fs';
import path from 'path';
import { contractsDir, deployConfigPath } from './paths';

export const IDregex = new RegExp(/(?<=uint256 constant ID = uint256\(keccak256\(")(.*)(?="\))/);

export function extractIdFromFile(path: string): string | null {
  const content = readFileSync(path).toString();
  const regexResult = IDregex.exec(content);
  return regexResult && regexResult[0];
}

export function keccak256(data: string) {
  return keccak256Bytes(toUtf8Bytes(data));
}

export function getAllCompIDs(): string[] {
  const config = JSON.parse(readFileSync(deployConfigPath, { encoding: 'utf8' }));

  const components: any[] = config.components;
  const ids: string[] = [];
  components.map((comp) => {
    const id = extractIdFromFile(
      path.join(contractsDir, 'src/components', comp.comp + 'Component.sol')
    );
    if (id) ids.push(id);
  });

  return ids;
}

export function getAllSystemIDs(): string[] {
  const config = JSON.parse(readFileSync(deployConfigPath, { encoding: 'utf8' }));

  const systems: any[] = config.systems;
  const ids: string[] = [];
  systems.map((sys) => {
    const id = extractIdFromFile(path.join(contractsDir, 'src/systems', sys.name + '.sol'));
    if (id) ids.push(id);
  });

  return ids;
}
