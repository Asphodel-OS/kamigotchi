// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import "deployment/Imports.sol";
import { console } from "forge-std/console.sol";
import { Emitter } from "solecs/Emitter.sol";
/// @notice depoys a new emitter contract and updates world with it
library LibDeployEmitter {
  function deploy(IWorld world) internal returns (address) {
    Emitter emitter = new Emitter(world);
    world.updateEmitter{ gas: 400000 }(address(emitter));
    console.log("Emitter Address: ", address(emitter));
    return address(emitter);
  }
}
