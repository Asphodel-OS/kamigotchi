// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibCoin } from "libraries/LibCoin.sol";

import { KamiERC20 } from "tokens/KamiERC20.sol";
import { ERC20ProxySystem, ID as ProxyID } from "systems/ERC20ProxySystem.sol";

uint256 constant ID = uint256(keccak256("system.ERC20.Withdraw"));

// brings in game coins into the real world by minting ERC20 tokens in the ERC20 contract
// sends it only to the Account owner's address
contract ERC20WithdrawSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    uint256 amount = abi.decode(arguments, (uint256));
    uint256 accountID = LibAccount.getByAddress(components, msg.sender);

    require(accountID != 0, "ERC20Withdraw: addy has no acc");

    LibCoin.dec(components, accountID, amount);
    KamiERC20 token = ERC20ProxySystem(getAddressById(world.systems(), ProxyID)).getToken();
    token.withdraw(address(uint160(LibAccount.getOwner(components, accountID))), amount);

    return "";
  }

  function executeTyped(uint256 amount) public returns (bytes memory) {
    return execute(abi.encode(amount));
  }
}
