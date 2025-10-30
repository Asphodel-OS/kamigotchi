import { GenerateCallData } from './types';

export function portalAPI(generateCallData: GenerateCallData, compiledCalls: string[]) {
  // initialize the portal items from the item registry
  // NOTE: this should only really be called when the TokenPortalSystem is redeployed
  async function initItems(index: number) {
    const callData = generateCallData(
      'system.erc20.portal',
      [index],
      'initItem',
      undefined,
      '800000'
    );
    compiledCalls.push(callData);
  }

  // register an existing item on the portal, with a token address and conversion scale
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
      [index, `INJECT: LibItem.getTokenAddr(components, ${index})`, 2],
      'setItem',
      undefined,
      '800000'
    );
    compiledCalls.push(callData);
  }

  return {
    token: {
      init: initItems,
      set: setItem,
      unset: unsetItem,
      setLocal: localSetItem,
    },
  };
}
