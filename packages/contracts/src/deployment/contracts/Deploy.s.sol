// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "forge-std/Script.sol";
import { LibString } from "solady/utils/LibString.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { LibDeploy, DeployResult } from "./LibDeploy.sol";
import { LibDeployTokens } from "./LibDeployTokens.s.sol";

import { InitWorld } from "./InitWorld.s.sol";
import { LibLocal } from "./LibLocal.s.sol";

contract Deploy is InitWorld {
  function deploy(
    uint256 deployerPriv,
    address worldAddr,
    bool reuseComps,
    bool initWorld,
    string memory MODE
  ) external returns (IWorld world, uint256 startBlock) {
    startBlock = block.number;

    address deployer = address(uint160(uint256(keccak256(abi.encodePacked(deployerPriv)))));
    vm.startBroadcast(deployerPriv);

    DeployResult memory result = LibDeploy.deploy(deployer, worldAddr, reuseComps);
    world = worldAddr == address(0) ? result.world : IWorld(worldAddr);

    // init world using init world script
    if (initWorld) {
      _setUp(address(world)); // set up global variables

      // deploy tokens
      LibDeployTokens.deployKami721(world, components);

      _initWorld(address(world));

      // custom local init script
      if (LibString.eq(MODE, "DEV")) {
        LibLocal.init(world, components, systems);
        LibDeployTokens.deployOnyx20(world, components, deployer); // openMintable erc20, local only
      }
    }
  }
}
