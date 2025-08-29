import { GenerateCallData } from './types';

export function portalAPI(generateCallData: GenerateCallData, compiledCalls: string[]) {
  // create a new auction
  async function setItem(index: number, tokenAddr: string, scale: number) {
    const callData = generateCallData(
      'system.erc20.portal',
      [index, tokenAddr, scale],
      'setItem',
      undefined,
      '800000'
    );
    compiledCalls.push(callData);
  }

  async function unsetItem(index: number) {
    const callData = generateCallData(
      'system.erc20.portal',
      [index],
      'unsetItem',
      undefined,
      '800000'
    );
    compiledCalls.push(callData);
  }

  // a override for erc20s that are deployed locally. only for local deployments
  async function localSetItem(index: number) {
    const callData = generateCallData(
      'system.erc20.portal',
      [index, `INJECT: LibItem.getTokenAddr(components, ${index})`],
      'addItem',
      undefined,
      '800000'
    );
    compiledCalls.push(callData);
  }

  return {
    token: {
      set: setItem,
      unset: unsetItem,
      localAdd: localSetItem,
    },
  };
}
