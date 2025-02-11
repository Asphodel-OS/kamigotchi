// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { SD59x18 } from "prb-math/SD59x18.sol";
import { UD60x18 } from "prb-math/UD60x18.sol";
import { LibFPConverter } from "libraries/utils/LibFPConverter.sol";

struct Params {
  uint256 targetPrice; // 1e0 precision
  uint256 startTs; // 1e0 precision
  int256 scale; // 1e18 precision
  int256 decay; // 1e18 precision
  uint256 prevSold; // 1e0 precision
  uint256 quantity; // 1e0 precision (amt to be sold)
}

struct Params2 {
  uint256 targetPrice; // 1e0 precision
  uint256 startTs; // 1e0 precision
  uint256 period; // 1e0 precision (seconds)
  uint256 decay; // 1e18 precision (pre-scaled up from 1e6)
  uint256 rate; // 1e0 precision
  uint256 prevSold; // 1e0 precision
  uint256 quantity; // 1e0 precision (amt to be sold)
}

/// @notice an assortment for operations around GDAs
library LibGDA {
  using LibFPConverter for SD59x18;
  using LibFPConverter for UD60x18;
  using LibFPConverter for int256;
  using LibFPConverter for uint256;

  /// @notice calculate discrete GDA for a given set of parameters
  /// @dev this function is prone to overflow but is here until we replace the current
  /// listing buy/sell system calcs with the update VRGDA calcs
  /// @param params (noted in GDAParams struct)
  /// @return (1e18) total cost
  function calc(Params memory params) public view returns (int256) {
    SD59x18 qDelta = params.quantity.rawToSD();
    SD59x18 qInitial = params.prevSold.rawToSD();
    SD59x18 pTarget = params.targetPrice.rawToSD();
    SD59x18 tDelta = block.timestamp.rawToSD() - params.startTs.rawToSD();
    SD59x18 scaleFactor = params.scale.wadToSD();
    SD59x18 decayConstant = params.decay.wadToSD();

    SD59x18 num1 = pTarget.mul(scaleFactor.pow(qInitial));
    SD59x18 num2 = scaleFactor.pow(qDelta) - int256(1).rawToSD();
    SD59x18 den1 = decayConstant.mul(tDelta).exp();
    SD59x18 den2 = scaleFactor - int256(1).rawToSD();
    SD59x18 totalCost = num1.mul(num2).div(den1.mul(den2));

    return totalCost.sdToWad();
  }

  /// @notice calculate the perpetual discrete GDA for a set of inputs
  function calcPerpetual(Params2 memory params) public view returns (int256) {
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
