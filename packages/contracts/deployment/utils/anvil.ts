import { JsonRpcProvider } from '@ethersproject/providers';

export const setAutoMine = async (on: boolean) => {
  console.log(`** Setting automine to ${on} **`);
  const provider = new JsonRpcProvider(process.env.DEV_RPC!);
  await provider.send(`${on ? 'anvil_setAutomine' : 'evm_setIntervalMining'}`, [on ? true : 1]);
};

export const setTimestamp = async (ts: number = Math.floor(Date.now() / 1000)) => {
  console.warn(`** Setting timestamp to ${ts} **`);
  const provider = new JsonRpcProvider(process.env.DEV_RPC!);
  await provider.send('evm_setNextBlockTimestamp', [ts]);
};
