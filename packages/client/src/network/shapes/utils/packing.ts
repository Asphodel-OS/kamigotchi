import { BigNumber } from 'ethers';

// unpack a uint32[8] array from a config uint256
export const unpackArray32 = (packed: BigNumber | number): number[] => {
  packed = BigNumber.from(packed);
  const result = [];
  for (let i = 0; i < 8; i++) {
    // mask to current
    const curr = packed.and(BigNumber.from(1).shl(32).sub(1));
    // push to array
    result.push(curr.toNumber());
    // updated packed
    packed = packed.shr(32);
  }
  return result.reverse();
};
