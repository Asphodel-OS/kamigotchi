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

  function _verifyAndPrepare(uint256 offerID) internal returns (uint256 sellerAccID, address sellerAddress) {
    sellerAccID = LibAccount.verifyOperator(components);
    sellerAddress = LibAccount.getOwner(components, sellerAccID);
    LibKamiMarket.verifyEnabled(components);
    LibKamiMarket.verifyActive(components, offerID);
    LibKamiMarket.verifyNotExpired(components, offerID);
    LibKamiMarket.verifyNotOwner(components, offerID, sellerAccID);
  }

  function _verifyKami(uint32 kamiIndex, uint256 sellerAccID) internal view {
    LibKamiMarket.verifyKamiOwnedRestingOrListed(components, kamiIndex, sellerAccID);
    LibSoulbound.verify(components, LibKami.getByIndex(components, kamiIndex));
  }

  function _settle(
    address buyerAddress,
    address sellerAddress,
    uint256 sellerAccID,
    uint256 price
  ) internal {
    LibKamiMarket.transferWithFee(components, buyerAddress, sellerAddress, price);
    LibTWAP.poke(components, price);
    LibAccount.updateLastTs(components, sellerAccID);
  }

  function _emitAndLog(
    uint256 offerID,
    uint256 sellerAccID,
    uint256 buyerAccID,
    uint32 kamiIndex,
    uint256 price
  ) internal {
    LibKamiMarket.emitAcceptOffer(world, offerID, sellerAccID, buyerAccID, kamiIndex, price);
    LibKamiMarket.logAcceptOffer(components, sellerAccID);
  }

  function _acceptSingle(uint256 offerID, uint32 kamiIndex) internal returns (bytes memory) {
    (uint256 sellerAccID, address sellerAddress) = _verifyAndPrepare(offerID);
    _verifyKami(kamiIndex, sellerAccID);

    uint256 buyerAccID = LibKamiMarket.getOwner(components, offerID);

    string memory orderType = LibEntityType.get(components, offerID);
    address buyerAddress;
    uint256 price;

    if (keccak256(bytes(orderType)) == keccak256(bytes("KAMI_OFFER"))) {
      require(
        LibKamiMarket.getKamiIndex(components, offerID) == kamiIndex,
        "KMA: kami mismatch"
      );
      (buyerAddress, price, ) = LibKamiMarket.fillOffer(world, components, offerID, sellerAccID);
    } else if (keccak256(bytes(orderType)) == keccak256(bytes("KAMI_COLLECTION_OFFER"))) {
      (buyerAddress, price) = LibKamiMarket.fillCollectionOffer(
        world, components, offerID, sellerAccID, kamiIndex
      );
    } else {
      revert("KMA: invalid order type");
    }

    _settle(buyerAddress, sellerAddress, sellerAccID, price);
    _emitAndLog(offerID, sellerAccID, buyerAccID, kamiIndex, price);

    return "";
  }

  /// @notice Accept a collection offer for multiple kamis in one tx
  function _acceptBatch(uint256 offerID, uint32[] memory kamiIndices) internal returns (bytes memory) {
    require(kamiIndices.length > 0, "KMA: empty batch");

    (uint256 sellerAccID, address sellerAddress) = _verifyAndPrepare(offerID);

    LibKamiMarket.verifyIsType(components, offerID, "KAMI_COLLECTION_OFFER");
    LibKamiMarket.verifyCollectionOfferQuantity(components, offerID, kamiIndices.length);

    uint256 buyerAccID = LibKamiMarket.getOwner(components, offerID);
    address buyerAddress = LibAccount.getOwner(components, buyerAccID);
    uint256 pricePerKami = LibKamiMarket.getPrice(components, offerID);

    for (uint256 i; i < kamiIndices.length; i++) {
      uint32 kamiIndex = kamiIndices[i];
      _verifyKami(kamiIndex, sellerAccID);
      LibKamiMarket.fillCollectionOffer(world, components, offerID, sellerAccID, kamiIndex);
      _emitAndLog(offerID, sellerAccID, buyerAccID, kamiIndex, pricePerKami);
    }

    _settle(buyerAddress, sellerAddress, sellerAccID, pricePerKami * kamiIndices.length);

    return "";
  }
}
