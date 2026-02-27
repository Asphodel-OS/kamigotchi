import { BigNumberish } from 'ethers';
import { parseEther } from 'viem';

import { approveERC20, presaleDeposit, setApprovalForAllERC721 } from 'network/chain';

export function externalAPI(callQueue: any) {
  // parses to ether (1e18) for convienience
  function send(address: string, amount: BigNumberish) {
    return callQueue({
      to: address,
      value: parseEther(amount.toString()),
    });
  }

  // approves full spend
  function ERC20Approve(token: string, spender: string, amount: number | bigint) {
    const wei = typeof amount === 'bigint' ? amount : parseEther(amount.toString());
    return approveERC20(callQueue, token, spender, wei);
  }

  // deposits to presale
  function presaleBuy(presaleAddr: string, amount: number) {
    return presaleDeposit(callQueue, presaleAddr, parseEther(amount.toString()));
  }

  // approves operator for all ERC721 transfers
  function ERC721SetApprovalForAll(token: string, operator: string, approved: boolean) {
    return setApprovalForAllERC721(callQueue, token, operator, approved);
  }

  return {
    send,
    erc20: {
      approve: ERC20Approve,
    },
    erc721: {
      setApprovalForAll: ERC721SetApprovalForAll,
    },
    presale: {
      buy: presaleBuy,
    },
  };
}
