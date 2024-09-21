// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID } from "solecs/utils.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibItem } from "libraries/LibItem.sol";
import { LibInventory } from "libraries/LibInventory.sol";
import { LibPet } from "libraries/LibPet.sol";

uint256 constant ID = uint256(keccak256("system.pet.use.renamePotion"));

contract PetUseRenamePotionSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint256 petID, uint32 itemIndex) = abi.decode(arguments, (uint256, uint32));
    uint256 accID = LibAccount.getByOperator(components, msg.sender);

    // item checks
    require(LibItem.isTypeOf(components, itemIndex, "RENAME_POTION"), "that's not a rename potion");
    require(LibItem.isForPet(components, itemIndex), "that's not for pets");

    // pet checks
    LibPet.assertAccount(components, petID, accID);
    require(LibPet.isResting(components, petID), "Pet not resting"); // implicit location check

    // use item
    LibInventory.decFor(components, accID, itemIndex, 1); // implicit inventory balance check
    LibPet.setNameable(components, petID, true);

    // standard logging and tracking
    LibAccount.updateLastTs(components, accID);
    LibItem.logUse(components, accID, itemIndex, 1);
    LibAccount.updateLastTs(components, accID);

    return "";
  }

  function executeTyped(uint256 petID, uint32 itemIndex) public returns (bytes memory) {
    return execute(abi.encode(petID, itemIndex));
  }
}
