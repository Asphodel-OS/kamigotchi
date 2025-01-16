// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";

uint256 constant ID = uint256(keccak256("system.account.set.farcaster"));

// sets the operating address of an account. must be called by Owner EOA
contract AccountSetFarcasterDataSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint32 fid, string memory pfpURI) = abi.decode(arguments, (uint32, string));

    uint256 accID = LibAccount.getByFarcasterIndex(components, fid);
    if (accID != 0) revert("Account: fid already claimed");

    accID = LibAccount.getByOwner(components, msg.sender);
    if (accID == 0) revert("Account: no account");

    LibAccount.setFarcasterIndex(components, accID, fid);
    LibAccount.setMediaURI(components, accID, pfpURI);

    // standard logging and tracking
    LibAccount.updateLastTs(components, accID);
    return abi.encode(accID);
  }

  function executeTyped(uint32 fid, string memory pfpURI) public returns (bytes memory) {
    return execute(abi.encode(fid, pfpURI));
  }
}
