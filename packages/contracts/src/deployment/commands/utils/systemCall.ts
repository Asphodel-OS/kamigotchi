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
  child.stderr?.on("data", (data) => console.log("stderr:", data.toString()));
  child.stdout?.on("data", (data) => console.log(data.toString()));

  return { child: await child };
};

export const executeCallFromStream = async (rpc: string, deployerKey: string, world: string) => {
  const child = execa(
    "forge",
    [
      "script",
      "src/deployment/contracts/InitWorld.s.sol:InitWorld",
      "--fork-url",
      rpc,
      "--sig",
      "initWorld(uint256,address)",
      deployerKey,
      world || "0x00",
    ],
    { stdio: ["inherit", "pipe", "pipe"] }
  );
  child.stderr?.on("data", (data) => console.log("stderr:", data.toString()));
  child.stdout?.on("data", (data) => console.log(data.toString()));

  return { child: await child };
};

export const createCall = (system: keyof typeof SystemAbis, args: any[], world?: string): Call => {
  return {
    system: systemID(system).toString(10),
    args: encodeArgs(system, args),
    world,
  };
};

export const parseCall = (system: keyof typeof SystemAbis, args: any[]) => {
  return {
    system: systemID(system).toString(10),
    args: parseArgs(system, args),
  };
};

export const systemID = (system: string): bigint => {
  return BigInt(ethers.utils.id(system));
};

export const encodeArgs = (system: keyof typeof SystemAbis, args: any[]) => {
  const abi = getAbi(system).find((abi) => abi.type === "function" && abi.name === "executeTyped");
  if (abi)
    return ethers.utils.defaultAbiCoder.encode(
      abi.inputs.map((n: { type: any }) => n.type),
      args
    );
  return "";
};

export const parseArgs = (system: keyof typeof SystemAbis, args: any[]) => {
  const abi = getAbi(system).find((abi) => abi.type === "function" && abi.name === "executeTyped");
  const inputTypes = abi?.inputs.map((n: { type: any }) => n.type);
  for (let i = 0; i < args.length; i++) {
    if (inputTypes && inputTypes[i] === "string") {
      args[i] = `"` + args[i] + `"`;
    } else if (inputTypes && inputTypes[i].includes("[]")) {
      args[i] =
        args[i].length > 0
          ? `_convertArray${inputTypes[i].slice(0, -2)}(abi.encode([${args[i]}]), ${
              args[i].length
            })` // converting array literal to memory
          : `${inputTypes[i]}(0)`;
    }
  }
  return args;
};

export const getAbi = (system: keyof typeof SystemAbis) => {
  return SystemAbis[system];
};
