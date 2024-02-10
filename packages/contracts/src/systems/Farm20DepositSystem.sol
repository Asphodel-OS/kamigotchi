// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibCoin } from "libraries/LibCoin.sol";
import { LibDataEntity } from "libraries/LibDataEntity.sol";

import { Farm20 } from "tokens/Farm20.sol";
import { Farm20ProxySystem, ID as ProxyID } from "systems/Farm20ProxySystem.sol";

uint256 constant ID = uint256(keccak256("system.Farm20.Deposit"));
uint256 constant ROOM = 12;

/// @notice Farm20 outside (ERC20) => game world
/** @dev
 * Room 12 is the bridge room, system can only be called there
 * Burns Farm20 bridged in, adds to CoinComponent balance for account
 * to be called by account owner
 */
contract Farm20DepositSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    uint256 amount = abi.decode(arguments, (uint256));
    require(amount > 0, "Farm20Deposit: amt must be > 0");

    uint256 accountID = LibAccount.getByOwner(components, msg.sender);
    require(accountID != 0, "Farm20Deposit: no account detected");
    require(
      LibAccount.getRoom(components, accountID) == ROOM,
      "Farm20Deposit: must be in room 12"
    );

    Farm20 token = Farm20ProxySystem(getAddressById(world.systems(), ProxyID)).getToken();
    token.deposit(address(uint160(LibAccount.getOwner(components, accountID))), amount);
    LibCoin.inc(components, accountID, amount);

    // standard logging and tracking
    LibDataEntity.incFor(world, components, accountID, 0, "COIN_TOTAL", amount);
    LibDataEntity.incFor(world, components, accountID, 0, "COIN_DEPOSIT", amount);
    LibAccount.updateLastTs(components, accountID);
    return "";
  }

  function executeTyped(uint256 amount) public returns (bytes memory) {
    return execute(abi.encode(amount));
  }
}
