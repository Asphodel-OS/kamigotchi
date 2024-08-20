// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import { IERC173 } from "./IERC173.sol";

interface ISystem is IERC173 {
  /// @notice emits when system is no longer supported
  event SystemDeprecated();

  function execute(bytes memory args) external returns (bytes memory);

  function deprecate() external;
}
