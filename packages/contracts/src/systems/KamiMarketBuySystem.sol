// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibKamiMarket } from "libraries/LibKamiMarket.sol";
import { LibTWAP } from "libraries/LibTWAP.sol";

uint256 constant ID = uint256(keccak256("system.kamimarket.buy"));

/// @notice Buy listing(s) with ETH — batch support, all-or-nothing
contract KamiMarketBuySystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    uint256[] memory listingIDs = abi.decode(arguments, (uint256[]));
    return _buy(listingIDs);
  }

  /// @notice Payable entry point for buying listings with ETH
  /// @param listingIDs Array of listing entity IDs to buy
  function executeTyped(uint256[] memory listingIDs) public payable returns (bytes memory) {
    return _buy(listingIDs);
  }

  function _buy(uint256[] memory listingIDs) internal returns (bytes memory) {
    uint256 accID = LibAccount.getByOwner(components, msg.sender);
    LibKamiMarket.verifyEnabled(components);

    // First pass: verify all listings and calculate total price
    uint256 totalPrice;
    for (uint256 i; i < listingIDs.length; i++) {
      uint256 id = listingIDs[i];
      LibKamiMarket.verifyIsType(components, id, "KAMI_LISTING");
      LibKamiMarket.verifyActive(components, id);
      LibKamiMarket.verifyNotExpired(components, id);
      LibKamiMarket.verifyNotOwner(components, id, accID);
      totalPrice += LibKamiMarket.getPrice(components, id);
    }

    require(msg.value >= totalPrice, "KamiMarketBuy: insufficient ETH");

    // Second pass: fill listings and distribute ETH
    uint256 totalFee;
    address feeRecipient = LibKamiMarket.getFeeRecipient(components);

    for (uint256 i; i < listingIDs.length; i++) {
      uint256 id = listingIDs[i];

      uint256 sellerAccID = LibKamiMarket.getOwner(components, id);

      (address sellerAddress, uint256 price, uint32 kamiIndex) = LibKamiMarket.fillListing(
        components,
        id,
        accID
      );

      uint256 fee = LibKamiMarket.calcFee(components, price);
      uint256 sellerReceives = price - fee;
      totalFee += fee;

      // feed sale price into TWAP oracle
      LibTWAP.poke(components, price);

      _transferETH(sellerAddress, sellerReceives);

      LibKamiMarket.emitBuy(world, id, accID, sellerAccID, kamiIndex, price);
      LibKamiMarket.logBuy(components, accID);
    }

    // send total fees to treasury
    if (totalFee > 0) {
      _transferETH(feeRecipient, totalFee);
    }

    // refund excess ETH
    uint256 excess = msg.value - totalPrice;
    if (excess > 0) {
      _transferETH(msg.sender, excess);
    }

    LibAccount.updateLastTs(components, accID);
    return "";
  }

  function _transferETH(address to, uint256 amount) internal {
    (bool success, ) = payable(to).call{ value: amount }("");
    require(success, "KamiMarketBuy: ETH transfer failed");
  }
}
