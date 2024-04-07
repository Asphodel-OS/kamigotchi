// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { getAddressById } from "solecs/utils.sol";

import { CoinComponent, ID as CoinComponentID } from "components/CoinComponent.sol";

library LibCoin {
  // gets the coin balance of an entity
  function get(IUintComp components, uint256 entityID) public view returns (uint256) {
    if (CoinComponent(getAddressById(components, CoinComponentID)).has(entityID)) {
      return CoinComponent(getAddressById(components, CoinComponentID)).get(entityID);
    } else {
      return 0;
    }
  }

  // transfers the specified coin amt from=>to entity
  function transfer(IUintComp components, uint256 fromID, uint256 toID, uint256 amt) internal {
    CoinComponent comp = CoinComponent(getAddressById(components, CoinComponentID));

    // removing from
    uint256 fromBalance = comp.has(fromID) ? comp.get(fromID) : 0;
    require(fromBalance >= amt, "LibCoin: insufficient balance");
    comp.set(fromID, fromBalance - amt);

    // adding to
    if (!comp.has(toID)) comp.set(toID, amt);
    else comp.set(toID, comp.get(toID) + amt);
  }

  // increases the coin balance of an entity by amt
  function inc(IUintComp components, uint256 entityID, uint256 amt) internal {
    CoinComponent comp = CoinComponent(getAddressById(components, CoinComponentID));
    if (!comp.has(entityID)) comp.set(entityID, amt);
    else comp.set(entityID, comp.get(entityID) + amt);
  }

  // decreases the coin balance of an entity by amt
  function dec(IUintComp components, uint256 entityID, uint256 amt) internal {
    CoinComponent comp = CoinComponent(getAddressById(components, CoinComponentID));
    uint256 balance = comp.has(entityID) ? comp.get(entityID) : 0;
    require(balance >= amt, "Coin: insufficient balance");
    unchecked {
      comp.set(entityID, balance - amt);
    }
  }

  // sets the coin balance of an entity
  function _set(IUintComp components, uint256 entityID, uint256 amt) internal {
    CoinComponent(getAddressById(components, CoinComponentID)).set(entityID, amt);
  }
}
