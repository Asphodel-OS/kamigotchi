// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";

uint256 constant ID = uint256(keccak256("system.Account.Set.FarcasterData"));

// sets the operating address of an account. must be called by Owner EOA
contract AccountSetFarcasterDataSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint32 fid, string memory pfpURI) = abi.decode(arguments, (uint32, string));

    uint256 accountID = LibAccount.getByFarcasterIndex(components, fid);
    require(accountID == 0, "Account: fid already claimed");

    accountID = LibAccount.getByOwner(components, msg.sender);
    require(accountID != 0, "Account: does not exist");

    LibAccount.setFarcasterIndex(components, accountID, fid);
    LibAccount.setMediaURI(components, accountID, pfpURI);

    // standard logging and tracking
    LibAccount.updateLastTs(components, accountID);
    return abi.encode(accountID);
  }

  function executeTyped(uint32 fid, string memory pfpURI) public returns (bytes memory) {
    return execute(abi.encode(fid, pfpURI));
  }
}
