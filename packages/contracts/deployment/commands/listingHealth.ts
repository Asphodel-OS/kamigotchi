const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
import dotenv from 'dotenv';
import execa from 'execa';
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

import { ignoreSolcErrors } from '../utils';

const argv = yargs(hideBin(process.argv)).usage('Usage: $0 -world <address>').parse();

// Read-only GDA listing health report (deficit + live prices). Simulation only —
// no key is used and nothing is ever broadcast.
const run = async () => {
  const world = argv.world ? argv.world : process.env.WORLD;
  if (!process.env.RPC) throw new Error('listingHealth: missing env RPC');
  if (!world) throw new Error('listingHealth: missing WORLD');

  const child = execa(
    'forge',
    [
      'script',
      'deployment/contracts/ListingHealth.s.sol:ListingHealth',
      '--fork-url',
      process.env.RPC!,
      '--sig',
      'run(uint256,address)',
      '1', // unused; ListingHealth never signs
      world,
      '--skip',
      'test',
      ...ignoreSolcErrors,
      ...(argv.forge?.toString().split(/,| /) || []),
    ],
    { stdio: ['inherit', 'pipe', 'pipe'] }
  );
  child.stderr?.on('data', (data) => console.log('stderr:', data.toString()));
  child.stdout?.on('data', (data) => console.log(data.toString()));
  await child;
};

run();
