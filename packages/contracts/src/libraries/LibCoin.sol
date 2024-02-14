// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { getAddressById } from "solecs/utils.sol";

import { CoinComponent, ID as CoinComponentID } from "components/CoinComponent.sol";

library LibCoin {
  // gets the coin balance of an entity
  function get(IUintComp components, uint256 entityID) public view returns (uint256) {
    if (CoinComponent(getAddressById(components, CoinComponentID)).has(entityID)) {
      return CoinComponent(getAddressById(components, CoinComponentID)).getValue(entityID);
    } else {
      return 0;
    }
  }

  // transfers the specified coin amt from=>to entity
  function transfer(IUintComp components, uint256 fromID, uint256 toID, uint256 amt) internal {
    dec(components, fromID, amt);
    inc(components, toID, amt);
  }

  // increases the coin balance of an entity by amt
  function inc(IUintComp components, uint256 entityID, uint256 amt) public {
    CoinComponent comp = CoinComponent(getAddressById(components, CoinComponentID));
    if (!comp.has(entityID)) comp.set(entityID, amt);
    else comp.set(entityID, comp.getValue(entityID) + amt);
  }

  // decreases the coin balance of an entity by amt
  function dec(IUintComp components, uint256 entityID, uint256 amt) internal {
    CoinComponent comp = CoinComponent(getAddressById(components, CoinComponentID));
    uint256 balance = comp.has(entityID) ? comp.getValue(entityID) : 0;
    require(balance >= amt, "Coin: insufficient balance");
    unchecked {
      comp.set(entityID, balance - amt);
    }
  }

  // sets the coin balance of an entity
  function _set(IUintComp components, uint256 entityID, uint256 amt) public {
    CoinComponent(getAddressById(components, CoinComponentID)).set(entityID, amt);
  }
}
