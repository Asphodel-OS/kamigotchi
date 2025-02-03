// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { Condition } from "libraries/LibConditional.sol";
import { LibItem } from "libraries/LibItem.sol";
import { LibAuctionRegistry, Params } from "libraries/LibAuctionRegistry.sol";

uint256 constant ID = uint256(keccak256("system.auction.registry"));

// create or update a Listing on a NPC by its Merchnat Index
contract _AuctionRegistrySystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function create(
    uint32 itemIndex, // index of the item being auctioned
    uint32 payItemIndex, // index of the item used to pay for auction
    uint32 priceTarget, // initial price target of the item being auctioned
    int32 period, // reference duration period (in seconds)
    int32 decay, // price decay per period (1e6)
    int32 rate, // number of purchases per period to counteract decay
    int32 max // total quantity to be auctioned
  ) public onlyOwner returns (uint256) {
    require(priceTarget > 0, "price target must be positive");
    require(period > 0, "period must be positive");
    require(decay > 0 && decay < 1e6, "decay must be between 0 and 1");
    require(rate > 0, "rate must be positive");
    require(max > 0, "max must be positive");
    require(LibItem.getByIndex(components, itemIndex) != 0, "AuctionRegistry: item does not exist");
    require(
      LibItem.getByIndex(components, payItemIndex) != 0,
      "AuctionRegistry: pay item does not exist"
    );

    Params memory params = Params(itemIndex, payItemIndex, priceTarget, period, decay, rate, max);
    uint256 id = LibAuctionRegistry.create(components, params);
    return id;
  }

  // remove an auction
  function remove(uint32 itemIndex) public onlyOwner {
    uint256 id = LibAuctionRegistry.get(components, itemIndex);
    require(id != 0, "AuctionRegistry: auction does not exist");
    LibAuctionRegistry.remove(components, id);
  }

  // add a requirement to participate in an auction
  function addRequirement(
    uint32 itemIndex, // index of the item being auctioned
    string memory reqType,
    string memory logicType,
    uint32 index,
    uint256 value,
    string memory condFor
  ) public onlyOwner {
    uint256 id = LibAuctionRegistry.get(components, itemIndex);
    require(id != 0, "AuctionBuy: auction does not exist");
    LibAuctionRegistry.addRequirement(
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
