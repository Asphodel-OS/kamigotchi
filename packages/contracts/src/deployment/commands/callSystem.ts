const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
import dotenv from "dotenv";
import { generateSystemAbis } from "./utils/codegen";
import { getDeployerKey, getRpc, getWorld } from "./utils/getConfig";
import { createCall, executeCall } from "./utils/systemCall";

const argv = yargs(hideBin(process.argv))
  .usage("Usage: $0 -genAbis <bool> -mode <mode> -system <system.id> -args <'arg1','arg2'>")
  .demandOption(["mode", "system", "args"])
  .parse();
dotenv.config();

const run = async () => {
  const mode = argv.mode || "DEV";

  if (argv.genAbis) generateSystemAbis();

  const data = createCall(argv.system, argv.args.split(","), getWorld(mode));
  const result = await executeCall(getRpc(mode), getDeployerKey(mode), data);

  return result;
};

run();
