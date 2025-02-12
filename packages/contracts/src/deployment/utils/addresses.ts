import { Provider } from '@ethersproject/providers';
import { BigNumberish, ethers } from 'ethers';

import { UintCompABI, WorldABI } from '../contracts/mappings/worldABIs';
import { getProvider, getWorld } from './config';

// object to store already comp/system addresses
export class WorldAddresses {
  worldAddr: string;
  components: any; // component registry
  systems: any; // system registry
  provider: Provider;

  cache: Map<string, string> = new Map();

  constructor(mode: string) {
    this.provider = getProvider(mode);
    this.worldAddr = getWorld(mode)!;
    const world = new ethers.Contract(this.worldAddr, WorldABI, this.provider);
    this.components = world.components();
    this.systems = world.systems();
  }

  async getCompAddr(strID: string) {
    return await this.getAddr(this.components, strID);
  }

  async getSysAddr(strID: string) {
    return await this.getAddr(this.systems, strID);
  }

  private async getAddr(registry: any, strID: string) {
    if (this.cache.has(strID)) return this.cache.get(strID);

    const id = ethers.utils.solidityKeccak256(['string'], [strID]);
    const addr = await getAddrByID(this.provider, registry, id);
    this.cache.set(strID, addr);
    return addr;
  }
}

///////////////
// GETTERS

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
