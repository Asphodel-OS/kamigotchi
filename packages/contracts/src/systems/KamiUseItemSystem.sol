// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibBonus } from "libraries/LibBonus.sol";
import { LibItem } from "libraries/LibItem.sol";
import { LibInventory } from "libraries/LibInventory.sol";
import { LibKami } from "libraries/LibKami.sol";
import { LibData } from "libraries/LibData.sol";

uint256 constant ID = uint256(keccak256("system.kami.use.item"));
string constant MOCHI_USED_TYPE = "MOCHI_USED";

// eat one snack
contract KamiUseItemSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint256 kamiID, uint32 itemIndex) = abi.decode(arguments, (uint256, uint32));
    uint256 accID = LibAccount.getByOperator(components, msg.sender);

    // (ach) temporary blocker for temple of the wheel
    if (LibKami.getRoom(components, kamiID) == 19) {
      require(
        LibAccount.getIndex(components, accID) == 833,
        "you aren't even supposed to be here.."
      );
    }
    LibItem.verifyEnabled(components, itemIndex);

    // pet checks
    LibKami.verifyAccount(components, kamiID, accID);
    LibKami.verifyRoom(components, kamiID, accID);
    LibKami.verifyCooldown(components, kamiID);

    // item checks
    LibItem.verifyForShape(components, itemIndex, "KAMI");
    LibItem.verifyRequirements(components, itemIndex, "USE", kamiID);
    if (_isMochi(itemIndex)) {
      uint256 used = LibData.get(components, kamiID, 0, MOCHI_USED_TYPE);
      require(used < 3, "mochi limit reached");
    }

    // reset action bonuses
    if (!LibItem.bypassBonusReset(components, itemIndex)) {
      LibBonus.resetUponHarvestAction(components, kamiID);
    }

    // use item
    LibKami.sync(components, kamiID);
    LibInventory.decFor(components, accID, itemIndex, 1); // implicit balance check
    LibItem.applyAllos(world, components, itemIndex, "USE", 1, kamiID);
    if (_isMochi(itemIndex)) {
      LibData.inc(components, kamiID, 0, MOCHI_USED_TYPE, 1);
    }

    // reset the pet's intensity
    LibKami.resetIntensity(components, kamiID);

    // standard logging and tracking
    LibItem.logUse(components, accID, itemIndex, 1, "KAMI");
    LibAccount.updateLastTs(components, accID);

    return "";
  }

  function executeTyped(uint256 kamiID, uint32 itemIndex) public returns (bytes memory) {
    return execute(abi.encode(kamiID, itemIndex));
  }

  // todo: we shouldn't be reliant on hardcoded item indices
  function _isMochi(uint32 itemIndex) internal pure returns (bool) {
    return
      itemIndex == 11110 || // Gaokerena Mochi
      itemIndex == 11120 || // Sunset Apple Mochi
      itemIndex == 11130 || // Kami Mochi
      itemIndex == 11140; // Mana Mochi
  }
}
