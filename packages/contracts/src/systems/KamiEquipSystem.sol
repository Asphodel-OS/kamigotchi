// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibEquipment } from "libraries/LibEquipment.sol";
import { LibItem } from "libraries/LibItem.sol";
import { LibKami } from "libraries/LibKami.sol";

uint256 constant ID = uint256(keccak256("system.kami.equip"));

/// @notice System for equipping items to kamis
/// @dev Equipment items use slot-based equipping with bonuses that persist until unequipped
contract KamiEquipSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint256 kamiID, uint32 itemIndex) = abi.decode(arguments, (uint256, uint32));
    uint256 accID = LibAccount.getByOperator(components, msg.sender);

    // Kami checks
    LibKami.verifyAccount(components, kamiID, accID);
    LibEquipment.verifyKamiCanEquip(components, kamiID);

    // Item checks
    LibItem.verifyEnabled(components, itemIndex);
    LibItem.verifyType(components, itemIndex, "EQUIPMENT");

    // Equip the item (handles slot conflicts, inventory, and bonuses)
    uint256 equipID = LibEquipment.equip(world, components, kamiID, accID, itemIndex);

    // Update account timestamp
    LibAccount.updateLastTs(components, accID);

    return abi.encode(equipID);
  }

  function executeTyped(uint256 kamiID, uint32 itemIndex) public returns (uint256) {
    bytes memory result = execute(abi.encode(kamiID, itemIndex));
    return abi.decode(result, (uint256));
  }
}
