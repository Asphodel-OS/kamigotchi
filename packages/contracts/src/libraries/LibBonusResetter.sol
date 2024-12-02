// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";

import { LibBonus } from "libraries/LibBonus.sol";

/// @notice handles resetting of temporary bonuses
library LibBonusResetter {
  /// @notice resets upon harvest action (collect, feed, stop)
  function uponHarvestAction(IUintComp components, uint256 holderID) public {
    LibBonus.unassignBy(components, "UPON_HARVEST_ACTION", holderID);
  }

  // /// @notice resets timed bonuses
  // /// @dev re-implement from LibBonus, only keep here if more convenient to use later on
  // function timed(IUintComp components, uint256 holderID) public {
  //   LibBonus.unassignTimed(components, holderID);
  // }
}
