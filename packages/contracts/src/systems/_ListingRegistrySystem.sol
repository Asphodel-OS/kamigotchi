// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { Condition } from "libraries/LibConditional.sol";
import { LibListingRegistry } from "libraries/LibListingRegistry.sol";
import { LibNPC } from "libraries/LibNPC.sol";
import { LibItem } from "libraries/LibItem.sol";

uint256 constant ID = uint256(keccak256("system.listing.registry"));

// create or update a Listing on a NPC by its Merchnat Index
contract _ListingRegistrySystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  // Q(jb): any reason to keep the abi encode/decode pattern on admin functions?
  function create(bytes memory arguments) public onlyOwner returns (bytes memory) {
    (uint32 npcIndex, uint32 itemIndex, uint256 value) = abi.decode(
      arguments,
      (uint32, uint32, uint256)
    );

    require(LibNPC.get(components, npcIndex) != 0, "NPC: does not exist");
    require(LibItem.getByIndex(components, itemIndex) != 0, "Item: does not exist");

    uint256 id = LibListingRegistry.get(components, npcIndex, itemIndex);
    require(id == 0, "Listing already exists");

    id = LibListingRegistry.create(components, npcIndex, itemIndex, value);
    return abi.encode(id);
  }

  // remove a listing if it exists along with all requirements and pricing
  function remove(uint32 npcIndex, uint32 itemIndex) public onlyOwner {
    uint256 id = LibListingRegistry.get(components, npcIndex, itemIndex);
    require(id != 0, "Listing does not exist");

    LibListingRegistry.remove(components, id);
  }

  /////////////////
  // PRICING

  function setBuyFixed(uint256 id) public onlyOwner {
    LibListingRegistry.setBuyFixed(components, id);
  }

  function setBuyFixed(uint32 npcIndex, uint32 itemIndex) public onlyOwner {
    uint256 id = LibListingRegistry.get(components, npcIndex, itemIndex);
    require(id != 0, "Listing does not exist");
    setBuyFixed(id);
  }

  function setSellFixed(uint256 id) public onlyOwner {
    LibListingRegistry.setSellFixed(components, id);
  }

  function setSellFixed(uint32 npcIndex, uint32 itemIndex) public onlyOwner {
    uint256 id = LibListingRegistry.get(components, npcIndex, itemIndex);
    require(id != 0, "Listing does not exist");
    setSellFixed(id);
  }

  function setSellScaled(uint32 npcIndex, uint32 itemIndex, int32 scale) public onlyOwner {
    uint256 id = LibListingRegistry.get(components, npcIndex, itemIndex);
    require(id != 0, "Listing does not exist");
    setSellScaled(id, scale);
  }

  function setSellScaled(uint256 id, int32 scale) public onlyOwner {
    LibListingRegistry.setSellScaled(components, id, scale);
  }

  /////////////////
  // REQUIREMENTS

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

    uint256 id = LibListingRegistry.get(components, npcIndex, itemIndex);
    require(id != 0, "Listing does not exist");

    LibListingRegistry.createRequirement(
      world,
      components,
      id,
      Condition(reqType, logicType, index, value, condFor)
    );
  }

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    require(false, "not implemented");
  }
}
