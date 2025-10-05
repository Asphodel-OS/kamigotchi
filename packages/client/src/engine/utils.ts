import { callWithRetry, range, sleep } from '@mud-classic/utils';
import { EntityID } from 'engine/recs';
import { Block, JsonRpcProvider, keccak256 } from 'ethers';

import { Message } from './types/ecs-relay';

// Message payload to sign and use to recover signer
export function messagePayload(msg: Message) {
  return `(${msg.version},${msg.id},${keccak256(msg.data)},${msg.timestamp})`;
}

// Remove zero padding from all entity ids
// Q(jb): do we even want to do this?  standardization seems preferable
// ethers utils keccak256 function maintains zero padding
export function formatEntityID(entityID: string | EntityID | bigint): EntityID {
  if (typeof entityID === 'bigint') {
    return bigintToHex(entityID) as EntityID;
  } else if (typeof entityID === 'string' && entityID.substring(0, 2) === '0x') {
    // remove padded zeroes
    return bigintToHex(BigInt(entityID)) as EntityID;
  }
  return entityID as EntityID;
}

// Remove zero padding from all component ids
export function formatComponentID(componentID: string | bigint): string {
  return bigintToHex(BigInt(componentID)) as EntityID;
}

export function bigintToHex(bigint: BigInt): string {
  return '0x' + bigint.toString(16);
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
    const blockPromise = async () => await provider.getBlock('latest');

    const block = await callWithRetry<Block | null>(blockPromise, [], 10, 25);
    if (minBlockNumber && (block ? block.number : 0) < minBlockNumber) {
      await sleep(50);
      continue;
    } else {
      // console.log(`\tretrieved block ${block.number}`);
      // console.log(`\twith ${block.transactions.length} txs`);
      if (!block) throw new Error('Could not fetch a block with blockNumber ' + minBlockNumber);
      return block;
    }
  }
  throw new Error('Could not fetch a block with blockNumber ' + minBlockNumber);
}
