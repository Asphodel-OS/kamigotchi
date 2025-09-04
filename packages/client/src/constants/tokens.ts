import { Address } from 'viem';

const ETH_ADDRESS = '0xE1Ff7038eAAAF027031688E1535a055B2Bac2546' as Address;
const ONYX_ADDRESS = '0x4BaDFb501Ab304fF11217C44702bb9E9732E7CF4' as Address;

export const TOKENS = {
  ETH: {
    address: ETH_ADDRESS,
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
  },
  ONYX: {
    address: ONYX_ADDRESS,
    name: 'ONYX',
    symbol: 'ONYX',
    decimals: 18,
  },
};
