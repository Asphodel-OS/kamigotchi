import { BigNumberish } from 'ethers';
import { GenCall } from '.';

export function listingAPI(genCall: GenCall) {
  // create a listing for an npc and item at a target value
  async function createListing(
    npcIndex: number,
    itemIndex: number,
    currencyIndex: number,
    value: BigNumberish
  ) {
    genCall('system.listing.registry', [npcIndex, itemIndex, currencyIndex, value], 'create', [
      'uint32',
      'uint32',
      'uint32',
      'uint256',
    ]);
  }

  // add a fixed buy price to a listing
  async function setListingBuyPriceFixed(npcIndex: number, itemIndex: number) {
    genCall('system.listing.registry', [npcIndex, itemIndex], 'setBuyFixed');
  }

  // add a GDA buy price to a listing
  async function setListingBuyPriceGDA(
    npcIndex: number,
    itemIndex: number,
    period: number,
    decay: number,
    rate: number
  ) {
    genCall('system.listing.registry', [npcIndex, itemIndex, period, decay, rate], 'setBuyGDA');
  }

  // add a fixed sell price to a listing
  async function setListingSellPriceFixed(npcIndex: number, itemIndex: number) {
    genCall('system.listing.registry', [npcIndex, itemIndex], 'setSellFixed');
  }

  // add a scaled sell price to a listing
  async function setListingSellPriceScaled(npcIndex: number, itemIndex: number, scale: number) {
    genCall('system.listing.registry', [npcIndex, itemIndex, scale], 'setSellScaled');
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
    genCall(
      'system.listing.registry',
      [npcIndex, itemIndex, conditionType, logicType, index, value, for_],
      'addRequirement',
      ['uint32', 'uint32', 'string', 'string', 'uint32', 'uint256', 'string']
    );
  }

  async function removeListing(npcIndex: number, itemIndex: number) {
    genCall('system.listing.registry', [npcIndex, itemIndex], 'remove');
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
