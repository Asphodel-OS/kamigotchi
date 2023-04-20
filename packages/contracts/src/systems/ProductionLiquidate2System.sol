// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibCoin } from "libraries/LibCoin.sol";
import { LibKill } from "libraries/LibKill.sol";
import { LibPet } from "libraries/LibPet.sol";
import { LibProduction } from "libraries/LibProduction.sol";

import { ID as PLSystemID } from "systems/ProductionLiquidateSystem.sol";

uint256 constant ID = uint256(keccak256("system.Production.Liquidate"));

// extremely crude way to extend space from ProductionLiqudateSystem
// this is a temporary solution until we sort out linked libraries (ie foundary fixes the bug)
contract ProductionLiquidate2System is System {
  modifier onlyPLSystem() {
    require(getAddressById(world.systems(), PLSystemID) == msg.sender, "PL2System: not PLSystem");
    _;
  }

  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyPLSystem returns (bytes memory) {
    (uint256 targetProductionID, uint256 petID) = abi.decode(arguments, (uint256, uint256));

    uint256 accountID = LibAccount.getByAddress(components, msg.sender);
    uint256 targetPetID = LibProduction.getPet(components, targetProductionID);
    uint256 productionID = LibPet.getProduction(components, petID);
    uint256 nodeID = LibProduction.getNode(components, productionID);

    // collect the money
    // NOTE: this could be sent to the kami in future mechanics
    uint256 amt = LibProduction.calcBounty(components, targetProductionID);
    LibCoin.inc(components, accountID, amt);

    // kill the target and shut off the production
    LibPet.kill(components, targetPetID);
    LibProduction.stop(components, targetProductionID);
    LibKill.create(world, components, petID, targetPetID, nodeID);

    LibAccount.updateLastBlock(components, accountID);
    return abi.encode(amt);
  }

  function executeTyped(
    uint256 targetProductionID,
    uint256 petID
  ) public onlyPLSystem returns (bytes memory) {
    return execute(abi.encode(targetProductionID, petID));
  }
}
