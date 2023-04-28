// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { RandomDKG } from "utils/RandomDKG.sol";

uint256 constant ID = uint256(keccak256("system.RandomDKG.Proxy"));

// hopper system for RandomDKG contract
contract RandomDKGProxySystem is System {
  address addy;

  constructor(IWorld _world, address _components) System(_world, _components) {
    RandomDKG dkg = new RandomDKG(components);
    addy = address(dkg);
  }

  function getAddy() public view returns (address) {
    return addy;
  }

  function getContract() public view returns (RandomDKG) {
    return RandomDKG(addy);
  }

  function execute(bytes memory arguments) public pure returns (bytes memory) {
    revert("unimplemented");
    return arguments;
  }

  function executeTyped(uint256 amount) public pure returns (bytes memory) {
    return execute(abi.encode(amount));
  }
}
