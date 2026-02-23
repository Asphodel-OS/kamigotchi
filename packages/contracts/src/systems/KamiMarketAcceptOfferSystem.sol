// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibKami } from "libraries/LibKami.sol";
import { LibKamiMarket } from "libraries/LibKamiMarket.sol";
import { LibSoulbound } from "libraries/LibSoulbound.sol";
import { LibTWAP } from "libraries/LibTWAP.sol";
import { LibEntityType } from "libraries/utils/LibEntityType.sol";

import { KamiMarketVault } from "tokens/KamiMarketVault.sol";

uint256 constant ID = uint256(keccak256("system.kamimarket.acceptoffer"));

/// @notice Accept any offer — WETH pulled from buyer, kami reassigned via IDOwnsKami
contract KamiMarketAcceptOfferSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (bool isBatch, uint256 offerID, uint32 kamiIndex, uint32[] memory kamiIndices) =
      abi.decode(arguments, (bool, uint256, uint32, uint32[]));

    if (isBatch) {
      return _acceptBatch(offerID, kamiIndices);
    } else {
      return _acceptSingle(offerID, kamiIndex);
    }
  }

  /// @param offerID The offer entity ID
  /// @param kamiIndex The kami token index to sell (for collection offers; must match for specific offers)
  function executeTyped(uint256 offerID, uint32 kamiIndex) public returns (bytes memory) {
    return _acceptSingle(offerID, kamiIndex);
  }

  /// @param offerID The collection offer entity ID
  /// @param kamiIndices Array of kami token indices to sell
  function executeTyped(uint256 offerID, uint32[] memory kamiIndices) public returns (bytes memory) {
    return _acceptBatch(offerID, kamiIndices);
  }

  function _acceptSingle(uint256 offerID, uint32 kamiIndex) internal returns (bytes memory) {
    uint256 sellerAccID = LibAccount.verifyOperator(components);
    address sellerAddress = LibAccount.getOwner(components, sellerAccID);
    LibKamiMarket.verifyEnabled(components);
    LibKamiMarket.verifyActive(components, offerID);
    LibKamiMarket.verifyNotExpired(components, offerID);
    LibKamiMarket.verifyNotOwner(components, offerID, sellerAccID);

    // verify seller owns the kami and it's available (resting or listed)
    LibKamiMarket.verifyKamiOwnedRestingOrListed(components, kamiIndex, sellerAccID);

    // verify kami is not soulbound
    LibSoulbound.verify(components, LibKami.getByIndex(components, kamiIndex));

    uint256 buyerAccID = LibKamiMarket.getOwner(components, offerID);

    string memory orderType = LibEntityType.get(components, offerID);
    address buyerAddress;
    uint256 price;

    if (keccak256(bytes(orderType)) == keccak256(bytes("KAMI_OFFER"))) {
      // specific offer: verify the offer targets this kami
      require(
        LibKamiMarket.getKamiIndex(components, offerID) == kamiIndex,
        "KamiMarketAccept: kami mismatch"
      );
      (buyerAddress, price, ) = LibKamiMarket.fillOffer(world, components, offerID, sellerAccID);
    } else if (keccak256(bytes(orderType)) == keccak256(bytes("KAMI_COLLECTION_OFFER"))) {
      (buyerAddress, price) = LibKamiMarket.fillCollectionOffer(
        world,
        components,
        offerID,
        sellerAccID,
        kamiIndex
      );
    } else {
      revert("KamiMarketAccept: invalid order type");
    }

    // WETH transfers via vault
    {
      KamiMarketVault vault = LibKamiMarket.getVault(components);
      uint256 fee = LibKamiMarket.calcFee(components, price);
      vault.transferWETH(buyerAddress, sellerAddress, price - fee);
      if (fee > 0) {
        vault.transferWETH(buyerAddress, LibKamiMarket.getFeeRecipient(components), fee);
      }
    }

    // feed sale price into TWAP oracle
    LibTWAP.poke(components, price);

    // data logging and event emission
    LibKamiMarket.emitAcceptOffer(world, offerID, sellerAccID, buyerAccID, kamiIndex, price);
    LibKamiMarket.logAcceptOffer(components, sellerAccID);
    LibAccount.updateLastTs(components, sellerAccID);

    return "";
  }

  /// @notice Accept a collection offer for multiple kamis in one tx
  function _acceptBatch(uint256 offerID, uint32[] memory kamiIndices) internal returns (bytes memory) {
    require(kamiIndices.length > 0, "KamiMarketAccept: empty batch");

    // --- shared checks (once) ---
    uint256 sellerAccID = LibAccount.verifyOperator(components);
    address sellerAddress = LibAccount.getOwner(components, sellerAccID);
    LibKamiMarket.verifyEnabled(components);
    LibKamiMarket.verifyActive(components, offerID);
    LibKamiMarket.verifyNotExpired(components, offerID);
    LibKamiMarket.verifyNotOwner(components, offerID, sellerAccID);

    // verify this is a collection offer with enough remaining quantity
    LibKamiMarket.verifyIsType(components, offerID, "KAMI_COLLECTION_OFFER");
    LibKamiMarket.verifyCollectionOfferQuantity(components, offerID, kamiIndices.length);

    // cache shared state
    uint256 buyerAccID = LibKamiMarket.getOwner(components, offerID);
    address buyerAddress = LibAccount.getOwner(components, buyerAccID);
    uint256 pricePerKami = LibKamiMarket.getPrice(components, offerID);

    // --- per-kami fills ---
    for (uint256 i; i < kamiIndices.length; i++) {
      uint32 kamiIndex = kamiIndices[i];
      LibKamiMarket.verifyKamiOwnedRestingOrListed(components, kamiIndex, sellerAccID);
      LibSoulbound.verify(components, LibKami.getByIndex(components, kamiIndex));

      LibKamiMarket.fillCollectionOffer(world, components, offerID, sellerAccID, kamiIndex);
      LibKamiMarket.emitAcceptOffer(world, offerID, sellerAccID, buyerAccID, kamiIndex, pricePerKami);
    }

    // --- batched WETH transfers ---
    uint256 totalPrice = pricePerKami * kamiIndices.length;
    KamiMarketVault vault = LibKamiMarket.getVault(components);
    uint256 totalFee = LibKamiMarket.calcFee(components, totalPrice);
    vault.transferWETH(buyerAddress, sellerAddress, totalPrice - totalFee);
    if (totalFee > 0) {
      vault.transferWETH(buyerAddress, LibKamiMarket.getFeeRecipient(components), totalFee);
    }

    // --- TWAP + logging (once) ---
    LibTWAP.poke(components, pricePerKami);
    LibKamiMarket.logAcceptOffer(components, sellerAccID);
    LibAccount.updateLastTs(components, sellerAccID);

    return "";
  }
}
