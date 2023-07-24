// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibCoin } from "libraries/LibCoin.sol";

import { Farm20 } from "tokens/Farm20.sol";
import { Farm20ProxySystem, ID as ProxyID } from "systems/Farm20ProxySystem.sol";

uint256 constant ID = uint256(keccak256("system.Farm20.Deposit"));

// brings ERC20 tokens back into the game, sends it to the sender's account entity
contract Farm20DepositSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    uint256 amount = abi.decode(arguments, (uint256));
    require(amount > 0, "Farm20Deposit: amt must be > 0");

    uint256 accountID = LibAccount.getByOwner(components, msg.sender);
    require(accountID != 0, "Farm20Deposit: addy has no acc");

    Farm20 token = Farm20ProxySystem(getAddressById(world.systems(), ProxyID)).getToken();
    token.deposit(address(uint160(LibAccount.getOwner(components, accountID))), amount);
    LibCoin.inc(components, accountID, amount);

    return "";
  }

  function executeTyped(uint256 amount) public returns (bytes memory) {
    return execute(abi.encode(amount));
  }
}
