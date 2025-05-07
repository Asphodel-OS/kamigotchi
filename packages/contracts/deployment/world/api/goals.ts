import { GenerateCallData } from './types';

export function goalsAPI(generateCallData: GenerateCallData, compiledCalls: string[]) {
  async function create(
    goalIndex: number,
    name: string,
    description: string,
    roomIndex: number,
    type: string,
    logic: string,
    conIndex: number,
    conValue: number
  ) {
    const callData = generateCallData(
      'system.goal.registry',
      [goalIndex, name, description, roomIndex, type, logic, conIndex, conValue],
      'create',
      ['uint32', 'string', 'string', 'uint32', 'string', 'string', 'uint32', 'uint256']
    );
    compiledCalls.push(callData);
  }

  async function enable(goalIndex: number) {
    const callData = generateCallData('system.goal.registry', [goalIndex, false], 'setDisabled');
    compiledCalls.push(callData);
  }

  async function createRequirement(
    goalIndex: number,
    type: string,
    logic: string,
    conIndex: number,
    conValue: number,
    conFor: string
  ) {
    const callData = generateCallData(
      'system.goal.registry',
      [goalIndex, type, logic, conIndex, conValue, conFor],
      'addRequirement',
      ['uint32', 'string', 'string', 'uint32', 'uint256', 'string']
    );
    compiledCalls.push(callData);
  }

  async function createRewardBasic(
    goalIndex: number,
    name: string,
    cutoff: number,
    type: string,
    conIndex: number,
    conValue: number
  ) {
    const callData = generateCallData(
      'system.goal.registry',
      [goalIndex, name, cutoff, type, conIndex, conValue],
      'addRewardBasic',
      ['uint32', 'string', 'uint256', 'string', 'uint32', 'uint256']
    );
    compiledCalls.push(callData);
  }

  async function createRewardDisplay(goalIndex: number, name: string) {
    const callData = generateCallData(
      'system.goal.registry',
      [goalIndex, name],
      'addRewardDisplay',
      ['uint32', 'string']
    );
    compiledCalls.push(callData);
  }

  async function createRewardDT(
    goalIndex: number,
    keys: number[],
    weights: number[],
    conValue: number
  ) {
    const callData = generateCallData(
      'system.goal.registry',
      [goalIndex, keys, weights, conValue],
      'addRewardDT',
      ['uint32', 'uint32[]', 'uint256[]', 'uint256']
    );
    compiledCalls.push(callData);
  }

  async function createRewardStat(
    goalIndex: number,
    statType: string,
    base: number,
    shift: number,
    boost: number,
    sync: number
  ) {
    const callData = generateCallData(
      'system.goal.registry',
      [goalIndex, statType, base, shift, boost, sync],
      'addRewardStat',
      ['uint32', 'string', 'int32', 'int32', 'int32', 'int32']
    );
    compiledCalls.push(callData);
  }

  async function remove(goalIndex: number) {
    const callData = generateCallData('system.goal.registry', [goalIndex], 'remove');
    compiledCalls.push(callData);
  }

  return {
    create: create,
    add: {
      requirement: createRequirement,
      reward: {
        basic: createRewardBasic,
        display: createRewardDisplay,
        droptable: createRewardDT,
        stat: createRewardStat,
      },
    },
    delete: remove,
    enable: enable,
  };
}
