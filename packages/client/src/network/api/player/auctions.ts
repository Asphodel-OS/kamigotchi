export function auctionsAPI(systems: any) {
  function buy(itemIndex: number, amt: number) {
    return systems['system.auction.buy'].executeTyped(itemIndex, amt);
  }
  return {
    buy,
  };
}
