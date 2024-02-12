export const numberToHex = (n: number) => {
  let hexNumber = n.toString(16);
  if (hexNumber.length % 2) hexNumber = '0' + hexNumber;
  return ('0x' + hexNumber) as number;
};
