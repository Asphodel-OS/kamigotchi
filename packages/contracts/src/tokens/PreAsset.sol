// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

/// @notice placeholder presale contract
contract PreAsset {
  mapping(address => uint256) public whitelist;
  mapping(address => uint256) public deposits;

  bool public active;

  constructor() {
    active = true;
  }

  // Verify user deposit against merkle tree and deposit
  function deposit(uint256 amount_, uint256 limit_, bytes32[] calldata proofs_) external {}

  // Verify user deposit against whitelist and deposit
  function whitelistDeposit(uint256 amount_) external {}

  function _deposit(uint256 amount_, uint256 limit_) internal {}

  function claim() external returns (uint256) {}

  function withdraw() external returns (uint256) {}
}
