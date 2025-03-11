import { BigNumberish } from 'ethers';
import { approveERC20, presaleDeposit } from 'network/chain';
import { parseEther } from 'viem';

export function externalAPI(callQueue: any) {
  /////////////////
  // NON-MUD

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
