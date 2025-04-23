import { BigNumberish } from 'ethers';
import { parseEther } from 'viem';

import { approveERC20, presaleDeposit } from 'network/chain';

export function externalAPI(callQueue: any) {
  // parses to ether (1e18) for convienience
  function send(address: string, amount: BigNumberish) {
    return callQueue({
      to: address,
      value: parseEther(amount.toString()),
    });
  }

  // approves full spend
  function ERC20Approve(token: string, spender: string, amount: number) {
    return approveERC20(callQueue, token, spender, parseEther(amount.toString()));
  }

  // deposits to presale
  function presaleBuy(presaleAddr: string, amount: number) {
    return presaleDeposit(callQueue, presaleAddr, parseEther(amount.toString()));
  }

  return {
    send,
    erc20: {
      approve: ERC20Approve,
    },
    presale: {
      buy: presaleBuy,
    },
  };
}
