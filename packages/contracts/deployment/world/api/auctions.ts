import { GenCall } from '.';

export function auctionAPI(genCall: GenCall) {
  // create a new auction
  async function create(
    itemIndex: number,
    payItemIndex: number,
    priceTarget: number,
    period: number,
    decay: number,
    rate: number,
    max: number,
    startTs: number
  ) {
    genCall(
      'system.auction.registry',
      [itemIndex, payItemIndex, priceTarget, period, decay, rate, max, startTs],
      'create'
    );
  }

  // remove an existing auction
  async function remove(itemIndex: number) {
    genCall('system.auction.registry', [itemIndex], 'remove');
  }

  // add a requirement for an auction
  async function addRequirement(
    itemIndex: number,
    type: string,
    logic: string,
    index: number,
    value: number,
    for_: string
  ) {
    genCall(
      'system.auction.registry',
      [itemIndex, type, logic, index, value, for_],
      'addRequirement'
    );
  }

  return {
    create,
    remove,
    set: {
      requirement: addRequirement,
    },
  };
}
