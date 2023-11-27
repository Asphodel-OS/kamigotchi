// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibInventory } from "libraries/LibInventory.sol";
import { LibPet } from "libraries/LibPet.sol";

uint256 constant ID = uint256(keccak256("system.Item.Rename"));

// name pet
contract RenamePotionSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint256 id, uint256 invID) = abi.decode(arguments, (uint256, uint256));
    uint256 accountID = LibAccount.getByOperator(components, msg.sender);

    require(accountID != 0, "no account");
    require(LibPet.isPet(components, id), "not a pet");
    require(LibPet.getAccount(components, id) == accountID, "Pet not urs");
    require(LibInventory.getType(components, invID) == "rename_potion", "not a rename potion");

    LibInventory.dec(components, invID, 1);
    LibPet.setCanName(components, id, true);
    LibAccount.updateLastBlock(components, accountID);
    return "";
  }

  function executeTyped(uint256 id, uint256 invID) public returns (bytes memory) {
    return execute(abi.encode(id, invID));
  }
}
