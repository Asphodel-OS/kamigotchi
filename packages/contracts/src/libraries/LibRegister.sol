// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { LibQuery, QueryFragment, QueryType } from "solecs/LibQuery.sol";
import { getAddrByID, getCompByID } from "solecs/utils.sol";

import { IdDelegateeComponent, ID as IdDelegateeCompID } from "components/IdDelegateeComponent.sol";
import { IdDelegatorComponent, ID as IdDelegatorCompID } from "components/IdDelegatorComponent.sol";
import { IsRegisterComponent, ID as IsRegisterCompID } from "components/IsRegisterComponent.sol";
import { StateComponent, ID as StateCompID } from "components/StateComponent.sol";

import { LibInventory, MUSU_INDEX } from "libraries/LibInventory.sol";
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
    IsRegisterComponent(getAddrByID(components, IsRegisterCompID)).set(id);
    IdDelegatorComponent(getAddrByID(components, IdDelegatorCompID)).set(id, delegatorID);
    IdDelegateeComponent(getAddrByID(components, IdDelegateeCompID)).set(id, delegateeID);
    StateComponent(getAddrByID(components, StateCompID)).set(id, string("ACTIVE"));
    return id;
  }

  /**
   * @notice Add an item or token balance to the specifed Register. The Delegator is determined
   * from the component value on the Register.
   */
  /// @return uint ID of the created (register) ItemInventory
  function addTo(
    IUintComp components,
    uint256 registerID,
    uint32 itemIndex,
    uint256 amt
  ) internal returns (uint256) {
    uint256 delegatorID = IdDelegatorComponent(getAddrByID(components, IdDelegatorCompID)).get(
      registerID
    );

    // token case, no ItemInventory entity created
    if (itemIndex == 0) {
      LibInventory.transferFor(components, delegatorID, registerID, MUSU_INDEX, amt);
      return 0;
    }

    // Get the item inventories of the register and delegator.
    // We don't care if the delegator's one doesn't exist as balance checks happen in LibInventory.
    uint256 fromInvID = LibInventory.get(components, delegatorID, itemIndex);
    uint256 toInvID = LibInventory.get(components, registerID, itemIndex);
    if (toInvID == 0) toInvID = LibInventory.create(components, registerID, itemIndex);

    // transfer the balance of item from delegator to the trade register
    LibInventory.transfer(components, fromInvID, toInvID, amt);
    return toInvID;
  }

  // Process the contents of a register from the register to the specified entity.
  function process(IUintComp components, uint256 id, bool reversed) internal {
    uint256 balance;
    uint32 itemIndex;
    uint256 toInvID;
    uint256 fromInvID;
    uint256 toID = (reversed) ? getDelegator(components, id) : getDelegatee(components, id);

    // Process each inventory associated with this register.
    uint256[] memory registerInventoryIDs = LibInventory.getAllForHolder(components, id);
    for (uint256 i; i < registerInventoryIDs.length; i++) {
      fromInvID = registerInventoryIDs[i];
      itemIndex = LibInventory.getItemIndex(components, fromInvID);

      toInvID = LibInventory.get(components, toID, itemIndex);
      if (toInvID == 0) {
        toInvID = LibInventory.create(components, toID, itemIndex);
      }

      balance = LibInventory.getBalance(components, fromInvID);
      LibInventory.transfer(components, fromInvID, toInvID, balance);
    }

    // Process token balance.
    balance = LibInventory.getBalanceOf(components, id, MUSU_INDEX);
    LibInventory.transferFor(components, id, toID, MUSU_INDEX, balance);
  }

  // Revert all inventory and token balances in a register back to the delegator of the register.
  function reverse(IUintComp components, uint256 id) internal {
    process(components, id, true);
    cancel(components, id);
  }

  /////////////////
  // COMPONENT SETTERS

  function confirm(IUintComp components, uint256 id) internal {
    StateComponent(getAddrByID(components, StateCompID)).set(id, string("CONFIRMED"));
  }

  function cancel(IUintComp components, uint256 id) internal {
    StateComponent(getAddrByID(components, StateCompID)).set(id, string("CANCELED"));
  }

  /////////////////
  // COMPONENT RETRIEVAL

  function getDelegatee(IUintComp components, uint256 id) internal view returns (uint256) {
    return IdDelegateeComponent(getAddrByID(components, IdDelegateeCompID)).get(id);
  }

  function getDelegator(IUintComp components, uint256 id) internal view returns (uint256) {
    return IdDelegatorComponent(getAddrByID(components, IdDelegatorCompID)).get(id);
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

    uint256 filterCount;
    if (delegatorID != 0) {
      fragments[filterCount++] = QueryFragment(
        QueryType.HasValue,
        getCompByID(components, IdDelegatorCompID),
        abi.encode(delegatorID)
      );
    }
    if (delegateeID != 0) {
      fragments[filterCount++] = QueryFragment(
        QueryType.HasValue,
        getCompByID(components, IdDelegateeCompID),
        abi.encode(delegateeID)
      );
    }
    if (!Strings.equal(state, "")) {
      fragments[filterCount++] = QueryFragment(
        QueryType.HasValue,
        getCompByID(components, StateCompID),
        abi.encode(state)
      );
    }

    fragments[filterCount] = QueryFragment(
      QueryType.Has,
      getCompByID(components, IsRegisterCompID),
      ""
    );

    return LibQuery.query(fragments);
  }
}
