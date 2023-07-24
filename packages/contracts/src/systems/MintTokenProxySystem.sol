// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { MintToken } from "tokens/MintToken.sol";

uint256 constant ID = uint256(keccak256("system.ERC20.Proxy"));

string constant name = "Kami";
string constant symbol = "KAMI";

// this is a hopper system for the ERC20 contract
// it only exists to allow the ERC20 contract to be deployed without changing the MUD deployment script
// How it works:
// 1) deploys the ERC20 contract in constructor
// 2) returns the token address when called
contract MintTokenProxySystem is System {
  address token;

  constructor(IWorld _world, address _components) System(_world, _components) {
    MintToken erc20 = new MintToken(_world, name, symbol, msg.sender);
    token = address(erc20);
  }

  function getTokenAddy() public view returns (address) {
    return token;
  }

  function getToken() public view returns (MintToken) {
    return MintToken(token);
  }

  function execute(bytes memory arguments) public pure returns (bytes memory) {
    revert("unimplemented");
    return arguments;
  }

  function executeTyped(uint256 amount) public pure returns (bytes memory) {
    return execute(abi.encode(amount));
  }
}
