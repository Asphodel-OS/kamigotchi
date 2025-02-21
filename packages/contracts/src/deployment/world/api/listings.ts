import { BigNumberish } from 'ethers';
import { GenCall } from '.';

export function listingAPI(genCall: GenCall) {
  // create a listing for an npc and item at a target value
  async function createListing(npcIndex: number, itemIndex: number, value: number) {
    genCall('system.listing.registry', [npcIndex, itemIndex, value], 'create', [
      'uint32',
      'uint32',
      'uint256',
    ]);
  }

  async function refreshListing(npcIndex: number, itemIndex: number, value: number) {
    genCall('system.listing.registry', [npcIndex, itemIndex, value], 'refresh');
  }

  // add a fixed buy price to a listing
  async function setListingBuyPriceFixed(npcIndex: number, itemIndex: number, currency: number) {
    genCall('system.listing.registry', [npcIndex, itemIndex, currency], 'setBuyFixed');
  }

  // add a GDA buy price to a listing
  async function setListingBuyPriceGDA(
    npcIndex: number,
    itemIndex: number,
    currency: number,
    scale: number,
    decay: number
  ) {
    genCall('system.listing.registry', [npcIndex, itemIndex, currency, scale, decay], 'setBuyGDA');
  }

  // add a fixed sell price to a listing
  async function setListingSellPriceFixed(npcIndex: number, itemIndex: number, currency: number) {
    genCall('system.listing.registry', [npcIndex, itemIndex, currency], 'setSellFixed');
  }

  // add a scaled sell price to a listing
  async function setListingSellPriceScaled(
    npcIndex: number,
    itemIndex: number,
    currency: number,
    scale: number
  ) {
    genCall('system.listing.registry', [npcIndex, itemIndex, currency, scale], 'setSellScaled');
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
    refresh: refreshListing,
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
