import { Provider } from '@ethersproject/providers';
import { BigNumberish, ethers } from 'ethers';

import { UintCompABI, WorldABI } from './abis';
import { getProvider, getWorld } from './config';

///////////////
// SOLECS

export const getAddrByID = async (
  provider: Provider,
  compsAddr: string,
  id: BigNumberish
): Promise<string> => {
  const comp = new ethers.Contract(compsAddr, UintCompABI, provider);
  const values = await comp.getEntitiesWithValue(id);
  return values.length > 0 ? values[0].toHexString() : '0x0000000000000000000000000000000000000000';
};

export const getSystemAddr = async (mode: string, strID: string): Promise<string> => {
  const provider = getProvider(mode);
  const world = new ethers.Contract(getWorld(mode)!, WorldABI, provider);
  const systemRegistry = await world.systems();

  const id = ethers.utils.solidityKeccak256(['string'], [strID]);
  return await getAddrByID(provider, systemRegistry, id);
};

export const getCompAddr = async (mode: string, strID: string): Promise<string> => {
  const provider = getProvider(mode);
  const world = new ethers.Contract(getWorld(mode)!, WorldABI, provider);
  const systemRegistry = await world.components();

  const id = ethers.utils.solidityKeccak256(['string'], [strID]);
  return await getAddrByID(provider, systemRegistry, id);
};
