// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { SD59x18 } from "prb-math/SD59x18.sol";
import { UD60x18 } from "prb-math/UD60x18.sol";
import { LibFPConverter } from "libraries/utils/LibFPConverter.sol";

struct Params {
  uint256 targetPrice; // 1e0 precision
  uint256 startTs; // 1e0 precision
  uint256 period; // 1e0 precision (seconds)
  uint256 decay; // 1e18 precision (price decay per period w/ no buys, pre-scaled up from 1e6)
  uint256 rate; // 1e0 precision (emitted per period for steady pricing)
  uint256 prevSold; // 1e0 precision
  uint256 quantity; // 1e0 precision (amt to be sold)
}

/// @notice an assortment for operations around GDAs
library LibGDA {
  using LibFPConverter for SD59x18;
  using LibFPConverter for UD60x18;
  using LibFPConverter for int256;
  using LibFPConverter for uint256;

  /// @notice calculate the perpetual discrete GDA (discrete VRGDA) price for a set of params
  /// @param params (noted in GDAParams struct)
  /// @return (1e18) total cost
  function calc(Params memory params) public view returns (int256) {
    SD59x18 pTarget = params.targetPrice.rawToSD();
    SD59x18 qInitial = params.prevSold.rawToSD();
    SD59x18 qDelta = params.quantity.rawToSD();
    SD59x18 period = params.period.rawToSD();
    SD59x18 tDelta = (block.timestamp - params.startTs).rawToSD().div(period);
    SD59x18 decay = params.decay.wadToSD();
    SD59x18 rate = params.rate.rawToSD();

    // calculate spot price = p0 * a^(t - n/r)
    SD59x18 cost = decay.pow(tDelta.sub(qInitial.div(rate))).mul(pTarget);

    // calculate cost summation of purchased quantity
    if (params.quantity > 1) {
      SD59x18 one = int256(1).rawToSD();
      SD59x18 scale = decay.pow(-one.div(rate)); // per unit price compound (c = a^(-1/r))
      SD59x18 num = scale.pow(qDelta).sub(one); // c^q - 1
      SD59x18 den = scale.sub(one); // c - 1
      cost = cost.mul(num).div(den);
    }

    return cost.sdToWad();
  }
}
