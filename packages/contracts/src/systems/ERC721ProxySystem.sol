// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { KamiERC721 } from "tokens/KamiERC721.sol";

uint256 constant ID = uint256(keccak256("system.ERC721.Proxy"));

string constant name = "Kami";
string constant symbol = "KAMI";

// this is a hopper system for the ERC20 contract
// it only exists to allow the ERC20 contract to be deployed without changing the MUD deployment script
// How it works:
// 1) deploys the ERC20 contract in constructor
// 2) returns the token address when called
contract ERC721ProxySystem is System {
  address token;

  constructor(IWorld _world, address _components) System(_world, _components) {
    KamiERC721 erc721 = new KamiERC721(_world, name, symbol);
    token = address(erc721);
  }

  function getTokenAddy() public view returns (address) {
    return token;
  }

  function getToken() public view returns (KamiERC721) {
    return KamiERC721(token);
  }

  function execute(bytes memory arguments) public pure returns (bytes memory) {
    revert("unimplemented");
    return arguments;
  }

  function executeTyped(uint256 amount) public pure returns (bytes memory) {
    return execute(abi.encode(amount));
  }
}
