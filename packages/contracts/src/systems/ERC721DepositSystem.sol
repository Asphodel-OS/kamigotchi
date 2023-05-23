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

// sets a pet outside world => game world
/* 
  Invariants:
    Before deposit:
      1) Pet does not have an Account
      2) Pet state is "721_EXTERNAL"
    After deposit:
      1) Pet is linked to Account owned by msg.sender (create one if not exist)
      2) Pet state is not "721_EXTERNAL"
*/
contract ERC721DepositSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    uint256 tokenID = abi.decode(arguments, (uint256));
    uint256 petID = LibPet.indexToID(components, tokenID);

    // checks before action
    KamiERC721 token = ERC721ProxySystem(getAddressById(world.systems(), ProxyID)).getToken();
    require(token.ownerOf(tokenID) == msg.sender, "721Deposit: not urs");
    require(LibPet.getAccount(components, petID) == 0, "Pet: alr has account");
    require(!LibPet.isInWorld(components, petID), "Pet: alr in world");

    // actions to be taken upon bridging in
    // get account, create if non existent
    uint256 accountID = LibAccount.getByOwner(components, msg.sender);
    if (accountID == 0) {
      accountID = LibAccount.create(world, components, msg.sender, msg.sender);
    }
    LibPet.deposit(components, petID, accountID);
    return "";
  }

  function executeTyped(uint256 tokenID) public returns (bytes memory) {
    return execute(abi.encode(tokenID));
  }
}
