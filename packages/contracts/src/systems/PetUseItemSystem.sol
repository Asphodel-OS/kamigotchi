// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { PlayerSystem } from "systems/base/PlayerSystem.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibInventory } from "libraries/LibInventory.sol";
import { LibPet } from "libraries/LibPet.sol";
import { LibItemRegistry } from "libraries/LibItemRegistry.sol";

uint256 constant ID = uint256(keccak256("system.Pet.Use.Item"));

contract PetUseItemSystem is PlayerSystem {
  constructor(IWorld _world, address _components) PlayerSystem(_world, _components) {}

  function execute(bytes memory arguments) public notPaused returns (bytes memory) {
    (uint256 id, uint32 itemIndex) = abi.decode(arguments, (uint256, uint32));
    uint256 accountID = LibAccount.getByOperator(components, msg.sender);

    require(LibPet.isPet(components, id), "not a pet");
    require(LibPet.getAccount(components, id) == accountID, "Pet not urs");
    LibInventory.decFor(components, accountID, itemIndex, 1); // implicit inventory balance check

    /// NOTE: might separate into different systems later, or better generalised handling
    string memory type_ = LibInventory.getTypeByIndex(components, itemIndex);
    if (LibString.eq(type_, "RENAME_POTION")) {
      LibPet.setNameable(components, id, true);
    } else {
      require(false, "ItemUse: unknown item type");
    }

    // standard logging and tracking
    LibAccount.updateLastTs(components, accountID);
    return "";
  }

  function executeTyped(uint256 id, uint32 itemIndex) public notPaused returns (bytes memory) {
    return execute(abi.encode(id, itemIndex));
  }
}
