// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Imports.sol";
import { console } from "forge-std/console.sol";
import { Emitter } from "solecs/Emitter.sol";
/// @notice depoys a new emitter contract and updates world with it
library LibDeployEmitter {
  function deploy(IWorld world) internal returns (address) {
    Emitter emitter = new Emitter();
    world.updateEmitter(address(emitter));
    console.log("Emitter Address: ", address(emitter));
    return address(emitter);
  }
}
