import { BigNumberish } from 'ethers';

import { SystemBytecodes } from '../../contracts/mappings/SystemBytecodes';

// i have become what i hate most, woe is jiraheron
export type GenerateCallData = (
  systemID: keyof typeof SystemBytecodes,
  args: any[],
  func?: string,
  encodedTypes?: any,
  gasLimit?: BigNumberish
) => string;
