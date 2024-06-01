import { MUDJsonRpcProvider } from 'engine/executors/providers';

export function sleepIf() {
  const urlParams = new URLSearchParams(window.location.search);
  const mode = urlParams.get('mode') || import.meta.env.MODE;
  if (mode && (mode == 'staging' || mode == 'production')) {
    console.log('sleeping');
    return new Promise((resolve) => setTimeout(resolve, 4000));
  }
}

// temporary function to enable switch anvil modes for sending many transactions at one go
// will not be needed when world.ts migrates to solidity
export function setAutoMine(provider: MUDJsonRpcProvider, on: boolean) {
  if (import.meta.env.MODE == 'development' || import.meta.env.MODE == undefined) {
    provider.send(`${on ? 'evm_setAutomine' : 'evm_setIntervalMining'}`, [on ? true : 1]);
  }
}

export function setTimestamp(provider: MUDJsonRpcProvider) {
  if (import.meta.env.MODE == 'development' || import.meta.env.MODE == undefined) {
    const timestamp = Math.floor(new Date().getTime() / 1000);
    provider.send('evm_setNextBlockTimestamp', [timestamp]);
  }
}
