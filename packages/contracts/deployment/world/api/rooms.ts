import { GenerateCallData } from './types';

export function roomAPI(generateCallData: GenerateCallData, compiledCalls: string[]) {
  // @dev creates a room with name, roomIndex and exits. cannot overwrite room at roomIndex
  async function createRoom(
    x: number,
    y: number,
    z: number,
    roomIndex: number,
    name: string,
    description: string,
    exits: number[]
  ) {
    const callData = generateCallData(
      'system.room.registry',
      [x, y, z, roomIndex, name, description, exits.length == 0 ? [] : exits],
      'create',
      ['int32', 'int32', 'int32', 'uint32', 'string', 'string', 'uint32[]']
    );
    compiledCalls.push(callData);
  }

  // creates a room gate
  async function createRoomGate(
    roomIndex: number,
    sourceIndex: number,
    conditionIndex: number,
    conditionValue: string | number,
    type: string,
    logicType: string,
    for_: string
  ) {
    const callData = generateCallData(
      'system.room.registry',
      [roomIndex, sourceIndex, conditionIndex, conditionValue, type, logicType, for_],
      'addGate',
      ['uint32', 'uint32', 'uint32', 'uint256', 'string', 'string', 'string']
    );
    compiledCalls.push(callData);
  }

  // delete a room (along with its gates)?
  async function deleteRoom(roomIndex: number) {
    const callData = generateCallData('system.room.registry', [roomIndex], 'remove');
    compiledCalls.push(callData);
  }

  // set the name and description of a room
  async function setRoomTexts(roomIndex: number, name: string, description: string) {
    const callData = generateCallData(
      'system.room.registry',
      [roomIndex, name, description],
      'setTexts',
      undefined,
      400000
    );
    compiledCalls.push(callData);
  }

  return {
    create: createRoom,
    setText: setRoomTexts,
    delete: deleteRoom,
    createGate: createRoomGate,
  };
}
