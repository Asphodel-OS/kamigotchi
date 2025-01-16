// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

interface ISystem {
  /// @notice emits when system is no longer supported
  event SystemDeprecated();

  function execute(bytes memory args) external returns (bytes memory);

  function deprecate() external;
}
