// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

interface IOwnableWritable {
  event AuthorizedWriter(address indexed writer);
  event UnauthorizedWriter(address indexed writer);

  function authorizeWriter(address writer) external;

  function unauthorizeWriter(address writer) external;
}
