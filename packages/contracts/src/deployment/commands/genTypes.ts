const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
import { generateSystemTypes } from "./utils/codegen";

const argv = yargs(hideBin(process.argv))
  .usage("Usage: $0 -inputDir <string> -outputDir <string>>")
  .demandOption([])
  .parse();

const run = async () => {
  const inDir = argv.inputDir || "./src/systems/";
  const outDir = argv.outputDir || "./types/";

  generateSystemTypes(inDir, outDir);
};

run();
