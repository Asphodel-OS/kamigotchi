// unpack a uint32[8] array from a config uint256
export const unpackArray32 = (packed: bigint | number): number[] => {
  packed = BigInt(packed);
  const result = [];
  for (let i = 0; i < 8; i++) {
    // mask to current
    const curr = packed & ((1n << 32n) - 1n);
    // push to array
    result.push(Number(curr));
    // updated packed
    packed = packed >> 32n;
  }
  return result.reverse();
};
