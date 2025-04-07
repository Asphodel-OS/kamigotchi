import { Block, JsonRpcProvider } from '@ethersproject/providers';
import { EntityID } from '@mud-classic/recs';
import { callWithRetry, range, sleep } from '@mud-classic/utils';
import { BigNumber } from 'ethers';
import { keccak256 } from 'ethers/lib/utils';

import { Message } from './types/ecs-relay';

// Message payload to sign and use to recover signer
export function messagePayload(msg: Message) {
  return `(${msg.version},${msg.id},${keccak256(msg.data)},${msg.timestamp})`;
}

// Remove zero padding from all entity ids
// Q(jb): do we even want to do this?  standardization seems preferable
// ethers utils keccak256 function maintains zero padding
export function formatEntityID(entityID: string | EntityID | BigNumber): EntityID {
  if (BigNumber.isBigNumber(entityID) || entityID.substring(0, 2) === '0x') {
    return BigNumber.from(entityID).toHexString() as EntityID;
  }
  return entityID as EntityID;
}

// Remove zero padding from all component ids
export function formatComponentID(componentID: string | BigNumber): string {
  return BigNumber.from(componentID).toHexString();
}

/**
 * Fetch the latest Ethereum block
 *
 * @param provider ethers JsonRpcProvider
 * @param minBlockNumber Minimal required block number.
 * If the latest block number is below this number, the method waits for 1300ms and tries again, for at most 10 times.
 * @returns Promise resolving with the latest Ethereum block
 */
export async function fetchBlock(
  provider: JsonRpcProvider,
  minBlockNumber?: number
): Promise<Block> {
  // console.log(`fetching block (min ${minBlockNumber})`);
  for (const _ of range(10)) {
    const blockPromise = async () => {
      const rawBlock = await provider.perform('getBlock', {
        includeTransactions: false,
        blockTag: provider.formatter.blockTag(await provider._getBlockTag('latest')),
      });
      return provider.formatter.block(rawBlock);
    };

    const block = await callWithRetry<Block>(blockPromise, [], 10, 25);
    if (minBlockNumber && block.number < minBlockNumber) {
      await sleep(50);
      continue;
    } else {
      // console.log(`\tretrieved block ${block.number}`);
      // console.log(`\twith ${block.transactions.length} txs`);
      return block;
    }
  }
  throw new Error('Could not fetch a block with blockNumber ' + minBlockNumber);
}
