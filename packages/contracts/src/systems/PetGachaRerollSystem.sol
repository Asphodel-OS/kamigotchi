// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibGacha } from "libraries/LibGacha.sol";
import { LibPet } from "libraries/LibPet.sol";

uint256 constant ID = uint256(keccak256("system.Pet.Gacha.Reroll"));

/// @notice commits to get a random pet from gacha via rerolling + cost
contract PetGachaRerollSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {
    // init increment if not already
    // LibGacha.initIncrement(components);
  }

  function reroll(uint256 petID) external payable returns (uint256) {
    uint256 accountID = LibAccount.getByOwner(components, msg.sender);
    require(accountID != 0, "no account detected");
    require(LibPet.isPet(components, petID), "not a pet");
    require(LibPet.getAccount(components, petID) == accountID, "not urs");

    // get and check price (in wei)
    uint256 prevRerolls = LibGacha.extractReroll(components, petID);
    uint256 price = LibGacha.calcRerollCost(components, prevRerolls);
    require(msg.value >= price, "not enough ETH");

    // send pet into pool
    LibPet.toGacha(components, petID);

    // commits random seed for gacha roll
    uint256 commitID = LibGacha.commit(world, components, accountID, block.number);
    LibGacha.setReroll(components, commitID, prevRerolls);

    // standard logging and tracking
    LibAccount.logIncPetsRerolled(world, components, accountID, 1);
    LibAccount.updateLastTs(components, accountID);

    // sending eth to owner
    payable(owner()).transfer(address(this).balance);

    return commitID;
  }

  function execute(bytes memory arguments) public returns (bytes memory) {
    require(false, "not implemented");
    return "";
  }

  function init(bytes memory arguments) external onlyOwner {
    LibGacha.initIncrement(components);
  }
}
