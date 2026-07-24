const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
import dotenv from 'dotenv';
import execa from 'execa';
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

import { ignoreSolcErrors, setAutoMine } from '../utils';

const argv = yargs(hideBin(process.argv)).usage('Usage: $0 -world <address>').parse();

// PoolCeremony broadcasts from the treasury key, which is not fee-exempt at
// the sequencer: txs must be legacy-typed at the chain's min gas price (the
// god runner's zero-price flags get rejected with "insufficient fees").
// -g=225 balances two hard constraints: create()'s declared limit must stay
// under Yominet's 4.5M per-tx lane cap, while removeRole needs a wide margin
// because forge estimates from post-refund gas and its four storage clears
// make peak consumption ~2x the estimate (OOGs at -g=150).
const GAS_PRICE = process.env.GAS_PRICE || '2500000';

const run = async () => {
  const world = argv.world ? argv.world : process.env.WORLD;

  const required = ['PRIV_KEY', 'RPC', 'TREASURY_PRIV_KEY'];
  for (const key of required) {
    if (!process.env[key]) throw new Error(`poolCeremony: missing env ${key}`);
  }

  setAutoMine(true);
  await executeCeremony(world, argv.forge);
  setAutoMine(false);
};

/////////////
// FORGE CALL

const executeCeremony = async (world: string, forge?: string) => {
  const child = execa(
    'forge',
    [
      'script',
      'deployment/contracts/PoolCeremony.s.sol:PoolCeremony',
      '--broadcast',
      '--fork-url',
      process.env.RPC!,
      '--legacy',
      `--with-gas-price=${GAS_PRICE}`,
      '-g=225',
      '--slow',
      '--sig',
      'run(uint256,address)',
      process.env.PRIV_KEY!,
      world || '0x00',
      '--skip',
      'test',
      ...ignoreSolcErrors,
      ...(forge?.toString().split(/,| /) || []),
    ],
    { stdio: ['inherit', 'pipe', 'pipe'] }
  );
  child.stderr?.on('data', (data) => console.log('stderr:', data.toString()));
  child.stdout?.on('data', (data) => console.log(data.toString()));

  return { child: await child };
};

/////////////
// RUN

run();
