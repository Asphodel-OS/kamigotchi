import { GenCall } from '.';

export function goalsAPI(genCall: GenCall) {
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
    genCall(
      'system.goal.registry',
      [goalIndex, name, description, roomIndex, type, logic, conIndex, conValue],
      'create',
      ['uint32', 'string', 'string', 'uint32', 'string', 'string', 'uint32', 'uint256']
    );
  }

  async function enable(goalIndex: number) {
    genCall('system.goal.registry', [goalIndex, false], 'setDisabled');
  }

  async function createRequirement(
    goalIndex: number,
    type: string,
    logic: string,
    conIndex: number,
    conValue: number,
    conFor: string
  ) {
    genCall(
      'system.goal.registry',
      [goalIndex, type, logic, conIndex, conValue, conFor],
      'addRequirement',
      ['uint32', 'string', 'string', 'uint32', 'uint256', 'string']
    );
  }

  async function createRewardBasic(
    goalIndex: number,
    name: string,
    cutoff: number,
    type: string,
    conIndex: number,
    conValue: number
  ) {
    genCall(
      'system.goal.registry',
      [goalIndex, name, cutoff, type, conIndex, conValue],
      'addRewardBasic',
      ['uint32', 'string', 'uint256', 'string', 'uint32', 'uint256']
    );
  }

  async function createRewardDisplay(goalIndex: number, name: string) {
    genCall('system.goal.registry', [goalIndex, name], 'addRewardDisplay', ['uint32', 'string']);
  }

  async function createRewardDT(
    goalIndex: number,
    keys: number[],
    weights: number[],
    conValue: number
  ) {
    genCall('system.goal.registry', [goalIndex, keys, weights, conValue], 'addRewardDT', [
      'uint32',
      'uint32[]',
      'uint256[]',
      'uint256',
    ]);
  }

  async function createRewardStat(
    goalIndex: number,
    statType: string,
    base: number,
    shift: number,
    boost: number,
    sync: number
  ) {
    genCall(
      'system.goal.registry',
      [goalIndex, statType, base, shift, boost, sync],
      'addRewardStat',
      ['uint32', 'string', 'int32', 'int32', 'int32', 'int32']
    );
  }

  async function remove(goalIndex: number) {
    genCall('system.goal.registry', [goalIndex], 'remove');
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
