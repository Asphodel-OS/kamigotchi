// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibEquipment } from "libraries/LibEquipment.sol";
import { LibKami } from "libraries/LibKami.sol";

uint256 constant ID = uint256(keccak256("system.kami.unequip"));

/// @notice System for unequipping items from kamis
/// @dev Removes equipment from slot, clears associated bonuses, returns item to inventory
contract KamiUnequipSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint256 kamiID, string memory slot) = abi.decode(arguments, (uint256, string));
    uint256 accID = LibAccount.getByOperator(components, msg.sender);

    // Kami checks
    LibKami.verifyAccount(components, kamiID, accID);
    LibEquipment.verifyKamiCanEquip(components, kamiID);

    // Unequip the item (clears bonuses, removes instance, returns to inventory)
    uint32 itemIndex = LibEquipment.unequip(world, components, kamiID, accID, slot);

    // Update account timestamp
    LibAccount.updateLastTs(components, accID);

    return abi.encode(itemIndex);
  }

  function executeTyped(uint256 kamiID, string memory slot) public returns (uint32) {
    bytes memory result = execute(abi.encode(kamiID, slot));
    return abi.decode(result, (uint32));
  }
}
