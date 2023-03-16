// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { LibCoin } from "libraries/LibCoin.sol";
import { LibAccount } from "libraries/LibAccount.sol";
import { LibPet } from "libraries/LibPet.sol";
import { LibProduction } from "libraries/LibProduction.sol";
import { Strings } from "utils/Strings.sol";
import { Utils } from "utils/Utils.sol";

uint256 constant ID = uint256(keccak256("system.ProductionCollect"));

// ProductionCollectSystem collects on an active pet production.
// TODO: update this to kill the pet off if health is at 0
contract ProductionCollectSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    uint256 id = abi.decode(arguments, (uint256));
    uint256 accountID = LibAccount.getByAddress(components, msg.sender);
    uint256 petID = LibProduction.getPet(components, id);

    require(LibPet.isAccount(components, petID, accountID), "Pet: not urs");
    require(LibPet.isProducing(components, petID), "Pet: must be producing");
    require(LibPet.syncHealth(components, petID) != 0, "Pet: is dead (pls revive)");

    uint256 amt = LibProduction.getOutput(components, id);
    LibCoin.inc(components, accountID, amt);
    LibProduction.reset(components, id);

    Utils.updateLastBlock(components, accountID);
    return abi.encode(amt);
  }

  function executeTyped(uint256 id) public returns (bytes memory) {
    return execute(abi.encode(id));
  }
}
