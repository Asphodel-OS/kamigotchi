const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
import { JsonRpcProvider } from "@ethersproject/providers";
import dotenv from "dotenv";
import { generateAndDeploy } from "./utils/deploy";
const openurl = require("openurl");

const argv = yargs(hideBin(process.argv)).argv;
dotenv.config();

const config = "deploy.json";

const run = async () => {
  const mode = argv.mode || "DEV";
  const world =
    argv.components != undefined || argv.systems != undefined
      ? argv.world != undefined
        ? argv.world
        : getWorld(mode)
      : undefined;

  await setAutoMine(mode, true);

  const result = await generateAndDeploy({
    config: config,
    rpc: getRpc(mode)!,
    deployerPriv: getDeployerKey(mode)!,
    worldAddress: world,
    components: argv.components,
    systems: argv.systems,
    forgeOpts: argv.forgeOpts,
  });

  openurl.open(
    "http://localhost:3000/?worldAddress=" +
      result.deployedWorldAddress +
      "&initialBlockNumber=" +
      result.startBlock
  );

  await setAutoMine(mode, false);
};

const getDeployerKey = (mode: string) => {
  if (mode === "TEST") return process.env.TEST_DEPLOYER_PRIV;
  else return process.env.DEV_DEPLOYER_PRIV;
};

const getRpc = (mode: string) => {
  if (mode === "TEST") return process.env.TEST_RPC;
  else return process.env.DEV_RPC;
};

const getWorld = (mode: string) => {
  if (mode === "TEST") return process.env.TEST_WORLD;
  else return process.env.DEV_WORLD;
};

const setAutoMine = async (mode: string, on: boolean) => {
  if (mode === "DEV") {
    const provider = new JsonRpcProvider(process.env.DEV_RPC!);
    await provider.send(`${on ? "anvil_setAutomine" : "evm_setIntervalMining"}`, [on ? true : 1]);
  }
};

run();
