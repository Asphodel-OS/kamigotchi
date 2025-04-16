// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

import "forge-std/Script.sol";
import { console } from "forge-std/console.sol";
import { LibString } from "solady/utils/LibString.sol";
import { World } from "solecs/World.sol";
import { LibDeploy } from "deployment/LibDeploy.sol";
import { LibDeployTokens } from "deployment/LibDeployTokens.s.sol";
import { LibDeployEmitter } from "deployment/LibDeployEmitter.s.sol";
import { Emitter } from "solecs/Emitter.sol";
import { InitWorld } from "deployment/InitWorld.s.sol";

contract Deploy is InitWorld {
  function deploy(
    uint256 deployerPriv,
    address worldAddr,
    bool reuseComps,
    bool initWorld,
    bool emitter,
    address multisig,
    bool local
  ) external returns (World world, uint256 startBlock) {
    startBlock = block.number;
    address deployer = address(uint160(uint256(keccak256(abi.encodePacked(deployerPriv)))));
    address owner = multisig != address(0) ? multisig : deployer;
    vm.startBroadcast(deployerPriv);

    // in LibDeploy.deploy, if owner == deployer do permission auth. else transfer owner, nothing else
    bool hasPerms = worldAddr == address(0) || multisig == address(0); // is owner if new world or no multisig
    world = LibDeploy.deploy(worldAddr, owner, reuseComps, hasPerms);

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
      if (local) {
        LibDeployTokens.deployPresale(world, components);
      }
    }

    // if new world, transfer ownership to multisig
    if (worldAddr == address(0) && multisig != address(0)) {
      console.log("Transferring ownership to multisig");
      if (worldAddr == address(0)) world.transferOwnership(owner);
      LibDeploy.transferOwner(world, owner, reuseComps);
    }
  }
}
