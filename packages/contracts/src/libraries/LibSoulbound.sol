// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { getAddrByID } from "solecs/utils.sol";

import { ValueComponent, ID as ValueCompID } from "components/ValueComponent.sol";

/// @notice Temporary soulbound lock for kami entities
/// @dev Stores an expiry timestamp in ValueComponent at a derived entity key.
///      Completely orthogonal to the cooldown system.
library LibSoulbound {
  function _entity(uint256 kamiID) private pure returns (uint256) {
    return uint256(keccak256(abi.encode(kamiID, "SOULBOUND")));
  }

  /// @notice Lock a kami for `duration` seconds
  function set(IUintComp components, uint256 kamiID, uint256 duration) internal {
    ValueComponent(getAddrByID(components, ValueCompID)).set(
      _entity(kamiID),
      block.timestamp + duration
    );
  }

  /// @notice Revert if the kami is still soulbound
  function verify(IUintComp components, uint256 kamiID) internal view {
    uint256 expiry = ValueComponent(getAddrByID(components, ValueCompID)).safeGet(_entity(kamiID));
    require(block.timestamp >= expiry, "kami is soulbound");
  }
}
