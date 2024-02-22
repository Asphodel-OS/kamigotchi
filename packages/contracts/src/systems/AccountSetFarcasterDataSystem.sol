// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { FarcasterData } from "components/FarcasterDataComponent.sol";

uint256 constant ID = uint256(keccak256("system.Account.Set.FarcasterData"));

// sets the operating address of an account. must be called by Owner EOA
contract AccountSetFarcasterDataSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    FarcasterData memory farcasterData = abi.decode(arguments, (FarcasterData));
    uint256 accountID = LibAccount.getByOwner(components, msg.sender);
    require(accountID != 0, "Account: does not exist");

    LibAccount.setFarcasterData(components, accountID, farcasterData);

    // standard logging and tracking
    LibAccount.updateLastTs(components, accountID);
    return abi.encode(accountID);
  }

  function executeTyped(FarcasterData memory farcasterData) public returns (bytes memory) {
    return execute(abi.encode(farcasterData));
  }
}
