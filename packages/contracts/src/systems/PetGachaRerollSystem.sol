// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibGacha } from "libraries/LibGacha.sol";
import { LibPet } from "libraries/LibPet.sol";

uint256 constant ID = uint256(keccak256("system.Pet.Gacha.Reroll"));

/// @notice commits to get a random pet from gacha via rerolling + cost
/// @dev only meant to be called for a single account
contract PetGachaRerollSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function reroll(uint256[] memory petIDs) external payable returns (uint256[] memory) {
    uint256 accID = LibAccount.getByOwner(components, msg.sender);
    require(accID != 0, "no account detected");
    require(LibPet.isPetBatch(components, petIDs), "not a pet");
    require(LibPet.assertAccountBatch(components, petIDs, accID), "not urs");
    require(LibPet.assertStateBatch(components, petIDs, "RESTING"), "not resting");

    // get and check price (in wei)
    uint256[] memory prevRerolls = LibGacha.extractRerollBatch(components, petIDs);
    uint256 price = LibGacha.calcRerollsCost(components, prevRerolls);
    require(msg.value >= price, "not enough ETH");

    // send pet into pool
    LibGacha.depositPets(components, petIDs);

    // commits random seed for gacha roll
    uint256[] memory commitIDs = LibGacha.commitBatch(
      world,
      components,
      petIDs.length,
      accID,
      block.number
    );
    LibGacha.setRerollBatch(components, commitIDs, prevRerolls);

    // standard logging and tracking
    LibAccount.logIncPetsRerolled(world, components, accID, petIDs.length);
    LibAccount.updateLastTs(components, accID);

    // sending eth to owner
    payable(owner()).transfer(address(this).balance);

    return commitIDs;
  }

  function execute(bytes memory arguments) public returns (bytes memory) {
    require(false, "not implemented");
    return "";
  }

  function init(bytes memory arguments) external onlyOwner {
    LibGacha.initIncrement(components);
  }
}
