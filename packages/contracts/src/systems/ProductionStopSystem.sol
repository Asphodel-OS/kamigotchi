// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { LibCoin } from "libraries/LibCoin.sol";
import { LibAccount } from "libraries/LibAccount.sol";
import { LibPet } from "libraries/LibPet.sol";
import { LibProduction } from "libraries/LibProduction.sol";

uint256 constant ID = uint256(keccak256("system.Production.Stop"));

// ProductionStopSystem collects and stops an active pet production. This is the case
// when a pet is stopped by the owner. When it is stopped by liquidation or death, the
// output is not collected.
// TODO: update productions to support all kinds of nodes, not just harvesting
contract ProductionStopSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    uint256 id = abi.decode(arguments, (uint256));
    uint256 accountID = LibAccount.getByAddress(components, msg.sender);
    uint256 petID = LibProduction.getPet(components, id);
    require(LibPet.getAccount(components, petID) == accountID, "Pet: not urs");

    LibPet.syncHealth(components, petID);
    require(LibPet.isHealthy(components, petID), "Pet: starving..");
    require(LibPet.isHarvesting(components, petID), "Pet: must be harvesting");
    require(
      LibAccount.getLocation(components, accountID) == LibPet.getLocation(components, petID),
      "Pet: too far"
    );

    uint256 amt = LibProduction.calcOutput(components, id);
    LibCoin.inc(components, accountID, amt);
    LibProduction.stop(components, id);

    LibAccount.updateLastBlock(components, accountID);
    return abi.encode(amt);
  }

  function executeTyped(uint256 id) public returns (bytes memory) {
    return execute(abi.encode(id));
  }
}
