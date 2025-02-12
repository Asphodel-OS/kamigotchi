const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
import { generateComponentSchemas, generateSystemTypes } from '../scripts/codegen';

const argv = yargs(hideBin(process.argv))
  .usage('Usage: $0 -inputDir <string> -outputDir <string>>')
  .demandOption([])
  .parse();

const run = async () => {
  const inDir = argv.inputDir || './src/systems/';
  const outDir = argv.outputDir || './types/';

  generateSystemTypes(inDir, outDir);
  generateComponentSchemas();
};

run();
