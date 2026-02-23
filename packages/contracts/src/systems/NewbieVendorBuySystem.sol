// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID } from "solecs/utils.sol";
import { LibTypes } from "solecs/LibTypes.sol";

import { TimeStartComponent, ID as TimeStartCompID } from "components/TimeStartComponent.sol";
import { ValuesComponent, ID as ValuesCompID } from "components/ValuesComponent.sol";

import { LibEmitter } from "libraries/utils/LibEmitter.sol";
import { LibAccount } from "libraries/LibAccount.sol";
import { LibConfig } from "libraries/LibConfig.sol";
import { LibFlag } from "libraries/LibFlag.sol";
import { LibKami } from "libraries/LibKami.sol";
import { LibSoulbound } from "libraries/LibSoulbound.sol";

uint256 constant ID = uint256(keccak256("system.newbievendor.buy"));

uint256 constant VENDOR_ENTITY = uint256(keccak256("newbie.vendor"));
uint256 constant TWAP_ENTITY = uint256(keccak256("newbie.vendor.twap"));
uint256 constant DEFAULT_MIN_PRICE = 0.005 ether;

/// @notice Newbie Kami Vendor — buy one kami at TWAP price (one-time per player)
/// @dev Price is derived from a TWAP oracle fed by marketplace sales (LibTWAP).
///      Returns max(twapPrice, minPrice). The vendor holds kamis staked in-game.
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
    uint256 accID = LibAccount.getByOwner(components, msg.sender);

    require(LibConfig.getBool(components, "NEWBIE_VENDOR_ENABLED"), "NewbieVendor: disabled");
    require(
      !LibFlag.has(components, accID, "NEWBIE_VENDOR_PURCHASED"),
      "NewbieVendor: already purchased"
    );

    // only accounts created in the last 24h can use the vendor
    uint256 accountCreated = TimeStartComponent(getAddrByID(components, TimeStartCompID)).get(accID);
    require(block.timestamp - accountCreated <= 86400, "NewbieVendor: account too old");

    // compute price from TWAP oracle
    uint256 price = _calcPrice();
    require(msg.value >= price, "NewbieVendor: insufficient ETH");

    // prevent them from making future purchases from the newbie vendor
    LibFlag.set(components, accID, "NEWBIE_VENDOR_PURCHASED", true);

    // verify kami is on display + remove from pool
    _verifyDisplayAndRemove(kamiIndex);

    // verify vendor owns kami, transfer, send ETH
    _transferKami(kamiIndex, price, accID);

    // soulbind — prevents listing, unstaking, or accepting offers
    uint256 kamiID = LibKami.getByIndex(components, kamiIndex);
    LibSoulbound.set(components, kamiID, 3 days);

    // emit event
    _emitBuy(accID, kamiIndex, price);

    LibAccount.updateLastTs(components, accID);

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

  /// @notice Verify vendor ownership, reassign kami, handle ETH payments
  function _transferKami(uint32 kamiIndex, uint256 price, uint256 buyerAccID) internal {
    address vendorAddr = LibConfig.getAddress(components, "NEWBIE_VENDOR_ADDRESS");
    uint256 vendorAccID = uint256(uint160(vendorAddr));

    uint256 kamiID = LibKami.getByIndex(components, kamiIndex);
    require(kamiID != 0, "NewbieVendor: kami not found");
    LibKami.verifyAccount(components, kamiID, vendorAccID);
    LibKami.verifyState(components, kamiID, "RESTING");

    // reassign ownership via IDOwnsKami
    LibKami.setOwner(components, kamiID, buyerAccID);

    // send ETH to vendor address
    _transferETH(vendorAddr, price);

    // refund excess
    uint256 excess = msg.value - price;
    if (excess > 0) {
      _transferETH(msg.sender, excess);
    }
  }

  /// @notice Compute vendor price from TWAP oracle, floored at minimum price
  /// @return price max(twapPrice, minPrice)
  function _calcPrice() internal view returns (uint256 price) {
    uint256 minPrice = LibConfig.get(components, "NEWBIE_VENDOR_MIN_PRICE");
    if (minPrice == 0) minPrice = DEFAULT_MIN_PRICE;

    ValuesComponent valuesComp = ValuesComponent(getAddrByID(components, ValuesCompID));
    if (!valuesComp.has(TWAP_ENTITY)) return minPrice;

    uint256[] memory data = valuesComp.get(TWAP_ENTITY);
    if (data.length != 5) return minPrice;

    uint256 cumulativePriceSeconds = data[0];
    uint256 lastPrice = data[1];
    uint256 lastUpdateTime = data[2];
    uint256 snapshotCumulative = data[3];
    uint256 snapshotTimestamp = data[4];

    uint256 windowTime = block.timestamp - snapshotTimestamp;
    if (windowTime == 0) {
      // just after snapshot — use lastPrice
      return lastPrice > minPrice ? lastPrice : minPrice;
    }

    // extend cumulative to now
    uint256 liveCumulative = cumulativePriceSeconds + lastPrice * (block.timestamp - lastUpdateTime);
    uint256 twapPrice = (liveCumulative - snapshotCumulative) / windowTime;

    return twapPrice > minPrice ? twapPrice : minPrice;
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
