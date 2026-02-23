// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { IComponent } from "solecs/interfaces/IComponent.sol";
import { getAddrByID, getCompByID } from "solecs/utils.sol";
import { LibQuery, QueryFragment, QueryType } from "solecs/LibQuery.sol";
import { LibTypes } from "solecs/LibTypes.sol";

import { ID as EntityTypeCompID } from "components/EntityTypeComponent.sol";
import { StateComponent, ID as StateCompID } from "components/StateComponent.sol";
import { TimeStartComponent, ID as TimeStartCompID } from "components/TimeStartComponent.sol";
import { ValueComponent, ID as ValueCompID } from "components/ValueComponent.sol";
import { ValuesComponent, ID as ValuesCompID } from "components/ValuesComponent.sol";

import { LibEmitter } from "libraries/utils/LibEmitter.sol";
import { LibAccount } from "libraries/LibAccount.sol";
import { LibConfig } from "libraries/LibConfig.sol";
import { LibFlag } from "libraries/LibFlag.sol";
import { LibKami } from "libraries/LibKami.sol";
import { LibKami721 } from "libraries/LibKami721.sol";
import { LibKamiMarket } from "libraries/LibKamiMarket.sol";

import { KamiMarketVault } from "tokens/KamiMarketVault.sol";

uint256 constant ID = uint256(keccak256("system.newbievendor.buy"));

uint256 constant VENDOR_ENTITY = uint256(keccak256("newbie.vendor"));

/// @notice Newbie Kami Vendor — buy one kami at 1.5x marketplace floor price (one-time per player)
/// @dev Price is computed on-chain by querying the minimum active KAMI_LISTING price
///      and multiplying by 1.5 (3/2). The vendor holds kamis in a specific wallet.
///      Admin sets a pool of kami indices; the first 3 are displayed for sale.
///      When one is bought, the next from the pool fills in.
contract NewbieVendorBuySystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    uint32 kamiIndex = abi.decode(arguments, (uint32));
    return _buy(kamiIndex);
  }

  function executeTyped(uint32 kamiIndex) public payable returns (bytes memory) {
    return _buy(kamiIndex);
  }

  function _buy(uint32 kamiIndex) internal returns (bytes memory) {
    uint256 accID = uint256(uint160(msg.sender));

    require(LibConfig.getBool(components, "NEWBIE_VENDOR_ENABLED"), "NewbieVendor: disabled");
    require(
      !LibFlag.has(components, accID, "NEWBIE_VENDOR_PURCHASED"),
      "NewbieVendor: already purchased"
    );

    // compute price: 1.5x marketplace floor
    uint256 price = _calcPrice();
    require(msg.value >= price, "NewbieVendor: insufficient ETH");

    // verify kami is on display + remove from pool
    _verifyDisplayAndRemove(kamiIndex);

    // verify vendor owns kami, transfer, send ETH
    _transferKami(kamiIndex, price);

    // mark as purchased (one-time flag)
    LibFlag.set(components, accID, "NEWBIE_VENDOR_PURCHASED", true);

    // emit event
    _emitBuy(accID, kamiIndex, price);

    if (LibAccount.isAccount(components, accID)) {
      LibAccount.updateLastTs(components, accID);
    }

    return "";
  }

  /// @notice Verify kami is in the current display window and remove it from pool
  /// @dev Display cycles every NEWBIE_VENDOR_CYCLE seconds, showing 3 kamis from the pool
  ///      at an offset that advances by 3 each cycle, wrapping around.
  function _verifyDisplayAndRemove(uint32 kamiIndex) internal {
    ValuesComponent valuesComp = ValuesComponent(getAddrByID(components, ValuesCompID));
    uint256[] memory pool = valuesComp.get(VENDOR_ENTITY);
    require(pool.length > 0, "NewbieVendor: pool empty");

    // compute current display window from cycle offset
    uint256 cycleStart = TimeStartComponent(getAddrByID(components, TimeStartCompID)).get(VENDOR_ENTITY);
    uint256 cycleDuration = LibConfig.get(components, "NEWBIE_VENDOR_CYCLE");
    uint256 cycleNumber = (block.timestamp - cycleStart) / cycleDuration;
    uint256 offset = (cycleNumber * 3) % pool.length;

    uint256 displaySize = pool.length < 3 ? pool.length : 3;
    uint256 poolIdx = type(uint256).max;
    for (uint256 i; i < displaySize; i++) {
      uint256 displayIdx = (offset + i) % pool.length;
      if (pool[displayIdx] == uint256(kamiIndex)) {
        poolIdx = displayIdx;
        break;
      }
    }
    require(poolIdx != type(uint256).max, "NewbieVendor: kami not on display");

    // swap with last element, shrink
    uint256 lastIdx = pool.length - 1;
    if (poolIdx != lastIdx) {
      pool[poolIdx] = pool[lastIdx];
    }
    uint256[] memory newPool = new uint256[](lastIdx);
    for (uint256 i; i < lastIdx; i++) newPool[i] = pool[i];
    valuesComp.set(VENDOR_ENTITY, newPool);
  }

  /// @notice Verify vendor ownership, transfer kami, handle ETH payments
  function _transferKami(uint32 kamiIndex, uint256 price) internal {
    address vendorAddr = LibConfig.getAddress(components, "NEWBIE_VENDOR_ADDRESS");
    require(
      LibKami721.getEOAOwner(components, kamiIndex) == vendorAddr,
      "NewbieVendor: vendor no longer owns kami"
    );

    uint256 kamiID = LibKami.getByIndex(components, kamiIndex);
    require(kamiID != 0, "NewbieVendor: kami not found");
    LibKami.verifyState(components, kamiID, "721_EXTERNAL");

    // transfer kami via marketplace vault
    KamiMarketVault vault = LibKamiMarket.getVault(components);
    vault.transferKami(vendorAddr, msg.sender, kamiIndex);

    // send ETH to vendor address
    _transferETH(vendorAddr, price);

    // refund excess
    uint256 excess = msg.value - price;
    if (excess > 0) {
      _transferETH(msg.sender, excess);
    }
  }

  /// @notice Compute vendor price: 1.5x the marketplace floor (minimum active listing price)
  function _calcPrice() internal view returns (uint256) {
    QueryFragment[] memory fragments = new QueryFragment[](2);
    fragments[0] = QueryFragment(
      QueryType.HasValue,
      IComponent(getAddrByID(components, EntityTypeCompID)),
      abi.encode("KAMI_LISTING")
    );
    fragments[1] = QueryFragment(
      QueryType.HasValue,
      IComponent(getAddrByID(components, StateCompID)),
      abi.encode("ACTIVE")
    );

    uint256[] memory listings = LibQuery.query(fragments);
    require(listings.length > 0, "NewbieVendor: no active listings for floor price");

    ValueComponent valueComp = ValueComponent(getAddrByID(components, ValueCompID));
    uint256 floor = type(uint256).max;
    for (uint256 i; i < listings.length; i++) {
      uint256 p = valueComp.get(listings[i]);
      if (p < floor) floor = p;
    }

    return (floor * 3) / 2;
  }

  function _emitBuy(uint256 accID, uint32 kamiIndex, uint256 price) internal {
    uint8[] memory _schema = new uint8[](3);
    _schema[0] = uint8(LibTypes.SchemaValue.UINT256);
    _schema[1] = uint8(LibTypes.SchemaValue.UINT32);
    _schema[2] = uint8(LibTypes.SchemaValue.UINT256);
    LibEmitter.emitEvent(
      world,
      "NEWBIE_VENDOR_BUY",
      _schema,
      abi.encode(accID, kamiIndex, price)
    );
  }

  function _transferETH(address to, uint256 amount) internal {
    (bool success, ) = payable(to).call{ value: amount }("");
    require(success, "NewbieVendor: ETH transfer failed");
  }
}
