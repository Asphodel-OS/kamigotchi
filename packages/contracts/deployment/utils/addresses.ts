import { ethers, Provider } from 'ethers';

import { UintCompABI, WorldABI } from '../contracts/mappings/worldABIs';
import { getProvider } from './chain';

// object to store already comp/system addresses
export class WorldAddresses {
  worldAddr: string;
  compsAddr: string;
  systemsAddr: string;
  components: any; // component registry
  systems: any; // system registry
  provider: Provider;

  cache: Map<string, string> = new Map();

  constructor() {
    this.provider = getProvider();
    this.worldAddr = process.env.WORLD!;
    const world = new ethers.Contract(this.worldAddr, WorldABI, this.provider);
    this.components = world.components();
    this.systems = world.systems();
    this.compsAddr = this.components.address;
    this.systemsAddr = this.systems.address;
  }

  async init() {
    this.components = await this.components;
    this.systems = await this.systems;
  }

  async getCompAddr(strID: string) {
    return await this.getAddr(this.components, strID);
  }

  async getSysAddr(strID: string) {
    return await this.getAddr(this.systems, strID);
  }

  private async getAddr(registry: any, strID: string) {
    if (this.cache.has(strID)) return this.cache.get(strID);

    const id = ethers.solidityPackedKeccak256(['string'], [strID]);
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
  id: string
): Promise<string> => {
  const comp = new ethers.Contract(compsAddr, UintCompABI, provider);
  const values: bigint[] = await comp.getEntitiesWithValue(id);
  if (values.length === 0) return '0x0000000000000000000000000000000000000000';

  const padded = values[0].toString(16).padStart(40, '0');
  return ethers.getAddress(padded);
};

export const getSystemAddr = async (strID: string): Promise<string> => {
  const provider = getProvider();
  const world = new ethers.Contract(process.env.WORLD!, WorldABI, provider);
  const systemRegistry = await world.systems();

  const id = ethers.solidityPackedKeccak256(['string'], [strID]);
  return await getAddrByID(provider, systemRegistry, id);
};

export const getCompAddr = async (strID: string): Promise<string> => {
  const provider = getProvider();
  const world = new ethers.Contract(process.env.WORLD!, WorldABI, provider);
  const systemRegistry = await world.components();

  const id = ethers.solidityPackedKeccak256(['string'], [strID]);
  return await getAddrByID(provider, systemRegistry, id);
};
