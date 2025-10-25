// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { SafeCastLib } from "solady/utils/SafeCastLib.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { getAddrByID } from "solecs/utils.sol";

import { TokenAllowanceComponent, ID as TokenAllowanceCompID } from "components/TokenAllowanceComponent.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibConfig } from "libraries/LibConfig.sol";

/** @notice
 * LibERC20 handles all interactions involving ERC20 tokens.
 */
library LibERC20 {
  using SafeCastLib for int32;

  //////////////
  // INTERACTIONS

  function transfer(
    IUintComp comps,
    address token,
    address from,
    address to,
    uint256 amount
  ) internal {
    TokenAllowanceComponent(getAddrByID(comps, TokenAllowanceCompID)).transferFrom(
      token,
      from,
      to,
      amount
    );
  }

  ///////////
  // UTILS

  /// @notice converts from base game units to token units (wei, 18dp)
  /// @dev this does not handle portal scale conversion
  function toTokenUnits(uint256 amt, int32 scale) internal pure returns (uint256) {
    if (scale > 18) revert("LibERC20: scale > 18 not supported");
    return amt * (10 ** (18 - scale).toUint256());
  }

  /// @notice converts from token units (wei, 18dp) to game units (mTokens, 3dp)
  /// @dev this does not handle portal scale conversion
  function toGameUnits(uint256 amt, int32 scale) internal pure returns (uint256) {
    if (scale > 18) revert("LibERC20: scale > 18 not supported");
    return amt / (10 ** (18 - scale).toUint256());
  }

  /////////////////
  // DEPRECATED (pre-bridge)

  /// @dev deprecated. pre-bridge, to be replaced burn and direct use of transfer()
  function spend(IUintComp comps, address token, uint256 amount, uint256 spenderID) internal {
    address to = LibConfig.getAddress(comps, "ERC20_RECEIVER_ADDRESS");
    amount = toTokenUnits(amount, 3); // convert from mToken to wei
    return transfer(comps, token, LibAccount.getOwner(comps, spenderID), to, amount);
  }

  /// @dev specific for onyx
  function spendOnyx(IUintComp comps, address onyx, uint256 amount, uint256 spenderID) internal {
    address burner = LibConfig.getAddress(comps, "ONYX_BURNER_ADDRESS"); // 0x4A8B41aC258aE5AAe054C10C8b475eB0Ce2465Ec
    amount = toTokenUnits(amount, 3); // convert from mToken to wei
    return transfer(comps, onyx, LibAccount.getOwner(comps, spenderID), burner, amount);
  }
}
