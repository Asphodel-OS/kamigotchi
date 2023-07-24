// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibCoin } from "libraries/LibCoin.sol";

import { Bytes } from "tokens/Bytes.sol";
import { BytesProxySystem, ID as ProxyID } from "systems/BytesProxySystem.sol";

uint256 constant ID = uint256(keccak256("system.ERC20.Withdraw"));

// in game -> ERC20
// bridges in game coins to ERC20 by minting ERC20 tokens in the ERC20 contract
// sends it only to the Account owner's address
contract BytesWithdrawSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    uint256 amount = abi.decode(arguments, (uint256));
    require(amount > 0, "BytesWithdraw: amt must be > 0");

    uint256 accountID = LibAccount.getByOwner(components, msg.sender);
    require(accountID != 0, "BytesWithdraw: addy has no acc");

    LibCoin.dec(components, accountID, amount);
    Bytes token = BytesProxySystem(getAddressById(world.systems(), ProxyID)).getToken();
    token.withdraw(address(uint160(LibAccount.getOwner(components, accountID))), amount);

    return "";
  }

  function executeTyped(uint256 amount) public returns (bytes memory) {
    return execute(abi.encode(amount));
  }
}
