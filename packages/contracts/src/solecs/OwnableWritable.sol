// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

import { IOwnableWritable } from "./interfaces/IOwnableWritable.sol";

import { Ownable } from "solady/auth/Ownable.sol";
import { OwnableWritableStorage } from "./OwnableWritableStorage.sol";

/**
 * @notice Ownable with authorized writers
 */
abstract contract OwnableWritable is IOwnableWritable, Ownable {
  error OwnableWritable__NotWriter();

  constructor() {
    _initializeOwner(msg.sender);
  }

  function writeAccess(address operator) public view virtual returns (bool) {
    return OwnableWritableStorage.layout().writeAccess[operator] || operator == owner();
  }

  modifier onlyWriter() {
    if (!writeAccess(msg.sender)) {
      revert OwnableWritable__NotWriter();
    }
    _;
  }

  /// @notice Grant write access to the given address.
  /// @dev Can only be called by the owner.
  /// @param writer Address to grant write access to.
  function authorizeWriter(address writer) public virtual override onlyOwner {
    OwnableWritableStorage.layout().writeAccess[writer] = true;

    emit AuthorizedWriter(writer);
  }

  /// @notice Revoke write access from the given address.
  /// @dev Can only be called by the owner.
  /// @param writer Address to revoke write access.
  function unauthorizeWriter(address writer) public virtual override onlyOwner {
    delete OwnableWritableStorage.layout().writeAccess[writer];

    emit UnauthorizedWriter(writer);
  }
}
