// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibERC721 } from "libraries/LibERC721.sol";
import { LibPet } from "libraries/LibPet.sol";

uint256 constant ID = uint256(keccak256("system.ERC721.Unstake"));

// sets a pet game world => outside world
/*
  Invarients:
    Before withdrawal:
      1) Pet is linked to an Account owned by address, token owned by KamiERC721
      2) Pet state is not "721_EXTERNAL" + Pet stats is "RESTING"
      3) Pet is revealed
    After withdrawal:
      1) Pet is not linked to an Account, owned by EOA
      2) Pet state is "721_EXTERNAL"
*/
contract ERC721UnstakeSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    uint256 tokenID = abi.decode(arguments, (uint256));
    uint256 petID = LibPet.indexToID(components, tokenID);
    uint256 accountID = LibAccount.getByOwner(components, msg.sender);

    // checks before action
    require(LibPet.getAccount(components, petID) == accountID, "Pet: not urs");
    require(LibPet.isResting(components, petID), "Pet: not resting");

    // actions to be taken upon bridging out
    LibPet.unstake(components, petID);
    LibERC721.unstake(world, msg.sender, tokenID);

    return "";
  }

  function executeTyped(uint256 tokenID) public returns (bytes memory) {
    return execute(abi.encode(tokenID));
  }
}
