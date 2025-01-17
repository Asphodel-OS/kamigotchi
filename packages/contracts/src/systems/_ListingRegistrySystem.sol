// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;

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

  // refresh a listing's tracked balance and start time
  // optionally update the target value if a non-zero value is provided
  function refresh(uint32 npcIndex, uint32 itemIndex, uint256 value) public onlyOwner {
    uint256 id = LibListingRegistry.get(components, npcIndex, itemIndex);
    require(id != 0, "Listing does not exist");
    LibListingRegistry.refresh(components, id, value);
  }

  /////////////////
  // PRICING

  function removeBuy(uint32 npcIndex, uint32 itemIndex) public onlyOwner {
    uint256 id = LibListingRegistry.get(components, npcIndex, itemIndex);
    require(id != 0, "Listing does not exist");
    uint256 buyID = LibListingRegistry.genBuyID(id);
    LibListingRegistry.removePrice(components, buyID);
  }

  function removeSell(uint32 npcIndex, uint32 itemIndex) public onlyOwner {
    uint256 id = LibListingRegistry.get(components, npcIndex, itemIndex);
    require(id != 0, "Listing does not exist");
    uint256 sellID = LibListingRegistry.genSellID(id);
    LibListingRegistry.removePrice(components, sellID);
  }

  function setBuyFixed(uint32 npcIndex, uint32 itemIndex) public onlyOwner {
    uint256 id = LibListingRegistry.get(components, npcIndex, itemIndex);
    require(id != 0, "Listing does not exist");
    LibListingRegistry.setBuyFixed(components, id);
  }

  function setBuyGDA(uint32 npcIndex, uint32 itemIndex, int32 scale, int32 decay) public onlyOwner {
    uint256 id = LibListingRegistry.get(components, npcIndex, itemIndex);
    require(id != 0, "Listing does not exist");
    LibListingRegistry.setBuyGDA(components, id, scale, decay);
  }

  function setSellFixed(uint32 npcIndex, uint32 itemIndex) public onlyOwner {
    uint256 id = LibListingRegistry.get(components, npcIndex, itemIndex);
    require(id != 0, "Listing does not exist");
    LibListingRegistry.setSellFixed(components, id);
  }

  function setSellScaled(uint32 npcIndex, uint32 itemIndex, int32 scale) public onlyOwner {
    uint256 id = LibListingRegistry.get(components, npcIndex, itemIndex);
    require(id != 0, "Listing does not exist");
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

    LibListingRegistry.setRequirement(
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
