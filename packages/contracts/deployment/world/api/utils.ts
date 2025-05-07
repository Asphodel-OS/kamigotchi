import { BigNumberish } from 'ethers';

import { SystemBytecodes } from '../../contracts/mappings/SystemBytecodes';
import { createCall } from '../../scripts/systemCaller';

// @dev generates an entry in json for calling systems
// @param systemID system ID
// @param args arguments to pass to the system
// @param func optional, function name to call instead of executeTyped
// @param typed optional, if true, skip argument encoding
export function generateCallData(
  systemID: keyof typeof SystemBytecodes,
  args: any[],
  func?: string,
  encodedTypes?: any[],
  gasLimit?: BigNumberish
) {
  // if execute or has typed args, encode args
  const encode = func === undefined || encodedTypes !== undefined;
  const call = createCall(systemID, args, encode, encodedTypes);

  return `{
"system": "${call.system}",
"id": "${call.id}",
"func": "${func ? func : 'execute'}",
"args": "${call.args}"
${gasLimit ? `, "gas": "${gasLimit}"` : ''}
}`;
}
