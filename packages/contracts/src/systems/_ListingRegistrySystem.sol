// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { Condition } from "libraries/LibConditional.sol";
import { LibListing } from "libraries/LibListing.sol";
import { LibNPC } from "libraries/LibNPC.sol";
import { LibItem } from "libraries/LibItem.sol";

uint256 constant ID = uint256(keccak256("system.listing.registry"));

// create or update a Listing on a NPC by its Merchnat Index
contract _ListingRegistrySystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function create(bytes memory arguments) public onlyOwner returns (bytes memory) {
    (uint32 npcIndex, uint32 itemIndex, uint256 buyPrice, uint256 sellPrice) = abi.decode(
      arguments,
      (uint32, uint32, uint256, uint256)
    );

    require(LibNPC.get(components, npcIndex) != 0, "NPC: does not exist");
    require(LibItem.getByIndex(components, itemIndex) != 0, "Item: does not exist");

    uint256 id = LibListing.get(components, npcIndex, itemIndex);
    require(id == 0, "Listing already exists");

    id = LibListing.create(components, npcIndex, itemIndex, buyPrice, sellPrice);
    return abi.encode(id);
  }

  /// pulltodo
  function addRequirement(bytes memory arguments) public onlyOwner {
    (
      uint32 npcIndex,
      uint32 itemIndex,
      string memory reqType,
      string memory logicType,
      uint32 index,
      uint256 value,
      string memory condFor
    ) = abi.decode(arguments, (uint32, uint32, string, string, uint32, uint256, string));

    require(LibNPC.get(components, npcIndex) != 0, "NPC: does not exist");
    require(LibItem.getByIndex(components, itemIndex) != 0, "Item: does not exist");

    uint256 id = LibListing.get(components, npcIndex, itemIndex);
    require(id != 0, "Listing does not exist");

    LibListing.createRequirement(
      world,
      components,
      id,
      Condition(reqType, logicType, index, value, condFor)
    );
  }

  function remove(uint32 npcIndex, uint32 itemIndex) public onlyOwner {
    uint256 id = LibListing.get(components, npcIndex, itemIndex);
    require(id != 0, "Listing does not exist");

    LibListing.remove(components, id);
  }

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    require(false, "not implemented");
  }
}
