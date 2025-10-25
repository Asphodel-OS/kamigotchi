// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;
import "solecs/components/ProxyComponent.sol";

import { ERC20 } from "solmate/tokens/ERC20.sol";

uint256 constant ID = uint256(keccak256("component.token.holder"));

/// @notice holds ERC20 tokens that have been deposited in game
contract TokenHolderComponent is ProxyComponent {
  constructor(address world) ProxyComponent(world, ID) {}

  /// @dev depositing is handled by systems sending tokens to this address
  function withdraw(address token, address to, uint256 amount) external onlyWriter isUnfrozen {
    ERC20(token).transfer(to, amount);
  }

  /// @notice emergency panic button
  function escapeHatch(address token) external onlyOwner {
    uint256 balance = ERC20(token).balanceOf(address(this));
    ERC20(token).transfer(owner(), balance);
  }
}
