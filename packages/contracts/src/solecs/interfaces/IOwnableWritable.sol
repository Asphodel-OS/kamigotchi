// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

interface IOwnableWritable {
  function authorizeWriter(address writer) external;

  function unauthorizeWriter(address writer) external;
}
