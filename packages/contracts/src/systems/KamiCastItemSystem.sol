// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibBonus } from "libraries/LibBonus.sol";
import { LibItem } from "libraries/LibItem.sol";
import { LibInventory } from "libraries/LibInventory.sol";
import { LibKami } from "libraries/LibKami.sol";

uint256 constant ID = uint256(keccak256("system.kami.cast.item"));

// cast an item on an enemy kami
contract KamiCastItemSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint256 kamiID, uint32 itemIndex) = abi.decode(arguments, (uint256, uint32));
    uint256 accID = LibAccount.getByOperator(components, msg.sender);

    // pet checks
    LibKami.verifyRoom(components, kamiID, accID);
    LibKami.verifyCooldown(components, kamiID);

    // item checks
    LibItem.verifyForShape(components, itemIndex, "ENEMY_KAMI");
    LibItem.verifyRequirements(components, itemIndex, "USE", kamiID);

    // use item
    LibKami.sync(components, kamiID);
    LibInventory.decFor(components, accID, itemIndex, 1); // implicit balance check
    LibItem.applyAllos(world, components, itemIndex, "USE", 1, kamiID);

    // standard logging and tracking
    LibItem.logUse(components, accID, itemIndex, 1, "ENEMY_KAMI");
    LibItem.emitCastEvent(world, components, accID, kamiID, itemIndex);
    LibAccount.updateLastTs(components, accID);

    return "";
  }

  function executeTyped(uint256 kamiID, uint32 itemIndex) public returns (bytes memory) {
    return execute(abi.encode(kamiID, itemIndex));
  }
}
