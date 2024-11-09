// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID } from "solecs/utils.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibItem } from "libraries/LibItem.sol";
import { LibInventory } from "libraries/LibInventory.sol";
import { LibKami } from "libraries/LibKami.sol";

uint256 constant ID = uint256(keccak256("system.kami.use.renamePotion"));

contract KamiUseRenamePotionSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint256 kamiID, uint32 itemIndex) = abi.decode(arguments, (uint256, uint32));
    uint256 accID = LibAccount.getByOperator(components, msg.sender);

    // item checks
    LibItem.verifyType(components, itemIndex, "RENAME_POTION");
    LibItem.checkForPet(components, itemIndex);

    // pet checks
    LibKami.verifyAccount(components, kamiID, accID);
    LibKami.verifyState(components, kamiID, "RESTING"); // implicit location check

    // use item
    LibInventory.decFor(components, accID, itemIndex, 1); // implicit inventory balance check
    LibKami.setNameable(components, kamiID, true);

    // standard logging and tracking
    LibAccount.updateLastTs(components, accID);
    LibItem.logUse(components, accID, itemIndex, 1);
    LibAccount.updateLastTs(components, accID);

    return "";
  }

  function executeTyped(uint256 kamiID, uint32 itemIndex) public returns (bytes memory) {
    return execute(abi.encode(kamiID, itemIndex));
  }
}
