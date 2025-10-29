import { BigNumberish } from 'ethers';
import { GenerateCallData } from './types';

export function tradeAPI(generateCallData: GenerateCallData, compiledCalls: string[]) {
  // force cancel some trades
  async function cancelTrades(ids: BigNumberish[]) {
    const callData = generateCallData('system.trade.cancel', [ids], 'executeAdmin', ['uint256[]']);
    compiledCalls.push(callData);
  }

  // force complete some trades
  async function completeTrades(ids: BigNumberish[]) {
    const callData = generateCallData('system.trade.complete', [ids], 'executeAdmin', [
      'uint256[]',
    ]);
    compiledCalls.push(callData);
  }

  return {
    complete: completeTrades,
    cancel: cancelTrades,
  };
}
