const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
import { generateSystemAbis } from "./utils/codegen";

generateSystemAbis();
