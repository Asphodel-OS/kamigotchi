// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibListing } from "libraries/LibListing.sol";
import { LibNPC } from "libraries/LibNPC.sol";
import { LibRegistryItem } from "libraries/LibRegistryItem.sol";

uint256 constant ID = uint256(keccak256("system._Listing.Set"));

// create or update a Listing on a NPC by its Merchnat Index
contract _ListingSetSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    (uint32 npcIndex, uint32 itemIndex, uint256 buyPrice, uint256 sellPrice) = abi.decode(
      arguments,
      (uint32, uint32, uint256, uint256)
    );

    require(LibNPC.getByIndex(components, npcIndex) != 0, "NPC: does not exist");
    require(LibRegistryItem.getByIndex(components, itemIndex) != 0, "Item: does not exist");

    uint256 id = LibListing.get(components, npcIndex, itemIndex);
    if (id == 0)
      id = LibListing.create(world, components, npcIndex, itemIndex, buyPrice, sellPrice);
    else LibListing.update(components, id, buyPrice, sellPrice);
    return abi.encode(id);
  }

  function executeTyped(
    uint32 npcIndex,
    uint32 itemIndex,
    uint256 buyPrice,
    uint256 sellPrice
  ) public onlyOwner returns (bytes memory) {
    return execute(abi.encode(npcIndex, itemIndex, buyPrice, sellPrice));
  }
}
