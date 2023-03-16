// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { QueryFragment, QueryType } from "solecs/interfaces/Query.sol";
import { LibQuery } from "solecs/LibQuery.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";

import { IdDelegateeComponent, ID as IdDelegateeCompID } from "components/IdDelegateeComponent.sol";
import { IdDelegatorComponent, ID as IdDelegatorCompID } from "components/IdDelegatorComponent.sol";
import { IsRegisterComponent, ID as IsRegisterCompID } from "components/IsRegisterComponent.sol";
import { StateComponent, ID as StateCompID } from "components/StateComponent.sol";
import { LibCoin } from "libraries/LibCoin.sol";
import { LibInventory } from "libraries/LibInventory.sol";
import { Strings } from "utils/Strings.sol";

// A Register is an intermediary for a list of items being delegated from one entity to
// another (from delegator, to delegatee). This entity anchors a list of inventory slots.
// The actual data mapping goes from Inventory => Register, where IdAccount = registerID.
// In the example of Trade, the Trade entity is the Delegatee, while the Account entity
// adding to the trade is the Delegator.
// @dev State = [ ACTIVE | CONFIRMED | CANCELED ]
// TODO: generalize LibInventory ownership component (currently IdAccountComponent).
library LibRegister {
  /////////////////
  // INTERACTIONS

  // Create a register.
  function create(
    IWorld world,
    IUintComp components,
    uint256 delegatorID, // assignor
    uint256 delegateeID // assignee
  ) internal returns (uint256) {
    uint256 id = world.getUniqueEntityId();
    IsRegisterComponent(getAddressById(components, IsRegisterCompID)).set(id);
    IdDelegatorComponent(getAddressById(components, IdDelegatorCompID)).set(id, delegatorID);
    IdDelegateeComponent(getAddressById(components, IdDelegateeCompID)).set(id, delegateeID);
    StateComponent(getAddressById(components, StateCompID)).set(id, string("ACTIVE"));
    return id;
  }

  // Add an item or token balance to the specifed Register. The Delegator is determined
  // from the component value on the Register.
  // @return uint ID of the created (register) ItemInventory
  function addTo(
    IWorld world,
    IUintComp components,
    uint256 id,
    uint256 itemIndex,
    uint256 amt
  ) internal returns (uint256) {
    uint256 delegatorID = IdDelegatorComponent(getAddressById(components, IdDelegatorCompID))
      .getValue(id);

    // token case, no ItemInventory entity created
    if (itemIndex == 0) {
      LibCoin.transfer(components, delegatorID, id, amt);
      return 0;
    }

    // Get the item inventories of the register and delegator.
    // We don't care if the delegator's one doesn't exist as balance checks happen in LibInventory.
    uint256 fromInventoryID = LibInventory.get(components, delegatorID, itemIndex);
    uint256 toInventoryID = LibInventory.get(components, id, itemIndex);
    if (toInventoryID == 0) {
      toInventoryID = LibInventory.create(world, components, id, itemIndex);
    }

    // transfer the balance of item from delegator to the trade register
    LibInventory.transfer(components, fromInventoryID, toInventoryID, amt);
    return toInventoryID;
  }

  // Process the contents of a register from the register to the specified entity.
  function process(IWorld world, IUintComp components, uint256 id, bool reversed) internal {
    uint256 balance;
    uint256 itemIndex;
    uint256 toInventoryID;
    uint256 fromInventoryID;
    uint256 toID = (reversed) ? getDelegator(components, id) : getDelegatee(components, id);

    // Process each inventory associated with this register.
    uint256[] memory registerInventoryIDs = LibInventory.getAllForHolder(components, id);
    for (uint256 i; i < registerInventoryIDs.length; i++) {
      fromInventoryID = registerInventoryIDs[i];
      itemIndex = LibInventory.getItemIndex(components, fromInventoryID);

      toInventoryID = LibInventory.get(components, toID, itemIndex);
      if (toInventoryID == 0) {
        toInventoryID = LibInventory.create(world, components, toID, itemIndex);
      }

      balance = LibInventory.getBalance(components, fromInventoryID);
      LibInventory.transfer(components, fromInventoryID, toInventoryID, balance);
    }

    // Process token balance.
    balance = LibCoin.get(components, id);
    LibCoin.transfer(components, id, toID, balance);
  }

  // Revert all inventory and token balances in a register back to the delegator of the register.
  function reverse(IWorld world, IUintComp components, uint256 id) internal {
    process(world, components, id, true);
    cancel(components, id);
  }

  /////////////////
  // COMPONENT SETTERS

  function confirm(IUintComp components, uint256 id) internal {
    StateComponent(getAddressById(components, StateCompID)).set(id, string("CONFIRMED"));
  }

  function cancel(IUintComp components, uint256 id) internal {
    StateComponent(getAddressById(components, StateCompID)).set(id, string("CANCELED"));
  }

  /////////////////
  // COMPONENT RETRIEVAL

  function getDelegatee(IUintComp components, uint256 id) internal view returns (uint256) {
    return IdDelegateeComponent(getAddressById(components, IdDelegateeCompID)).getValue(id);
  }

  function getDelegator(IUintComp components, uint256 id) internal view returns (uint256) {
    return IdDelegatorComponent(getAddressById(components, IdDelegatorCompID)).getValue(id);
  }

  /////////////////
  // QUERIES

  // Get the active register for a delegator, delegatee combo. Assume only 1
  function get(
    IUintComp components,
    uint256 delegatorID,
    uint256 delegateeID
  ) internal view returns (uint256 result) {
    uint256[] memory results = _getAllX(components, delegatorID, delegateeID, "");
    if (results.length != 0) {
      result = results[0];
    }
  }

  // Retrieves all registers based on any defined filters
  function _getAllX(
    IUintComp components,
    uint256 delegatorID,
    uint256 delegateeID,
    string memory state
  ) internal view returns (uint256[] memory) {
    uint256 numFilters;
    if (delegatorID != 0) numFilters++;
    if (delegateeID != 0) numFilters++;
    if (!Strings.equal(state, "")) numFilters++;

    QueryFragment[] memory fragments = new QueryFragment[](numFilters + 1);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsRegisterCompID), "");

    uint256 filterCount;
    if (delegatorID != 0) {
      fragments[++filterCount] = QueryFragment(
        QueryType.HasValue,
        getComponentById(components, IdDelegatorCompID),
        abi.encode(delegatorID)
      );
    }
    if (delegateeID != 0) {
      fragments[++filterCount] = QueryFragment(
        QueryType.HasValue,
        getComponentById(components, IdDelegateeCompID),
        abi.encode(delegateeID)
      );
    }
    if (!Strings.equal(state, "")) {
      fragments[++filterCount] = QueryFragment(
        QueryType.HasValue,
        getComponentById(components, StateCompID),
        abi.encode(state)
      );
    }

    return LibQuery.query(fragments);
  }
}
