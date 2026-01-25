import type { generateCallData } from './utils';

export function sacrificeAPI(
  gen: typeof generateCallData,
  compiledCalls: string[]
) {
  async function setNormalDroptable(keys: number[], weights: number[]) {
    const callData = gen(
      'system.sacrifice.registry',
      [keys, weights],
      'setNormalDroptable',
      ['uint32[]', 'uint256[]'],
      '2000000'
    );
    compiledCalls.push(callData);
  }

  async function setUncommonPityDroptable(keys: number[], weights: number[]) {
    const callData = gen(
      'system.sacrifice.registry',
      [keys, weights],
      'setUncommonPityDroptable',
      ['uint32[]', 'uint256[]'],
      '2000000'
    );
    compiledCalls.push(callData);
  }

  async function setRarePityDroptable(keys: number[], weights: number[]) {
    const callData = gen(
      'system.sacrifice.registry',
      [keys, weights],
      'setRarePityDroptable',
      ['uint32[]', 'uint256[]'],
      '2000000'
    );
    compiledCalls.push(callData);
  }

  async function setAllDroptables(
    normalKeys: number[],
    normalWeights: number[],
    uncommonKeys: number[],
    uncommonWeights: number[],
    rareKeys: number[],
    rareWeights: number[]
  ) {
    const callData = gen(
      'system.sacrifice.registry',
      [normalKeys, normalWeights, uncommonKeys, uncommonWeights, rareKeys, rareWeights],
      'setAllDroptables',
      ['uint32[]', 'uint256[]', 'uint32[]', 'uint256[]', 'uint32[]', 'uint256[]'],
      '4000000'
    );
    compiledCalls.push(callData);
  }

  return {
    droptable: {
      setNormal: setNormalDroptable,
      setUncommonPity: setUncommonPityDroptable,
      setRarePity: setRarePityDroptable,
      setAll: setAllDroptables,
    },
  };
}
