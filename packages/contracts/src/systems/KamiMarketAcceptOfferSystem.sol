// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibKamiMarket } from "libraries/LibKamiMarket.sol";
import { LibEntityType } from "libraries/utils/LibEntityType.sol";

import { KamiMarketVault } from "tokens/KamiMarketVault.sol";

uint256 constant ID = uint256(keccak256("system.kamimarket.acceptoffer"));

/// @notice Accept any offer — WETH pulled from buyer, kami reassigned via IDOwnsKami
contract KamiMarketAcceptOfferSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint256 offerID, uint32 kamiIndex) = abi.decode(arguments, (uint256, uint32));

    uint256 sellerAccID = LibAccount.verifyOperator(components);
    address sellerAddress = LibAccount.getOwner(components, sellerAccID);
    LibKamiMarket.verifyEnabled(components);
    LibKamiMarket.verifyActive(components, offerID);
    LibKamiMarket.verifyNotExpired(components, offerID);
    LibKamiMarket.verifyNotOwner(components, offerID, sellerAccID);

    // verify seller owns the kami and it's available (resting or listed)
    LibKamiMarket.verifyKamiOwnedRestingOrListed(components, kamiIndex, sellerAccID);

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
    KamiMarketVault vault = LibKamiMarket.getVault(components);
    uint256 fee = LibKamiMarket.calcFee(components, price);
    uint256 sellerReceives = price - fee;
    address feeRecipient = LibKamiMarket.getFeeRecipient(components);

    vault.transferWETH(buyerAddress, sellerAddress, sellerReceives);
    if (fee > 0) {
      vault.transferWETH(buyerAddress, feeRecipient, fee);
    }

    // data logging and event emission
    LibKamiMarket.emitAcceptOffer(world, offerID, sellerAccID, buyerAccID, kamiIndex, price);
    LibKamiMarket.logAcceptOffer(components, sellerAccID);
    LibAccount.updateLastTs(components, sellerAccID);

    return "";
  }

  /// @param offerID The offer entity ID
  /// @param kamiIndex The kami token index to sell (for collection offers; must match for specific offers)
  function executeTyped(uint256 offerID, uint32 kamiIndex) public returns (bytes memory) {
    return execute(abi.encode(offerID, kamiIndex));
  }
}
