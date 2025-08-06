// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID } from "solecs/utils.sol";
import { ERC20 } from "solmate/tokens/ERC20.sol";

import { TokenAddressComponent, ID as TokenAddressCompID } from "components/TokenAddressComponent.sol";
import { TokenAllowanceComponent, ID as TokenAllowanceCompID } from "components/TokenAllowanceComponent.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibConfig } from "libraries/LibConfig.sol";

uint constant UNIT_SHIFT = 3;

/** @notice
 * LibERC20 handles all interactions involving ERC20 tokens.
 */
library LibERC20 {
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

  /// @notice converts from game units (mTokens, 3dp) to token units (wei, 18dp)
  function toTokenUnits(uint256 amt) internal pure returns (uint256) {
    return amt * 10 ** (18 - UNIT_SHIFT);
  }

  /// @notice converts from token units (wei, 18dp) to game units (mTokens, 3dp)
  function toGameUnits(uint256 amt) internal pure returns (uint256) {
    return amt / (10 ** (18 - UNIT_SHIFT));
  }

  /////////////////
  // DEPRECATED (pre-bridge)

  /// @dev deprecated. pre-bridge, to be replaced burn and direct use of transfer()
  function spend(IUintComp comps, address token, uint256 amount, uint256 spenderID) internal {
    address to = LibConfig.getAddress(comps, "ERC20_RECEIVER_ADDRESS");
    amount = toTokenUnits(amount); // convert from mToken to wei
    return transfer(comps, token, LibAccount.getOwner(comps, spenderID), to, amount);
  }

  /// @dev specific for onyx
  function spendOnyx(IUintComp comps, address onyx, uint256 amount, uint256 spenderID) internal {
    address burner = LibConfig.getAddress(comps, "ONYX_BURNER_ADDRESS"); // 0x4A8B41aC258aE5AAe054C10C8b475eB0Ce2465Ec
    amount = toTokenUnits(amount); // convert from mToken to wei
    return transfer(comps, onyx, LibAccount.getOwner(comps, spenderID), burner, amount);
  }
}
