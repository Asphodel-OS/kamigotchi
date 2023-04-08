// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibCoin } from "libraries/LibCoin.sol";

import { KamiERC20 } from "tokens/KamiERC20.sol";

uint256 constant ID = uint256(keccak256("system.ERC20.Burn"));

// brings ERC20 tokens back into the game, sends it to the sender's account entity
contract ERC20BurnSystem is System {
  address token;

  constructor(IWorld _world, address _components) System(_world, _components) {}

  // separating an init function to preserve deployment compatibility
  function init(address _token) external onlyOwner {
    token = _token;
  }

  function execute(bytes memory arguments) public returns (bytes memory) {
    require(token != address(0), "ERC20BurnSystem: not inited");

    uint256 amount = abi.decode(arguments, (uint256));
    uint256 accountID = LibAccount.getByOwner(components, msg.sender);

    if (accountID == 0) {
      accountID = LibAccount.create(world, components, msg.sender, msg.sender);
    }

    KamiERC20(token).burn(msg.sender, amount);
    LibCoin.inc(components, accountID, amount);

    return "";
  }

  function executeTyped(uint256 amount) public returns (bytes memory) {
    return execute(abi.encode(amount));
  }
}
