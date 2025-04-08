import { JsonRpcProvider } from '@ethersproject/providers';

export const setAutoMine = async (on: boolean) => {
  if (process.env.NODE_ENV !== 'puter') return;
  console.log(`** Setting automine to ${on} **`);
  const provider = new JsonRpcProvider(process.env.RPC!);
  await provider.send(`${on ? 'anvil_setAutomine' : 'evm_setIntervalMining'}`, [on ? true : 1]);
};

export const setTimestamp = async (ts: number = Math.floor(Date.now() / 1000)) => {
  if (process.env.NODE_ENV !== 'puter') return;
  console.log(`** Setting timestamp to ${ts} **`);
  const provider = new JsonRpcProvider(process.env.RPC!);
  await provider.send('evm_setNextBlockTimestamp', [ts]);
};
