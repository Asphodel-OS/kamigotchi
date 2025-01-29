// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID } from "solecs/utils.sol";

import { ERC20 } from "solmate/tokens/ERC20.sol";

import { TokenAddressComponent, ID as TokenAddressCompID } from "components/TokenAddressComponent.sol";
import { TokenAllowanceComponent, ID as TokenAllowanceCompID } from "components/TokenAllowanceComponent.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibConfig } from "libraries/LibConfig.sol";

/** @notice
 * LibERC20 handles all interactions involving ERC20 tokens, including onyx as a special case.
 *
 * TokenAddressComponent can be attached to any shape for spendFor()
 */
library LibERC20 {
  //////////////
  // SHAPES

  function setAddress(IUintComp components, uint256 id, address addr) internal {
    TokenAddressComponent(getAddrByID(components, TokenAddressCompID)).set(id, addr);
  }

  function remove(IUintComp components, uint256 id) internal {
    TokenAddressComponent(getAddrByID(components, TokenAddressCompID)).remove(id);
  }

  //////////////
  // INTERACTIONS

  function spend(IUintComp components, address token, uint256 amount, uint256 spender) internal {
    address to = LibConfig.getAddress(components, "ERC20_RECEIVER_ADDRESS");
    return transfer(components, token, LibAccount.getOwner(components, spender), to, amount);
  }

  /// @dev specific for onyx
  function spendOnyx(IUintComp components, uint256 amount, uint256 spender) internal {
    return spend(components, getOnyxAddr(components), amount, spender);
  }

  /// @notice spends using TokenAddressComponent
  function spendFor(IUintComp components, uint256 id, uint256 amount, uint256 spender) internal {
    address token = TokenAddressComponent(getAddrByID(components, TokenAddressCompID)).safeGet(id);
    if (token == address(0)) revert("LibERC20: token not found");
    return spend(components, token, amount, spender);
  }

  function transfer(
    IUintComp components,
    address token,
    address from,
    address to,
    uint256 amount
  ) internal {
    TokenAllowanceComponent(getAddrByID(components, TokenAllowanceCompID)).transferFrom(
      token,
      from,
      to,
      amount
    );
  }

  ////////////
  // GETTERS

  function getAddress(IUintComp components, uint256 id) internal view returns (address) {
    return TokenAddressComponent(getAddrByID(components, TokenAddressCompID)).safeGet(id);
  }

  function getOnyxAddr(IUintComp components) internal view returns (address) {
    return address(uint160(LibConfig.get(components, "ONYX_ADDRESS")));
  }
}
