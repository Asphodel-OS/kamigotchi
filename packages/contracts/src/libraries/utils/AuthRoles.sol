// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { LibFlag } from "libraries/LibFlag.sol";

/** @notice
 * role auth modifiers
 * note: ownership is not handled via components, but individually with Ownable
 */
abstract contract AuthRoles {
  modifier onlyCommManager(IUintComp components) {
    require(
      LibFlag.has(components, uint256(uint160(msg.sender)), "ROLE_COMMUNITY_MANAGER"),
      "Auth: not a community manager"
    );
    _;
  }

  modifier onlyAdmin(IUintComp components) {
    require(
      LibFlag.has(components, uint256(uint160(msg.sender)), "ROLE_ADMIN"),
      "Auth: not an admin"
    );
    _;
  }
}
