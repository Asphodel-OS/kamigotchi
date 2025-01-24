// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
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

struct CompoundParams {
  uint256 targetPrice; // 1e0 precision
  int256 scale; // 1e18 precision
  uint256 quantity; // 1e0 precision (amt to be sold)
}

/// @notice an assortment for operations around GDAs
library LibGDA {
  using LibFPConverter for SD59x18;
  using LibFPConverter for UD60x18;
  using LibFPConverter for int256;
  using LibFPConverter for uint256;

  /// @notice calculate discrete GDA for a given set of parameters
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

  /// @notice calculate compounding factor of the GDA for a given set of parameters
  /// @dev this is used to determine whether we should reset the GDA
  function calcCompound(CompoundParams memory params) public pure returns (int256) {
    SD59x18 quantity = params.quantity.rawToSD();
    SD59x18 pTarget = params.targetPrice.rawToSD();
    SD59x18 scaleFactor = params.scale.wadToSD();

    SD59x18 compound = scaleFactor.pow(quantity).mul(pTarget);
    return compound.sdToWad();
  }
}
