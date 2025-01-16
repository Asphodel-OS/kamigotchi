// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { SD59x18 } from "prb-math/SD59x18.sol";
import { UD60x18 } from "prb-math/UD60x18.sol";
import { LibFPConverter } from "libraries/utils/LibFPConverter.sol";

struct GDAParams {
  uint256 targetPrice;
  uint256 startTs;
  int256 scale;
  int256 decay;
  uint256 prevSold;
  uint256 quantity;
}

/// @notice an assortment of curve calculations
library LibCurve {
  using LibFPConverter for SD59x18;
  using LibFPConverter for UD60x18;
  using LibFPConverter for int256;
  using LibFPConverter for uint256;

  /// @notice calculate discrete GDA for a given set of parameters
  /// @param params (noted below)
  /// - targetPrice (1e0) target price
  /// - startTs (1e0) timestamp of auction start
  /// - scale (1e18) scale factor
  /// - decay (1e18) decay constant
  /// - prevSold (1e0) previous amount sold
  /// - quantity (1e0) amount to be sold
  /// @return (1e18) total cost
  function calcGDA(GDAParams memory params) public view returns (int256) {
    SD59x18 qDelta = params.quantity.rawToSD();
    SD59x18 qInitial = params.prevSold.rawToSD();
    SD59x18 pTarget = params.targetPrice.rawToSD();
    SD59x18 tDelta = block.timestamp.rawToSD() - params.startTs.rawToSD();
    SD59x18 scaleFactor = params.scale.rawToSD();
    SD59x18 decayConstant = params.decay.rawToSD();

    SD59x18 num1 = pTarget.mul(scaleFactor.pow(qInitial));
    SD59x18 num2 = scaleFactor.pow(qDelta) - int256(1).rawToSD();
    SD59x18 den1 = decayConstant.mul(tDelta).exp();
    SD59x18 den2 = scaleFactor - int256(1).rawToSD();
    SD59x18 totalCost = num1.mul(num2).div(den1.mul(den2));

    return totalCost.sdToWad();
  }
}
