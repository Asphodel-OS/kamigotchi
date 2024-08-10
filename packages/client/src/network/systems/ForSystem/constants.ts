import { utils } from 'ethers';

export const forIDs = [
  { type: 'ACCOUNT', id: utils.solidityKeccak256(['string'], ['component.is.account']) },
  { type: 'KAMI', id: utils.solidityKeccak256(['string'], ['component.is.pet']) },
];
