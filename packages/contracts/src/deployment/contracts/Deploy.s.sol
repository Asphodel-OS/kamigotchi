// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

import "forge-std/Script.sol";
import { console } from "forge-std/console.sol";
import { LibString } from "solady/utils/LibString.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { LibDeploy, DeployResult } from "./LibDeploy.sol";
import { LibDeployTokens } from "./LibDeployTokens.s.sol";
import { LibDeployEmitter } from "./LibDeployEmitter.s.sol";
import { Emitter } from "solecs/Emitter.sol";
import { InitWorld } from "./InitWorld.s.sol";

contract Deploy is InitWorld {
  function deploy(
    uint256 deployerPriv,
    address worldAddr,
    bool reuseComps,
    bool initWorld,
    bool emitter,
    address multisig,
    string memory MODE
  ) external returns (IWorld world, uint256 startBlock) {
    startBlock = block.number;
    address deployer = address(uint160(uint256(keccak256(abi.encodePacked(deployerPriv)))));
    vm.startBroadcast(deployerPriv);

    DeployResult memory result = LibDeploy.deploy(deployer, worldAddr, reuseComps);
    world = worldAddr == address(0) ? result.world : IWorld(worldAddr);

    if (worldAddr == address(0) || emitter) {
      LibDeployEmitter.deploy(world);
    }

    // init world using init world script
    if (initWorld) {
      _setUp(address(world)); // set up global variables

      // deploy tokens
      LibDeployTokens.deployKami721(world, components);
      LibDeployTokens.deployVIP(world, components);

      _initWorld(address(world));

      // local non-mud setup
      if (LibString.eq(MODE, "DEV")) {
        LibDeployTokens.deployPresale(world, components);
      }
    }

    // transfer ownership to multisig
    if (multisig != address(0)) {
      console.log("Transferring ownership to multisig");
      LibDeploy.transferOwner(multisig, world, reuseComps);
    }
  }
}
