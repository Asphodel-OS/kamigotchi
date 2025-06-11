// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";

uint256 constant ID = uint256(keccak256("system.account.set.bio"));

// add bio to an existing account
contract AccountSetBioSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    string memory bio = abi.decode(arguments, (string));
    uint256 accID = LibAccount.getByOperator(components, msg.sender);
    if (bytes(bio).length > 140) revert("Account: bio must be 140chars");
    LibAccount.setBio(components, accID, bio);

    // standard logging and tracking
    LibAccount.updateLastTs(components, accID);
    return "";
  }

  function executeTyped(string memory bio) public returns (bytes memory) {
    return execute(abi.encode(bio));
  }
}
