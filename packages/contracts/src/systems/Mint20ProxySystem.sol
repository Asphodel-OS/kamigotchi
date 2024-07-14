// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { PlayerSystem } from "systems/base/PlayerSystem.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { Mint20 } from "tokens/Mint20.sol";

uint256 constant ID = uint256(keccak256("system.Mint20.Proxy"));

string constant name = "Kami";
string constant symbol = "KAMI";

/// @title a hopper system for the Mint ERC20 contract
/** @dev
 * this is used for the ERC20 contract to be deployed without changing the MUD deployment script
 * How it works:
 * 1) deploys the ERC20 contract in constructor
 * 2) returns the token address when called
 */
contract Mint20ProxySystem is PlayerSystem {
  address token;

  constructor(IWorld _world, address _components) PlayerSystem(_world, _components) {
    Mint20 erc20 = new Mint20(_world, name, symbol);
    token = address(erc20);
  }

  function getTokenAddy() public view returns (address) {
    return token;
  }

  function getToken() public view returns (Mint20) {
    return Mint20(token);
  }

  function execute(bytes memory arguments) public pure returns (bytes memory) {
    revert("unimplemented");
    return arguments;
  }

  function executeTyped(uint256 amount) public pure returns (bytes memory) {
    return execute(abi.encode(amount));
  }
}
