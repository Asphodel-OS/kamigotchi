import { GenerateCallData } from './types';

export function nodesAPI(generateCallData: GenerateCallData, compiledCalls: string[]) {
  // @dev creates an emission node at the specified roomIndex
  // @param index       the human-readable index of the node
  // @param type        type of the node (e.g. HARVEST, HEAL, ARENA)
  // @param roomIndex    index of the room roomIndex
  // @param name        name of the node
  // @param description description of the node, exposed on the UI
  // @param affinity    affinity of the node [ NORMAL | EERIE | INSECT | SCRAP ]
  async function createNode(
    index: number,
    type: string,
    item: number,
    room: number,
    name: string,
    description: string,
    affinity: string
  ) {
    const callData = generateCallData(
      'system.node.registry',
      [index, type, item, room, name, description, affinity],
      'create',
      ['uint32', 'string', 'uint32', 'uint32', 'string', 'string', 'string']
    );
    compiledCalls.push(callData);
  }

  // @dev deletes node
  async function deleteNode(index: number) {
    const callData = generateCallData('system.node.registry', [index], 'remove');
    compiledCalls.push(callData);
  }

  async function addRequirement(
    nodeIndex: number,
    type: string,
    logic: string,
    index_: number,
    value: number,
    for_: string
  ) {
    const callData = generateCallData(
      'system.node.registry',
      [nodeIndex, type, logic, index_, value, for_],
      'addRequirement',
      ['uint32', 'string', 'string', 'uint32', 'uint256', 'string']
    );
    compiledCalls.push(callData);
  }

  //////////////////
  // SCAVENGES

  async function addScavenge(nodeIndex: number, cost: number) {
    const callData = generateCallData('system.node.registry', [nodeIndex, cost], 'addScavenge');
    compiledCalls.push(callData);
  }

  async function removeScavenge(nodeIndex: number) {
    const callData = generateCallData('system.node.registry', [nodeIndex], 'removeScavenge');
    compiledCalls.push(callData);
  }

  async function addScavRewardBasic(nodeIndex: number, type: string, index: number, value: number) {
    const callData = generateCallData(
      'system.node.registry',
      [nodeIndex, type, index, value],
      'addScavRewardBasic',
      ['uint32', 'string', 'uint32', 'uint256']
    );
    compiledCalls.push(callData);
  }

  async function addScavRewardDT(
    nodeIndex: number,
    keys: number[],
    weights: number[],
    value: number
  ) {
    const callData = generateCallData(
      'system.node.registry',
      [nodeIndex, keys, weights, value],
      'addScavRewardDT',
      ['uint32', 'uint32[]', 'uint256[]', 'uint256']
    );
    compiledCalls.push(callData);
  }

  return {
    create: createNode,
    delete: deleteNode,
    requirement: {
      add: addRequirement,
    },
    scavenge: {
      add: addScavenge,
      remove: removeScavenge,
      reward: {
        addBasic: addScavRewardBasic,
        addDT: addScavRewardDT,
      },
    },
  };
}
