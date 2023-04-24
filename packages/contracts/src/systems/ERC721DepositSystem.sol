// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibPet } from "libraries/LibPet.sol";

import { KamiERC721 } from "tokens/KamiERC721.sol";
import { ERC721ProxySystem, ID as ProxyID } from "systems/ERC721ProxySystem.sol";

uint256 constant ID = uint256(keccak256("system.ERC721.Deposit"));

// sets a pet game world => outside world
contract ERC721DepositSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    uint256 tokenID = abi.decode(arguments, (uint256));
    uint256 petID = LibPet.indexToID(components, tokenID);
    uint256 accountID = LibAccount.getByAddress(components, msg.sender);

    require(LibPet.getAccount(components, petID) == accountID, "Pet: not urs");

    // checks
    require(!LibPet.isInWorld(components, petID), "Pet: alr in world");

    // actions to be taken upon bridging in
    LibPet.setState(components, petID, "RESTING");

    return "";
  }

  function executeTyped(uint256 tokenID) public returns (bytes memory) {
    return execute(abi.encode(tokenID));
  }
}
