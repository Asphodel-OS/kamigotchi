// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;
import "solecs/components/ProxyComponent.sol";

import { ERC20 } from "solmate/tokens/ERC20.sol";

uint256 constant ID = uint256(keccak256("component.token.allowance"));

/// @notice delegate to store ERC20 allowances
contract TokenAllowanceComponent is ProxyComponent {
  constructor(address world) ProxyComponent(world, ID) {}

  function transferFrom(
    address token,
    address from,
    address to,
    uint256 amount
  ) external onlyWriter isUnfrozen {
    ERC20(token).transferFrom(from, to, amount);
  }
}
