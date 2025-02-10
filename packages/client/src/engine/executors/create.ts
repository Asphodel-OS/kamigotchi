import { Provider } from '@ethersproject/providers';
import {
  Component,
  EntityIndex,
  getComponentEntities,
  getComponentValue,
  Type,
  World,
} from '@mud-classic/recs';
import { keccak256, toEthAddress } from '@mud-classic/utils';
import { Contract, ContractInterface, Signer } from 'ethers';
import { observable, runInAction } from 'mobx';

import { createTxQueue } from 'engine/queue';
import { deferred } from 'utils/async';
import { Network } from './network';

/**
 * Create a system executor object.
 * The system executor object is an object indexed by available system ids (given in the interfaces object)
 * with {@link createTxQueue tx-queue enabled system contracts} as value.
 *
 * @param world Recs World object.
 * @param network Network ({@link createNetwork}).
 * @param systems Recs registry component containing the mapping from system address to system id.
 * @param interfaces Interfaces of the systems to create.
 * @param options
 * @returns Systems object to call system contracts.
 */
export function createSystemExecutor<T extends { [key: string]: Contract }>(
  world: World,
  network: Network,
  systems: Component<{ value: Type.String }>,
  interfaces: { [key in keyof T]: ContractInterface }
) {
  const systemContracts = observable.box({} as T);
  const systemIdPreimages: { [key: string]: string } = Object.keys(interfaces).reduce(
    (acc, curr) => {
      return { ...acc, [keccak256(curr)]: curr };
    },
    {}
  );

  // Util to add new systems to the systems tx queue
  function registerSystem(system: { id: string; contract: Contract }) {
    const [resolve, , promise] = deferred<void>();
    runInAction(() => {
      systemContracts.set({ ...systemContracts.get(), [system.id]: system.contract });
      systemIdPreimages[keccak256(system.id)] = system.id;
      resolve();
    });

    return promise;
  }

  // Util to create a system contract
  function createSystemContract<C extends Contract>(
    entity: EntityIndex,
    signerOrProvider?: Signer | Provider
  ): { id: string; contract: C } | undefined {
    const { value: hashedSystemId } = getComponentValue(systems, entity) || {};
    if (!hashedSystemId) throw new Error('System entity not found');
    const id = systemIdPreimages[hashedSystemId];
    if (!id) {
      console.debug('Unknown system:', hashedSystemId);
      return;
    }
    return {
      id,
      contract: new Contract(
        toEthAddress(world.entities[entity]!),
        interfaces[id]!,
        signerOrProvider
      ) as C,
    };
  }

  // Initialize systems
  const contracts = {} as T;
  for (const systemEntity of getComponentEntities(systems)) {
    const system = createSystemContract(systemEntity, network.signer.get());
    if (system) contracts[system.id as keyof T] = system.contract as T[keyof T];
  }
  runInAction(() => systemContracts.set(contracts));

  // Keep up to date
  systems.update$.subscribe((update) => {
    if (!update.value[0]) return;
    const system = createSystemContract(update.entity, network.signer.get());
    if (system) registerSystem(system);
  });

  const { txQueue, dispose } = createTxQueue<T>(systemContracts, network);
  world.registerDisposer(dispose);

  return {
    txQueue,
    registerSystem,
    getSystemContract: (id: string) => {
      const name = systemIdPreimages[id] as keyof T;
      return { name, contract: systemContracts.get()[name] };
    },
  };
}
