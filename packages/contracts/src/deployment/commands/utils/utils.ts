import { JsonRpcProvider } from '@ethersproject/providers';

export const getDeployerKey = (mode: string) => {
  if (mode === 'TEST') return process.env.TEST_DEPLOYER_PRIV;
  else return process.env.DEV_DEPLOYER_PRIV;
};

export const getRpc = (mode: string) => {
  if (mode === 'TEST') return process.env.TEST_RPC;
  else return process.env.DEV_RPC;
};

export const getWorld = (mode: string) => {
  if (mode === 'TEST') return process.env.TEST_WORLD;
  else return process.env.DEV_WORLD;
};

export const setAutoMine = async (mode: string, on: boolean) => {
  console.log(`** Setting automine to ${on} **`);
  if (mode === 'DEV') {
    const provider = new JsonRpcProvider(process.env.DEV_RPC!);
    await provider.send(`${on ? 'anvil_setAutomine' : 'evm_setIntervalMining'}`, [on ? true : 1]);
  }
};

export const setTimestamp = async (mode: string) => {
  if (mode === 'DEV') {
    const provider = new JsonRpcProvider(process.env.DEV_RPC!);
    const timestamp = Math.floor(new Date().getTime() / 1000);
    await provider.send('evm_setNextBlockTimestamp', [timestamp]);
  }
};

export const ignoreSolcErrors = [
  '--ignored-error-codes',
  '6321',
  '--ignored-error-codes',
  '5740',
  '--ignored-error-codes',
  '5667',
  '--ignored-error-codes',
  '2072',
  '--ignored-error-codes',
  '2018',
];
