// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibInventory } from "libraries/LibInventory.sol";
import { LibPet } from "libraries/LibPet.sol";
import { LibItemRegistry } from "libraries/LibItemRegistry.sol";

uint256 constant ID = uint256(keccak256("system.Pet.Use.Item"));

contract PetUseItemSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint256 petID, uint32 itemIndex) = abi.decode(arguments, (uint256, uint32));
    uint256 accID = LibAccount.getByOperator(components, msg.sender);
    uint256 regID = LibItemRegistry.getByIndex(components, itemIndex);

    require(LibPet.isPet(components, petID), "not a pet");
    require(LibPet.getAccount(components, petID) == accID, "Pet not urs");
    require(LibPet.isResting(components, petID), "Pet not resting");
    LibInventory.decFor(components, accID, itemIndex, 1); // implicit inventory balance check

    /// NOTE: might separate into different systems later, or better generalised handling
    string memory type_ = LibItemRegistry.getType(components, regID);
    if (LibString.eq(type_, "RENAME_POTION")) {
      LibPet.setNameable(components, petID, true);
    } else {
      require(false, "ItemUse: unknown item type");
    }

    // standard logging and tracking
    LibAccount.updateLastTs(components, accID);
    return "";
  }

  function executeTyped(uint256 petID, uint32 itemIndex) public returns (bytes memory) {
    return execute(abi.encode(petID, itemIndex));
  }
}
