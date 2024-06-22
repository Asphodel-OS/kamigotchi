import { Formatter, JsonRpcProvider, Log } from '@ethersproject/providers';
import { callWithRetry, range, sleep } from '@mud-classic/utils';
import { BigNumber, Contract } from 'ethers';
import { resolveProperties } from 'ethers/lib/utils';

import { Contracts } from 'engine/types';
import { ContractEvent, ContractsConfig } from 'workers/types';
import { ContractTopics } from './topics';

/**
 * Fetch events from block range, ordered by block, transaction index and log index
 *
 * @param provider ethers JsonRpcProvider
 * @param topics Topics to fetch events for
 * @param startBlockNumber Start of block range to fetch events from (inclusive)
 * @param endBlockNumber End of block range to fetch events from (inclusive)
 * @param contracts Contracts to fetch events from
 * @param supportsBatchQueries Set to true if the provider supports batch queries (recommended)
 * @returns Promise resolving with an array of ContractEvents
 */
export async function fetchEventsInBlockRange<C extends Contracts>(
  provider: JsonRpcProvider,
  topics: ContractTopics[],
  startBlockNumber: number,
  endBlockNumber: number,
  contracts: ContractsConfig<C>,
  supportsBatchQueries?: boolean
): Promise<Array<ContractEvent<C>>> {
  const logs: Array<Log> = await fetchLogs(
    provider,
    topics,
    startBlockNumber,
    endBlockNumber,
    contracts,
    supportsBatchQueries ? endBlockNumber : undefined
  );
  // console.log(`[Network] fetched ${logs.length} events from ${startBlockNumber} -> ${endBlockNumber}`);
  // console.log(`got ${logs.length} logs from range ${startBlockNumber} -> ${endBlockNumber}`);
  // we need to sort per block, transaction index, and log index
  logs.sort((a: Log, b: Log) => {
    if (a.blockNumber < b.blockNumber) {
      return -1;
    } else if (a.blockNumber > b.blockNumber) {
      return 1;
    } else {
      if (a.transactionIndex < b.transactionIndex) {
        return -1;
      } else if (a.transactionIndex > b.transactionIndex) {
        return 1;
      } else {
        return a.logIndex < b.logIndex ? -1 : 1;
      }
    }
  });

  // construct an object: address => keyof C
  const addressToContractKey: { [key in string]: keyof C } = {};
  for (const [key, contract] of Object.entries(contracts)) {
    addressToContractKey[contract.address.toLowerCase()] = key;
  }

  // parse the logs to get the logs description, then turn them into contract events
  const contractEvents: Array<ContractEvent<C>> = [];

  for (let i = 0; i < logs.length; i++) {
    const log = logs[i]!;
    const contractKey = addressToContractKey[log.address.toLowerCase()];
    if (!contractKey) {
      throw new Error(
        "This should not happen. An event's address is not part of the contracts dictionnary: " +
          log.address
      );
    }

    const { address, abi } = contracts[contractKey];
    const contract = new Contract(address, abi);
    try {
      const logDescription = contract.interface.parseLog(log);

      // Set a flag if this is the last event in this transaction
      const lastEventInTx = logs[i + 1]?.transactionHash !== log.transactionHash;

      contractEvents.push({
        contractKey,
        eventKey: logDescription.name,
        args: logDescription.args,
        txHash: log.transactionHash,
        lastEventInTx,
      });
    } catch (e) {
      console.warn('Error', e);
      console.warn("A log couldn't be parsed with the corresponding contract interface!");
    }
  }

  return contractEvents;
}

/**
 * Fetch logs with the given topics from a given block range.
 *
 * @param provider ethers JsonRpcProvider
 * @param topics Topics to fetch logs for
 * @param startBlockNumber Start of block range to fetch logs from (inclusive)
 * @param endBlockNumber End of block range to fetch logs from (inclusive)
 * @param contracts Contracts to fetch logs from
 * @param requireMinimumBlockNumber Minimal block number required to fetch blocks
 * @returns Promise resolving with an array of logs from the specified block range and topics
 */
export async function fetchLogs<C extends Contracts>(
  provider: JsonRpcProvider,
  topics: ContractTopics[],
  startBlockNumber: number,
  endBlockNumber: number,
  contracts: ContractsConfig<C>,
  requireMinimumBlockNumber?: number
): Promise<Array<Log>> {
  const getLogPromise = async (
    contractAddress: string,
    topics: string[][]
  ): Promise<Array<Log>> => {
    const params = await resolveProperties({
      filter: provider._getFilter({
        fromBlock: startBlockNumber, // inclusive
        toBlock: endBlockNumber, // inclusive
        address: contractAddress,
        topics: topics,
      }),
    });
    const logs: Array<Log> = await provider.perform('getLogs', params);
    logs.forEach((log) => {
      if (log.removed == null) {
        log.removed = false;
      }
    });
    return Formatter.arrayOf(provider.formatter.filterLog.bind(provider.formatter))(logs);
  };

  const blockPromise = async () => {
    const _blockNumber = await provider.perform('getBlockNumber', {});
    const blockNumber = BigNumber.from(_blockNumber).toNumber();
    return blockNumber;
  };

  const getLogPromises = () => {
    const logPromises: Array<Promise<Array<Log>>> = [];
    for (const [k, c] of Object.entries(contracts)) {
      const topicsForContract = topics.find((t) => t.key === k)?.topics;
      if (topicsForContract) {
        logPromises.push(getLogPromise(c.address, topicsForContract));
      }
    }
    return logPromises;
  };

  if (requireMinimumBlockNumber) {
    for (const _ in range(10)) {
      const call = () => Promise.all([blockPromise(), ...getLogPromises()]);
      const [blockNumber, logs] = await callWithRetry<[number, ...Array<Array<Log>>]>(
        call,
        [],
        10,
        1000
      );
      if (blockNumber < requireMinimumBlockNumber) {
        await sleep(500);
      } else {
        return (logs ?? []).flat();
      }
    }
    throw new Error('Could not fetch logs with a required minimum block number');
  } else {
    const call = () => Promise.all([...getLogPromises()]);
    const logs = await callWithRetry<Array<Array<Log>>>(call, [], 10, 1000);
    return logs.flat();
  }
}
