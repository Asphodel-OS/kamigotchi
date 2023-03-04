// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IUint256Component } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { CoinComponent, ID as CoinComponentID } from "components/CoinComponent.sol";

library LibCoin {
  // gets the coin balance of an entity
  function get(IUint256Component components, uint256 entityID) internal view returns (uint256) {
    if (CoinComponent(getAddressById(components, CoinComponentID)).has(entityID)) {
      return CoinComponent(getAddressById(components, CoinComponentID)).getValue(entityID);
    } else {
      return 0;
    }
  }

  // transfers the specified coin amt from=>to entity
  function transfer(
    IUint256Component components,
    uint256 fromID,
    uint256 toID,
    uint256 amt
  ) internal {
    dec(components, fromID, amt);
    inc(components, toID, amt);
  }

  // increases the coin balance of an entity by amt
  function inc(
    IUint256Component components,
    uint256 entityID,
    uint256 amt
  ) internal {
    uint256 balance = get(components, entityID);
    _set(components, entityID, balance + amt);
  }

  // decreases the coin balance of an entity by amt
  function dec(
    IUint256Component components,
    uint256 entityID,
    uint256 amt
  ) internal {
    uint256 balance = get(components, entityID);
    require(balance >= amt, "Coin: insufficient balance");
    unchecked {
      _set(components, entityID, balance - amt);
    }
  }

  // sets the coin balance of an entity
  function _set(
    IUint256Component components,
    uint256 entityID,
    uint256 amt
  ) internal {
    CoinComponent(getAddressById(components, CoinComponentID)).set(entityID, amt);
  }
}
