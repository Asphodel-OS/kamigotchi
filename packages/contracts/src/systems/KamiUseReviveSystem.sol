// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibItem } from "libraries/LibItem.sol";
import { LibInventory } from "libraries/LibInventory.sol";
import { LibKami } from "libraries/LibKami.sol";

uint256 constant ID = uint256(keccak256("system.kami.use.revive"));

// eat one revive
contract KamiUseReviveSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint256 kamiID, uint32 itemIndex) = abi.decode(arguments, (uint256, uint32));
    uint256 accID = LibAccount.getByOperator(components, msg.sender);

    // item checks
    LibItem.verifyType(components, itemIndex, "REVIVE");
    LibItem.checkForPet(components, itemIndex);
    LibItem.verifyRequirements(components, itemIndex, "USE", kamiID);

    // pet checks
    LibKami.verifyAccount(components, kamiID, accID);

    // use item
    LibInventory.decFor(components, accID, itemIndex, 1); // implicit balance check
    LibKami.revive(components, kamiID);
    LibItem.applyStats(components, itemIndex, kamiID);
    LibKami.setLastTs(components, kamiID, block.timestamp); // explicitly, as we don't sync health on this EP

    // standard logging and tracking
    LibKami.logRevive(components, kamiID);
    LibItem.logUse(components, accID, itemIndex, 1);
    LibAccount.updateLastTs(components, accID);

    return "";
  }

  function executeTyped(uint256 kamiID, uint32 itemIndex) public returns (bytes memory) {
    return execute(abi.encode(kamiID, itemIndex));
  }
}
