// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { AuthRoles } from "libraries/utils/AuthRoles.sol";
import { Condition } from "libraries/LibConditional.sol";
import { LibListingRegistry } from "libraries/LibListingRegistry.sol";
import { LibNPC } from "libraries/LibNPC.sol";
import { LibItem } from "libraries/LibItem.sol";

uint256 constant ID = uint256(keccak256("system.listing.registry"));

// create or update a Listing on a NPC by its Merchnat Index
contract _ListingRegistrySystem is System, AuthRoles {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function create(bytes memory arguments) public onlyAdmin(components) returns (uint256) {
    (uint32 npcIndex, uint32 itemIndex, uint32 currencyIndex, uint256 value) = abi.decode(
      arguments,
      (uint32, uint32, uint32, uint256)
    );

    require(LibNPC.get(components, npcIndex) != 0, "NPC: does not exist");
    require(LibItem.getByIndex(components, itemIndex) != 0, "Item: does not exist");

    uint256 id = LibListingRegistry.get(components, npcIndex, itemIndex);
    require(id == 0, "Listing already exists");

    id = LibListingRegistry.create(components, npcIndex, itemIndex, currencyIndex, value);
    return id;
  }

  // remove a listing if it exists along with all requirements and pricing
  function remove(uint32 npcIndex, uint32 itemIndex) public onlyAdmin(components) {
    uint256 id = LibListingRegistry.get(components, npcIndex, itemIndex);
    require(id != 0, "Listing does not exist");
    LibListingRegistry.remove(components, id);
  }

  /////////////////
  // PRICING

  function removeBuy(uint32 npcIndex, uint32 itemIndex) public onlyAdmin(components) {
    uint256 id = LibListingRegistry.get(components, npcIndex, itemIndex);
    require(id != 0, "Listing does not exist");
    uint256 buyID = LibListingRegistry.genBuyID(id);
    LibListingRegistry.removePrice(components, buyID);
  }

  function removeSell(uint32 npcIndex, uint32 itemIndex) public onlyAdmin(components) {
    uint256 id = LibListingRegistry.get(components, npcIndex, itemIndex);
    require(id != 0, "Listing does not exist");
    uint256 sellID = LibListingRegistry.genSellID(id);
    LibListingRegistry.removePrice(components, sellID);
  }

  function setBuyFixed(uint32 npcIndex, uint32 itemIndex) public onlyAdmin(components) {
    uint256 id = LibListingRegistry.get(components, npcIndex, itemIndex);
    require(id != 0, "Listing does not exist");
    LibListingRegistry.setBuyFixed(components, id);
  }

  function setBuyGDA(
    uint32 npcIndex,
    uint32 itemIndex,
    int32 period, // (seconds)
    int32 decay, // compounding decay over a period
    int32 rate, // the rate of purchases per period to negate decay
    bool reset // whether to reset the tracking values (balance, timeStart)
  ) public onlyAdmin(components) {
    uint256 id = LibListingRegistry.get(components, npcIndex, itemIndex);
    require(id != 0, "Listing does not exist");

    require(period > 0, "period must be positive");
    require(decay > 0 && decay < 1e6, "decay must be between 0 and 1");
    require(rate > 0, "rate must be positive");

    LibListingRegistry.setBuyGDA(components, id, period, decay, rate);
    if (reset) LibListingRegistry.reset(components, id);
  }

  function setSellFixed(uint32 npcIndex, uint32 itemIndex) public onlyAdmin(components) {
    uint256 id = LibListingRegistry.get(components, npcIndex, itemIndex);
    require(id != 0, "Listing does not exist");
    LibListingRegistry.setSellFixed(components, id);
  }

  function setSellScaled(
    uint32 npcIndex,
    uint32 itemIndex,
    int32 scale
  ) public onlyAdmin(components) {
    uint256 id = LibListingRegistry.get(components, npcIndex, itemIndex);
    require(id != 0, "Listing does not exist");
    require(0 <= scale && scale <= 1e9, "scale must be between 0 and 1");
    LibListingRegistry.setSellScaled(components, id, scale);
  }

  /////////////////
  // REQUIREMENTS

  function addRequirement(bytes memory arguments) public onlyAdmin(components) {
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

    Condition memory condition = Condition(reqType, logicType, index, value, condFor);
    LibListingRegistry.setRequirement(world, components, id, condition);
  }

  function execute(bytes memory arguments) public onlyAdmin(components) returns (bytes memory) {
    require(false, "not implemented");
  }
}
