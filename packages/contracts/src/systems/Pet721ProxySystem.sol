// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { PlayerSystem } from "systems/base/PlayerSystem.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { Pet721 } from "tokens/Pet721.sol";

uint256 constant ID = uint256(keccak256("system.Pet721.Proxy"));

string constant name = "Kami";
string constant symbol = "KAMI";

/// @title a hopper system for the Pet ERC721 contract
/** @dev
 * this is used for the ERC721 contract to be deployed without changing the MUD deployment script
 * How it works:
 * 1) deploys the ERC721 contract in constructor
 * 2) returns the token address when called
 */
contract Pet721ProxySystem is PlayerSystem {
  address public token;

  constructor(IWorld _world, address _components) PlayerSystem(_world, _components) {
    Pet721 erc721 = new Pet721(_world, name, symbol);
    token = address(erc721);
  }

  function getTokenAddy() public view returns (address) {
    return token;
  }

  function getToken() public view returns (Pet721) {
    return Pet721(token);
  }

  function execute(bytes memory arguments) public pure returns (bytes memory) {
    revert("unimplemented");
    return arguments;
  }

  function executeTyped(uint256 args) public pure returns (bytes memory) {
    return execute(abi.encode(args));
  }
}
