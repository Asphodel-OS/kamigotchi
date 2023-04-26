// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { QueryFragment, QueryType } from "solecs/interfaces/Query.sol";
import { LibQuery } from "solecs/LibQuery.sol";
import { getAddressById, getComponentById, addressToEntity } from "solecs/utils.sol";

import { IdOwnerComponent, ID as IdOwnerCompID } from "components/IdOwnerComponent.sol";
import { IsAccountComponent, ID as IsAccountCompID } from "components/IsAccountComponent.sol";
import { AddressOperatorComponent, ID as AddrOperatorCompID } from "components/AddressOperatorComponent.sol";
import { BlockLastComponent, ID as BlockLastCompID } from "components/BlockLastComponent.sol";
import { LocationComponent, ID as LocCompID } from "components/LocationComponent.sol";
import { NameComponent, ID as NameCompID } from "components/NameComponent.sol";
import { StaminaComponent, ID as StaminaCompID } from "components/StaminaComponent.sol";
import { StaminaCurrentComponent, ID as StaminaCurrCompID } from "components/StaminaCurrentComponent.sol";
import { LibRoom } from "libraries/LibRoom.sol";

uint256 constant STAMINA_RECOVERY_PERIOD = 10; // measured in blocks
uint256 constant BASE_STAMINA = 20;

library LibAccount {
  /////////////////
  // INTERACTIONS

  // Create an account account
  function create(
    IWorld world,
    IUintComp components,
    address operatorAddr,
    address ownerAddr
  ) internal returns (uint256) {
    uint256 id = world.getUniqueEntityId();
    IsAccountComponent(getAddressById(components, IsAccountCompID)).set(id);
    IdOwnerComponent(getAddressById(components, IdOwnerCompID)).set(id, addressToEntity(ownerAddr));
    LocationComponent(getAddressById(components, LocCompID)).set(id, 1);
    AddressOperatorComponent(getAddressById(components, AddrOperatorCompID)).set(id, operatorAddr);
    StaminaComponent(getAddressById(components, StaminaCompID)).set(id, BASE_STAMINA);
    StaminaCurrentComponent(getAddressById(components, StaminaCurrCompID)).set(id, BASE_STAMINA);
    BlockLastComponent(getAddressById(components, BlockLastCompID)).set(id, block.number);
    return id;
  }

  // Move the Account to a room
  function move(IUintComp components, uint256 id, uint256 to) internal {
    setCurrStamina(components, id, getCurrStamina(components, id) - 1);
    LocationComponent(getAddressById(components, LocCompID)).set(id, to);
  }

  // Recover's stamina to an account
  function recover(IUintComp components, uint256 id, uint256 amt) internal returns (uint256) {
    uint256 totalStamina = getStamina(components, id);
    uint256 stamina = getCurrStamina(components, id) + amt;
    if (stamina > totalStamina) stamina = totalStamina;
    setCurrStamina(components, id, stamina);
    return stamina;
  }

  // syncs the stamina of an account. rounds down, ruthlessly
  function syncStamina(IUintComp components, uint256 id) internal returns (uint256) {
    uint256 blockDiff = block.number - getLastBlock(components, id); // block duration since last action
    uint256 recoveredAmt = blockDiff / STAMINA_RECOVERY_PERIOD;
    return recover(components, id, recoveredAmt);
  }

  // Update the BlockLast of an entity. Used to track the block in which an Account last interacted.
  function updateLastBlock(IUintComp components, uint256 id) internal {
    setLastBlock(components, id, block.number);
  }

  /////////////////
  // SETTERS

  function setAddress(IUintComp components, uint256 id, address addr) internal {
    AddressOperatorComponent(getAddressById(components, AddrOperatorCompID)).set(id, addr);
  }

  function setLastBlock(IUintComp components, uint256 id, uint256 blockNum) internal {
    BlockLastComponent(getAddressById(components, BlockLastCompID)).set(id, blockNum);
  }

  function setName(IUintComp components, uint256 id, string memory name) internal {
    NameComponent(getAddressById(components, NameCompID)).set(id, name);
  }

  function setCurrStamina(IUintComp components, uint256 id, uint256 amt) internal {
    StaminaCurrentComponent(getAddressById(components, StaminaCurrCompID)).set(id, amt);
  }

  /////////////////
  // CHECKS

  // Check whether an Account can move to a Location from where they currently are.
  // This function assumes that the id provided belongs to an Account.
  // NOTE(ja): This function can include any other checks we want moving forward.
  function canMoveTo(IUintComp components, uint256 id, uint256 to) internal view returns (bool) {
    uint256 from = getLocation(components, id);
    return LibRoom.isValidPath(components, from, to);
  }

  // Check whether an Account shares Location with another entity.
  function sharesLocation(
    IUintComp components,
    uint256 id,
    uint256 entityID
  ) internal view returns (bool) {
    return getLocation(components, id) == getLocation(components, entityID);
  }

  /////////////////
  // GETTERS

  // get the address of an account
  function getAddress(IUintComp components, uint256 id) internal view returns (address) {
    return AddressOperatorComponent(getAddressById(components, AddrOperatorCompID)).getValue(id);
  }

  function getLastBlock(IUintComp components, uint256 id) internal view returns (uint256) {
    return BlockLastComponent(getAddressById(components, BlockLastCompID)).getValue(id);
  }

  // gets the location of a specified account account
  function getLocation(IUintComp components, uint256 id) internal view returns (uint256) {
    return LocationComponent(getAddressById(components, LocCompID)).getValue(id);
  }

  // gets the OwnerID (address) of a specified account account as a uint
  function getOwner(IUintComp components, uint256 id) internal view returns (uint256) {
    return IdOwnerComponent(getAddressById(components, IdOwnerCompID)).getValue(id);
  }

  function getStamina(IUintComp components, uint256 id) internal view returns (uint256) {
    return StaminaComponent(getAddressById(components, StaminaCompID)).getValue(id);
  }

  function getCurrStamina(IUintComp components, uint256 id) internal view returns (uint256) {
    return StaminaCurrentComponent(getAddressById(components, StaminaCurrCompID)).getValue(id);
  }

  /////////////////
  // QUERIES

  // Get an account entity by Wallet address. Assume only 1.
  function getByAddress(
    IUintComp components,
    address wallet
  ) internal view returns (uint256 result) {
    uint256[] memory results = _getAllX(components, wallet, 0, 0);
    if (results.length > 0) {
      result = results[0];
    }
  }

  // Get the account of an owner. Assume only 1.
  function getByOwner(
    IUintComp components,
    uint256 ownerID
  ) internal view returns (uint256 result) {
    uint256[] memory results = _getAllX(components, address(0), ownerID, 0);
    if (results.length > 0) {
      result = results[0];
    }
  }

  // Get the account of an owner by the owner's address. Assume only 1.
  function getByOwner(IUintComp components, address owner) internal view returns (uint256) {
    return getByOwner(components, addressToEntity(owner));
  }

  // Get all account entities matching the specified filters.
  function _getAllX(
    IUintComp components,
    address wallet,
    uint256 ownerID,
    uint256 location
  ) internal view returns (uint256[] memory) {
    uint256 numFilters;
    if (wallet != address(0)) numFilters++;
    if (ownerID != 0) numFilters++;
    if (location != 0) numFilters++;

    QueryFragment[] memory fragments = new QueryFragment[](numFilters + 1);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsAccountCompID), "");

    uint256 filterCount;
    if (wallet != address(0)) {
      fragments[++filterCount] = QueryFragment(
        QueryType.HasValue,
        getComponentById(components, AddrOperatorCompID),
        abi.encode(wallet)
      );
    }
    if (ownerID != 0) {
      fragments[++filterCount] = QueryFragment(
        QueryType.HasValue,
        getComponentById(components, IdOwnerCompID),
        abi.encode(ownerID)
      );
    }
    if (location != 0) {
      fragments[++filterCount] = QueryFragment(
        QueryType.HasValue,
        getComponentById(components, LocCompID),
        abi.encode(location)
      );
    }

    return LibQuery.query(fragments);
  }
}
