// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.19;

import { SD59x18, sd, intoInt256 } from "prb-math/SD59x18.sol";
import { UD60x18, ud, intoUint256 } from "prb-math/UD60x18.sol";
import { SafeCastLib } from "solady/utils/SafeCastLib.sol";

// an interface pattern library for converting between standard types and
// prb-math's sd and ud types. used to clean up syntax with the 'using' keyword
library LibFPConverter {
  using SafeCastLib for int256;
  using SafeCastLib for uint256;

  /////////////////
  // SIGNED CONVERTERS

  // convert a raw int256 to a SD59x18 type
  function rawToSD(int256 x) internal pure returns (SD59x18) {
    return sd(x * 1e18);
  }

  // convert a wad (1e18) int256 to a SD59x18 type
  function wadToSD(int256 x) internal pure returns (SD59x18) {
    return sd(x);
  }

  // convert a raw int256 to a UD60x18 type
  function rawToUD(int256 x) internal pure returns (UD60x18) {
    return ud(x.toUint256() * 1e18);
  }

  // convert a wad (1e18) int256 to a UD60x18 type
  function wadToUD(int256 x) internal pure returns (UD60x18) {
    return ud(x.toUint256());
  }

  // convert a SD59x18 to a wad int256
  function sdToWad(SD59x18 x) internal pure returns (int256) {
    return intoInt256(x);
  }

  /////////////////
  // UNSIGNED CONVERTERS

  // convert a raw uint256 to a SD59x18 type
  function rawToSD(uint256 x) internal pure returns (SD59x18) {
    return sd(x.toInt256() * 1e18);
  }

  // convert a wad (1e18) uint256 to a SD59x18 type
  function wadToSD(uint256 x) internal pure returns (SD59x18) {
    return sd(x.toInt256());
  }

  // convert a raw uint256 to a UD60x18 type
  function rawToUD(uint256 x) internal pure returns (UD60x18) {
    return ud(x * 1e18);
  }

  // convert a wad (1e18) uint256 to a UD60x18 type
  function wadToUD(uint256 x) internal pure returns (UD60x18) {
    return ud(x);
  }

  // convert a UD60x18 to a wad uint256
  function udToWad(UD60x18 x) internal pure returns (uint256) {
    return intoUint256(x);
  }
}
