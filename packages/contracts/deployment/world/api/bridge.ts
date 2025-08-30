import { GenerateCallData } from './types';

export function bridgeAPI(generateCallData: GenerateCallData, compiledCalls: string[]) {
  // create a new auction
  async function addItem(index: number, tokenAddr: string) {
    const callData = generateCallData(
      'system.erc20.portal',
      [index, tokenAddr],
      'addItem',
      undefined,
      '800000'
    );
    compiledCalls.push(callData);
  }

  async function removeItem(index: number) {
    const callData = generateCallData(
      'system.erc20.portal',
      [index],
      'remove',
      undefined,
      '800000'
    );
    compiledCalls.push(callData);
  }

  // a override for erc20s that are deployed locally. only for local deployments
  async function localAddItem(index: number) {
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
      add: addItem,
      remove: removeItem,
      localAdd: localAddItem,
    },
  };
}
