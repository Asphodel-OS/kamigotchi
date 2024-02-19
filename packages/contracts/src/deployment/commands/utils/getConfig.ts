import dotenv from "dotenv";
dotenv.config();

export const getDeployerKey = (mode: string): string => {
  let result;
  if (mode === "TEST") result = process.env.TEST_DEPLOYER_PRIV;
  else result = process.env.DEV_DEPLOYER_PRIV;
  return result || "0x00";
};

export const getRpc = (mode: string): string => {
  let result;
  if (mode === "TEST") result = process.env.TEST_RPC;
  else result = process.env.DEV_RPC;
  return result || "http://localhost:8545";
};

export const getWorld = (mode: string): string => {
  let result;
  if (mode === "TEST") result = process.env.TEST_WORLD;
  else result = process.env.DEV_WORLD;
  return result || "0x00";
};
