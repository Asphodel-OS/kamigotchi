// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { LibCoin } from "libraries/LibCoin.sol";
import { LibAccount } from "libraries/LibAccount.sol";

uint256 constant ID = uint256(keccak256("system._devGiveTokens"));

// real important to remove this for deployment! would allow for free minting
// gives coins to the calling account
contract _devGiveTokensSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    uint256 amount = abi.decode(arguments, (uint256));
    LibCoin.inc(components, LibAccount.getByAddress(components, msg.sender), amount);
    return abi.encode("");
  }

  function executeTyped(uint256 amount) public onlyOwner returns (bytes memory) {
    return execute(abi.encode(amount));
  }
}
