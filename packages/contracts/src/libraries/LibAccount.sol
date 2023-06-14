// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { QueryFragment, QueryType } from "solecs/interfaces/Query.sol";
import { LibQuery } from "solecs/LibQuery.sol";
import { getAddressById, getComponentById, addressToEntity } from "solecs/utils.sol";

import { IsAccountComponent, ID as IsAccountCompID } from "components/IsAccountComponent.sol";
import { AddressOwnerComponent, ID as AddrOwnerCompID } from "components/AddressOwnerComponent.sol";
import { AddressOperatorComponent, ID as AddrOperatorCompID } from "components/AddressOperatorComponent.sol";
import { BlockLastComponent, ID as BlockLastCompID } from "components/BlockLastComponent.sol";
import { LocationComponent, ID as LocCompID } from "components/LocationComponent.sol";
import { NameComponent, ID as NameCompID } from "components/NameComponent.sol";
import { StaminaComponent, ID as StaminaCompID } from "components/StaminaComponent.sol";
import { StaminaCurrentComponent, ID as StaminaCurrCompID } from "components/StaminaCurrentComponent.sol";
import { TimeLastActionComponent, ID as TimeLastCompID } from "components/TimeLastActionComponent.sol";
import { LibConfig } from "libraries/LibConfig.sol";
import { LibRoom } from "libraries/LibRoom.sol";
import { LibDataEntity } from "libraries/LibDataEntity.sol";

uint256 constant STAMINA_RECOVERY_PERIOD = 300; // measured in blocks
uint256 constant BASE_STAMINA = 20;

library LibAccount {
  /////////////////
  // INTERACTIONS

  // Create an account account
  function create(
    IWorld world,
    IUintComp components,
    address ownerAddr,
    address operatorAddr
  ) internal returns (uint256) {
    uint256 id = world.getUniqueEntityId();
    IsAccountComponent(getAddressById(components, IsAccountCompID)).set(id);
    AddressOwnerComponent(getAddressById(components, AddrOwnerCompID)).set(id, ownerAddr);
    AddressOperatorComponent(getAddressById(components, AddrOperatorCompID)).set(id, operatorAddr);
    LocationComponent(getAddressById(components, LocCompID)).set(id, 1);

    uint256 baseStamina = LibConfig.getValueOf(components, "ACCOUNT_STAMINA_BASE");
    setStamina(components, id, baseStamina);
    setCurrStamina(components, id, baseStamina);
    setLastBlock(components, id, block.number);
    setLastTs(components, id, block.timestamp);
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
    uint256 timePassed = block.timestamp - getLastTs(components, id);
    uint256 recoveryPeriod = LibConfig.getValueOf(components, "ACCOUNT_STAMINA_RECOVERY_PERIOD");
    uint256 recoveredAmt = timePassed / recoveryPeriod;
    return recover(components, id, recoveredAmt);
  }

  // Update the BlockLast of the account. References the most recent block this Account transacted.
  function updateLastBlock(IUintComp components, uint256 id) internal {
    setLastBlock(components, id, block.number);
  }

  // Update the TimeLastAction of the account. Used to throttle world movement.
  function updateLastTs(IUintComp components, uint256 id) internal {
    setLastTs(components, id, block.timestamp);
  }

  /////////////////
  // GETTERS
  function getPetsMinted(IUintComp components, uint256 account) internal view returns (uint256) {
    return LibDataEntity.getAccountData(components, account, "NUM_MINTED");
  }

  /////////////////
  // SETTERS

  function setOperator(IUintComp components, uint256 id, address addr) internal {
    AddressOperatorComponent(getAddressById(components, AddrOperatorCompID)).set(id, addr);
  }

  function setLastBlock(IUintComp components, uint256 id, uint256 blockNum) internal {
    BlockLastComponent(getAddressById(components, BlockLastCompID)).set(id, blockNum);
  }

  function setLastTs(IUintComp components, uint256 id, uint256 ts) internal {
    TimeLastActionComponent(getAddressById(components, TimeLastCompID)).set(id, ts);
  }

  function setName(IUintComp components, uint256 id, string memory name) internal {
    NameComponent(getAddressById(components, NameCompID)).set(id, name);
  }

  function setStamina(IUintComp components, uint256 id, uint256 amt) internal {
    StaminaComponent(getAddressById(components, StaminaCompID)).set(id, amt);
  }

  function setCurrStamina(IUintComp components, uint256 id, uint256 amt) internal {
    StaminaCurrentComponent(getAddressById(components, StaminaCurrCompID)).set(id, amt);
  }

  function setPetsMinted(
    IWorld world,
    IUintComp components,
    uint256 account,
    uint256 value
  ) internal {
    uint256 dataID = LibDataEntity.getAccountDataEntity(components, account, "NUM_MINTED");
    if (dataID == 0) {
      dataID = LibDataEntity.createForAccount(world, components, account, "NUM_MINTED");
    }
    LibDataEntity.setForAccount(components, dataID, value);
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

  function getLastBlock(IUintComp components, uint256 id) internal view returns (uint256) {
    return BlockLastComponent(getAddressById(components, BlockLastCompID)).getValue(id);
  }

  function getLastTs(IUintComp components, uint256 id) internal view returns (uint256) {
    return TimeLastActionComponent(getAddressById(components, TimeLastCompID)).getValue(id);
  }

  // gets the location of a specified account account
  function getLocation(IUintComp components, uint256 id) internal view returns (uint256) {
    return LocationComponent(getAddressById(components, LocCompID)).getValue(id);
  }

  // get the address of an Account Operator
  function getOperator(IUintComp components, uint256 id) internal view returns (address) {
    return AddressOperatorComponent(getAddressById(components, AddrOperatorCompID)).getValue(id);
  }

  // get the address of an Account Owner
  function getOwner(IUintComp components, uint256 id) internal view returns (address) {
    return AddressOwnerComponent(getAddressById(components, AddrOwnerCompID)).getValue(id);
  }

  function getStamina(IUintComp components, uint256 id) internal view returns (uint256) {
    return StaminaComponent(getAddressById(components, StaminaCompID)).getValue(id);
  }

  function getCurrStamina(IUintComp components, uint256 id) internal view returns (uint256) {
    return StaminaCurrentComponent(getAddressById(components, StaminaCurrCompID)).getValue(id);
  }

  /////////////////
  // QUERIES

  // retrieves the pet with the specified name
  function getByName(
    IUintComp components,
    string memory name
  ) internal view returns (uint256 result) {
    QueryFragment[] memory fragments = new QueryFragment[](2);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsAccountCompID), "");
    fragments[1] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, NameCompID),
      abi.encode(name)
    );

    uint256[] memory results = LibQuery.query(fragments);
    if (results.length > 0) result = results[0];
  }

  // Get an account entity by Wallet address. Assume only 1.
  function getByOperator(
    IUintComp components,
    address operatorAddr
  ) internal view returns (uint256 result) {
    uint256[] memory results = _getAllX(components, operatorAddr, address(0), 0);
    if (results.length > 0) {
      result = results[0];
    }
  }

  // Get the account of an owner. Assume only 1.
  function getByOwner(
    IUintComp components,
    address ownerAddr
  ) internal view returns (uint256 result) {
    uint256[] memory results = _getAllX(components, address(0), ownerAddr, 0);
    if (results.length > 0) {
      result = results[0];
    }
  }

  // Get all account entities matching the specified filters.
  function _getAllX(
    IUintComp components,
    address operatorAddr,
    address ownerAddr,
    uint256 location
  ) internal view returns (uint256[] memory) {
    uint256 numFilters;
    if (operatorAddr != address(0)) numFilters++;
    if (ownerAddr != address(0)) numFilters++;
    if (location != 0) numFilters++;

    QueryFragment[] memory fragments = new QueryFragment[](numFilters + 1);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsAccountCompID), "");

    uint256 filterCount;
    if (operatorAddr != address(0)) {
      fragments[++filterCount] = QueryFragment(
        QueryType.HasValue,
        getComponentById(components, AddrOperatorCompID),
        abi.encode(operatorAddr)
      );
    }
    if (ownerAddr != address(0)) {
      fragments[++filterCount] = QueryFragment(
        QueryType.HasValue,
        getComponentById(components, AddrOwnerCompID),
        abi.encode(ownerAddr)
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
