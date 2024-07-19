// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "forge-std/Script.sol";
import "forge-std/Vm.sol";
import { console } from "forge-std/console.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import "./Imports.sol";

library LibLocal {
  function init(IWorld world, IUint256Component components, IUint256Component systems) internal {
    initAccounts(world, components);
    initPets(components);
    initHarvests(components, systems);
  }

  /// @notice dummy account(s)
  function initAccounts(IWorld world, IUint256Component components) internal {
    uint256 accID = LibAccount.create(world, components, msg.sender, msg.sender);
    LibAccount.setName(components, accID, "victim bot");
  }

  /// @notice give accounts pets
  /// @dev assumes at least X pets in gacha
  function initPets(IUint256Component components) internal {
    uint256 numPets = 10;
    uint256 accID = LibAccount.getByOwner(components, msg.sender);
    require(accID != 0, "no account detected");

    uint256[] memory allGachaPets = LibGacha.getAllInGacha(components);
    require(allGachaPets.length > numPets, "not enough pets in gacha");

    // set pets to account
    IDOwnsPetComponent ownerComp = IDOwnsPetComponent(
      getAddressById(components, IDOwnsPetComponentID)
    );
    uint256[] memory petIDs = new uint256[](numPets);
    uint256[] memory accIDs = new uint256[](numPets);
    for (uint256 i = 0; i < numPets; i++) {
      petIDs[i] = allGachaPets[i];
      accIDs[i] = accID;
    }
    ownerComp.setBatch(petIDs, accIDs);
  }

  /// @notice enslave pets into harvesting on node 1
  /// @dev pets will be starving by block.timestamp syncs lol
  function initHarvests(IUint256Component components, IUint256Component systems) internal {
    uint256 accID = LibAccount.getByOwner(components, msg.sender);
    uint256[] memory petIDs = LibAccount.getPetsOwned(components, accID);
    uint256 nodeID = LibNode.getByIndex(components, 1);

    // enslavement
    for (uint256 i = 0; i < petIDs.length; i++) {
      uint256 prodID = LibHarvest.create(components, nodeID, petIDs[i]);
      LibHarvest.start(components, prodID);
      LibPet.setState(components, petIDs[i], "HARVESTING");
      LibPet.setLastActionTs(components, petIDs[i], block.timestamp);
      console.log("pet", petIDs[i], "harvesting", prodID);
    }
  }
}
