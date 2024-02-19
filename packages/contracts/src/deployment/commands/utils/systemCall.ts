import { ethers } from "ethers";
import execa = require("execa");

import { SystemAbis } from "../../world/abis/SystemAbis";

type Call = {
  system: string;
  args: string;
  world?: string;
};

export const executeCall = async (rpc: string, deployerKey: string, data: Call) => {
  const child = execa(
    "forge",
    [
      "script",
      "src/deployment/contracts/SystemCall.s.sol:SystemCall",
      "--broadcast",
      "--fork-url",
      rpc,
      "--sig",
      "call(uint256,address,uint256,bytes)",
      deployerKey,
      data.world || "0",
      data.system,
      data.args,
    ],
    { stdio: ["inherit", "pipe", "pipe"] }
  );
  child.stdout?.on("data", (data) => console.log("stderr:", data.toString()));
};

export const createCall = (system: keyof typeof SystemAbis, args: any[], world?: string): Call => {
  return {
    system: systemID(system).toString(10),
    args: encodeArgs(system, args),
    world,
  };
};

export const systemID = (system: string): bigint => {
  return BigInt(ethers.utils.id(system));
};

export const encodeArgs = (system: keyof typeof SystemAbis, args: any[]) => {
  const abi = getAbi(system).find((abi) => abi.type === "function" && abi.name === "executeTyped");
  if (abi)
    return ethers.utils.defaultAbiCoder.encode(
      abi.inputs.map((n) => n.type),
      args
    );
  return "";
};

export const getAbi = (system: keyof typeof SystemAbis) => {
  return SystemAbis[system];
};
