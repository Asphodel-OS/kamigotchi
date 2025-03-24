import { BigNumberish } from 'ethers';
import { GenCall } from '.';

export function questsAPI(genCall: GenCall) {
  // @dev creates an empty quest
  // @param index       the human-readable index of the quest
  // @param name        name of the quest
  async function create(
    index: number,
    name: string,
    description: string,
    endText: string,
    repeatTime: number
  ) {
    genCall('system.quest.registry', [index, name, description, endText, repeatTime], 'create', [
      'uint32',
      'string',
      'string',
      'string',
      'uint256',
    ]);
  }

  // delete a quest along with its objectives, requirements and rewards
  async function remove(index: number) {
    genCall('system.quest.registry', [index], 'remove');
  }

  async function enable(index: number) {
    genCall('system.quest.registry', [index, false], 'setDisabled');
  }

  // creates a Objective for an existing Quest
  async function addObjective(
    questIndex: number,
    name: string,
    logicType: string,
    type: string,
    index: number,
    value: BigNumberish,
    for_: string
  ) {
    genCall(
      'system.quest.registry',
      [questIndex, name, logicType, type, index, value, for_],
      'addObjective',
      ['uint32', 'string', 'string', 'string', 'uint32', 'uint256', 'string']
    );
  }

  // creates a Requirement for an existing Quest
  async function addRequirement(
    questIndex: number,
    logicType: string,
    type: string,
    index: number,
    value: BigNumberish,
    for_: string
  ) {
    genCall(
      'system.quest.registry',
      [questIndex, logicType, type, index, value, for_],
      'addRequirement',
      ['uint32', 'string', 'string', 'uint32', 'uint256', 'string']
    );
  }

  // creates a Reward for an existing Quest
  async function addRewardBasic(
    questIndex: number,
    type: string,
    index: number,
    value: BigNumberish
  ) {
    genCall('system.quest.registry', [questIndex, type, index, value], 'addRewardBasic', [
      'uint32',
      'string',
      'uint32',
      'uint256',
    ]);
  }

  async function addRewardDT(
    questIndex: number,
    keys: number[],
    weights: number[],
    value: BigNumberish
  ) {
    genCall('system.quest.registry', [questIndex, keys, weights, value], 'addRewardDT', [
      'uint32',
      'uint32[]',
      'uint256[]',
      'uint256',
    ]);
  }

  async function addRewardStat(
    questIndex: number,
    statType: string,
    base: number,
    shift: number,
    boost: number,
    sync: number
  ) {
    genCall(
      'system.quest.registry',
      [questIndex, statType, base, shift, boost, sync],
      'addRewardStat',
      ['uint32', 'string', 'int32', 'int32', 'int32', 'int32']
    );
  }

  return {
    create: create,
    delete: remove,
    enable: enable,
    add: {
      objective: addObjective,
      requirement: addRequirement,
      reward: {
        basic: addRewardBasic,
        droptable: addRewardDT,
        stat: addRewardStat,
      },
    },
  };
}
