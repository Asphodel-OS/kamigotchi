import { BigNumberish } from 'ethers';
import { GenerateCallData } from './types';

export function listingAPI(generateCallData: GenerateCallData, compiledCalls: string[]) {
  // create a listing for an npc and item at a target value
  async function createListing(
    npcIndex: number,
    itemIndex: number,
    currencyIndex: number,
    value: BigNumberish
  ) {
    const callData = generateCallData(
      'system.listing.registry',
      [npcIndex, itemIndex, currencyIndex, value],
      'create',
      ['uint32', 'uint32', 'uint32', 'uint256']
    );
    compiledCalls.push(callData);
  }

  // add a fixed buy price to a listing
  async function setListingBuyPriceFixed(npcIndex: number, itemIndex: number) {
    const callData = generateCallData(
      'system.listing.registry',
      [npcIndex, itemIndex],
      'setBuyFixed'
    );
    compiledCalls.push(callData);
  }

  // add a GDA buy price to a listing
  async function setListingBuyPriceGDA(
    npcIndex: number,
    itemIndex: number,
    period: number,
    decay: number,
    rate: number,
    reset?: boolean // whether to reset the tracking values (balance, timeStart)
  ) {
    const callData = generateCallData(
      'system.listing.registry',
      [npcIndex, itemIndex, period, decay, rate, reset],
      'setBuyGDA'
    );
    compiledCalls.push(callData);
  }

  // add a fixed sell price to a listing
  async function setListingSellPriceFixed(npcIndex: number, itemIndex: number) {
    const callData = generateCallData(
      'system.listing.registry',
      [npcIndex, itemIndex],
      'setSellFixed'
    );
    compiledCalls.push(callData);
  }

  // add a scaled sell price to a listing
  async function setListingSellPriceScaled(npcIndex: number, itemIndex: number, scale: number) {
    const callData = generateCallData(
      'system.listing.registry',
      [npcIndex, itemIndex, scale],
      'setSellScaled'
    );
    compiledCalls.push(callData);
  }

  async function setListingRequirement(
    npcIndex: number,
    itemIndex: number,
    conditionType: string,
    logicType: string,
    index: number,
    value: BigNumberish,
    for_: string
  ) {
    const callData = generateCallData(
      'system.listing.registry',
      [npcIndex, itemIndex, conditionType, logicType, index, value, for_],
      'addRequirement',
      ['uint32', 'uint32', 'string', 'string', 'uint32', 'uint256', 'string']
    );
    compiledCalls.push(callData);
  }

  async function removeListing(npcIndex: number, itemIndex: number) {
    const callData = generateCallData('system.listing.registry', [npcIndex, itemIndex], 'remove');
    compiledCalls.push(callData);
  }

  return {
    create: createListing,
    remove: removeListing,
    set: {
      price: {
        buy: {
          fixed: setListingBuyPriceFixed,
          gda: setListingBuyPriceGDA,
        },
        sell: {
          fixed: setListingSellPriceFixed,
          scaled: setListingSellPriceScaled,
        },
      },
      requirement: setListingRequirement,
    },
  };
}
