import { SystemQueue } from 'engine/queue';
import { BigNumberish } from 'ethers';

export const newbieVendorAPI = (systems: SystemQueue<any>) => {
  async function calcPrice() {
    return systems['system.newbievendor.buy'].calcPrice();
  }

  function buy(kamiIndex: number, price: BigNumberish) {
    return systems['system.newbievendor.buy'].executeTyped(kamiIndex, { value: price });
  }

  return {
    calcPrice,
    buy,
  };
};
