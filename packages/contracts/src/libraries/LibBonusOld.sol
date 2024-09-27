// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID, getCompByID } from "solecs/utils.sol";

import { ValueSignedComponent as SignedValComp, ID as SignedValCompID } from "components/ValueSignedComponent.sol";
import { IdHolderComponent, ID as IdHolderCompID } from "components/IdHolderComponent.sol";
import { TypeComponent, ID as TypeCompID } from "components/TypeComponent.sol";

import { LibStat } from "libraries/LibStat.sol";

/**
 * @notice Library for managing bonuses - modifiers that affect specific calcs
 */
library LibBonusOld {
  /////////////////
  // INTERACTIONS

  function inc(IUintComp components, uint256 holderID, string memory type_, int256 amt) internal {
    uint256 id = genID(holderID, type_);
    SignedValComp comp = SignedValComp(getAddrByID(components, SignedValCompID));
    int256 curr = comp.has(id) ? comp.get(id) : int256(0);
    comp.set(id, curr + amt);
  }

  function dec(IUintComp components, uint256 holderID, string memory type_, int256 amt) internal {
    uint256 id = genID(holderID, type_);
    SignedValComp comp = SignedValComp(getAddrByID(components, SignedValCompID));
    int256 curr = comp.has(id) ? comp.get(id) : int256(0);
    comp.set(id, curr - amt);
  }

  /////////////////
  // GETTERS

  /// @notice gets a bonus in percent form. default is 1000 (100.0%)
  function getPercent(
    IUintComp components,
    uint256 holderID,
    string memory type_
  ) internal view returns (uint256) {
    int256 bonus = getRaw(components, holderID, type_);
    if (bonus == 0) return 1000;
    // max change is 0.1%
    else if (bonus <= -1000) return 1;
    else return uint256(1000 + bonus); // overflow alr checked
  }

  /// @notice adjust base value based on bonus
  function processBonus(
    IUintComp components,
    uint256 holderID,
    string memory type_,
    uint256 base
  ) internal view returns (uint256) {
    int256 bonus = getRaw(components, holderID, type_);
    return calcSigned(base, bonus);
  }

  function getRaw(
    IUintComp components,
    uint256 holderID,
    string memory type_
  ) internal view returns (int256) {
    uint256 id = genID(holderID, type_);
    SignedValComp comp = SignedValComp(getAddrByID(components, SignedValCompID));
    return comp.has(id) ? comp.get(id) : int256(0);
  }

  //////////////
  // UTILS

  function genID(uint256 holderID, string memory type_) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("bonus", holderID, type_)));
  }

  /// @notice handles a custom signed/unsigned calculation
  /// @dev recieves the signed bonus value, calculates, and spits out unsigned for other systems
  function calcSigned(uint256 base, int256 bonus) internal pure returns (uint256) {
    // avoid converting base in case of overflow
    if (bonus == 0) return base;
    if (bonus > 0) return base + uint256(bonus);

    uint256 delta = uint256(-bonus);
    return (delta >= base) ? 0 : base - delta;
  }
}
