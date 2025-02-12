const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
import { generateAbiMappings } from '../scripts/codegen';

generateAbiMappings();
