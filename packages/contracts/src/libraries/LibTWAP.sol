// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { getAddrByID } from "solecs/utils.sol";

import { ValuesComponent, ID as ValuesCompID } from "components/ValuesComponent.sol";

import { LibConfig } from "libraries/LibConfig.sol";

uint256 constant TWAP_ENTITY = uint256(keccak256("newbie.vendor.twap"));

/// @notice TWAP accumulator for Newbie Vendor pricing, fed by marketplace sales
library LibTWAP {
  /// @notice Accumulate time-weighted price from a sale
  /// @param components The component registry
  /// @param price The sale price (if 0, lastPrice is preserved)
  function poke(IUintComp components, uint256 price) internal {
    ValuesComponent valuesComp = ValuesComponent(getAddrByID(components, ValuesCompID));

    // silently return if not initialized
    if (!valuesComp.has(TWAP_ENTITY)) return;
    uint256[] memory data = valuesComp.get(TWAP_ENTITY);
    if (data.length != 5) return;

    uint256 cumulativePriceSeconds = data[0];
    uint256 lastPrice = data[1];
    uint256 lastUpdateTime = data[2];
    uint256 snapshotCumulative = data[3];
    uint256 snapshotTimestamp = data[4];

    // accumulate
    uint256 elapsed = block.timestamp - lastUpdateTime;
    if (elapsed > 0) {
      cumulativePriceSeconds += lastPrice * elapsed;
    }

    // update lastPrice from sale price
    if (price > 0) {
      lastPrice = price;
    }

    lastUpdateTime = block.timestamp;

    // check snapshot rollover
    uint256 window = LibConfig.get(components, "NEWBIE_VENDOR_TWAP_WINDOW");
    if (block.timestamp - snapshotTimestamp >= window) {
      snapshotCumulative = cumulativePriceSeconds;
      snapshotTimestamp = block.timestamp;
    }

    // write back
    data[0] = cumulativePriceSeconds;
    data[1] = lastPrice;
    data[2] = lastUpdateTime;
    data[3] = snapshotCumulative;
    data[4] = snapshotTimestamp;
    valuesComp.set(TWAP_ENTITY, data);
  }
}
