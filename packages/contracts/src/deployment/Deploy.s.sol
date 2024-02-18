// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "forge-std/Script.sol";
import { Vm } from "forge-std/Vm.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { LibDeploy, DeployResult } from "./LibDeploy.sol";

contract Deploy is Script {
  function deploy(
    uint256 deployerPriv,
    address worldAddr,
    bool reuseComps
  ) external returns (IWorld world, uint256 startBlock) {
    startBlock = block.number;
    uint256 deployerPriv = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
    address deployer = address(uint160(uint256(keccak256(abi.encodePacked(deployerPriv)))));
    vm.startBroadcast(deployerPriv);
    DeployResult memory result = LibDeploy.deploy(deployer, worldAddr, reuseComps);
    world = worldAddr == address(0) ? result.world : IWorld(worldAddr);
  }
}
