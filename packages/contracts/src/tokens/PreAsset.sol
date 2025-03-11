// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

/// @notice placeholder presale contract
contract PreAsset {
  // Presale variables
  uint256 public immutable price;
  uint256 public depositCap;
  uint256 public totalDeposits;
  mapping(address user => uint256 limit) public whitelist;
  mapping(address user => uint256 deposits) public deposits;

  // When true users can deposit
  bool public active;

  constructor() {
    active = true;
    depositCap = 1000 ether;
    price = 1000;
  }

  // Verify user deposit against merkle tree and deposit
  function deposit(uint256 amount_, uint256 limit_, bytes32[] calldata proofs_) external {}

  // Verify user deposit against whitelist and deposit
  function whitelistDeposit(uint256 amount_) external {
    deposits[msg.sender] += amount_;
    totalDeposits += amount_;
  }

  function _deposit(uint256 amount_, uint256 limit_) internal {}

  function setActive(bool _active) external {
    active = _active;
  }

  function setDepositCap(uint256 _depositCap) external {
    depositCap = _depositCap;
  }

  // Manually add users to whitelist to deposit through manual deposit
  function modifyWhitelist(address[] calldata _users, uint256[] calldata _limits) external {
    uint256 totalUsers = _users.length;
    for (uint256 i; i < totalUsers; i++) {
      whitelist[_users[i]] = _limits[i];
    }
  }
}
