import { SystemQueue } from 'engine/queue';

export function auctionsAPI(systems: SystemQueue<any>) {
  function buy(itemIndex: number, amt: number) {
    return systems['system.auction.buy'].executeTyped(itemIndex, amt);
  }
  return {
    buy,
  };
}
