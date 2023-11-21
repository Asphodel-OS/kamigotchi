// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { QueryFragment, QueryType } from "solecs/interfaces/Query.sol";
import { LibQuery } from "solecs/LibQuery.sol";
import { getAddressById, getComponentById, addressToEntity } from "solecs/utils.sol";

import { IsAccountComponent, ID as IsAccCompID } from "components/IsAccountComponent.sol";
import { IsPetComponent, ID as IsPetCompID } from "components/IsPetComponent.sol";
import { IdAccountComponent, ID as IdAccountCompID } from "components/IdAccountComponent.sol";
import { IndexAccountComponent, ID as IndexAccCompID } from "components/IndexAccountComponent.sol";
import { AddressOwnerComponent, ID as AddrOwnerCompID } from "components/AddressOwnerComponent.sol";
import { AddressOperatorComponent, ID as AddrOperatorCompID } from "components/AddressOperatorComponent.sol";
import { BlockLastComponent, ID as BlockLastCompID } from "components/BlockLastComponent.sol";
import { FavoriteFoodComponent, ID as FavFoodCompID } from "components/FavoriteFoodComponent.sol";
import { LocationComponent, ID as LocCompID } from "components/LocationComponent.sol";
import { NameComponent, ID as NameCompID } from "components/NameComponent.sol";
import { StaminaComponent, ID as StaminaCompID } from "components/StaminaComponent.sol";
import { StaminaCurrentComponent, ID as StaminaCurrCompID } from "components/StaminaCurrentComponent.sol";
import { TimeLastActionComponent, ID as TimeLastCompID } from "components/TimeLastActionComponent.sol";
import { TimeStartComponent, ID as TimeStartCompID } from "components/TimeStartComponent.sol";

import { LibCoin } from "libraries/LibCoin.sol";
import { LibConfig } from "libraries/LibConfig.sol";
import { LibDataEntity } from "libraries/LibDataEntity.sol";
import { LibInventory } from "libraries/LibInventory.sol";
import { LibMint20 } from "libraries/LibMint20.sol";
import { LibRoom } from "libraries/LibRoom.sol";

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
    IsAccountComponent(getAddressById(components, IsAccCompID)).set(id);
    IndexAccountComponent(getAddressById(components, IndexAccCompID)).set(id, getTotal(components));
    AddressOwnerComponent(getAddressById(components, AddrOwnerCompID)).set(id, ownerAddr);
    AddressOperatorComponent(getAddressById(components, AddrOperatorCompID)).set(id, operatorAddr);
    LocationComponent(getAddressById(components, LocCompID)).set(id, 1);
    TimeStartComponent(getAddressById(components, TimeStartCompID)).set(id, block.timestamp);

    uint256 baseStamina = LibConfig.getValueOf(components, "ACCOUNT_STAMINA_BASE");
    setStamina(components, id, baseStamina);
    setCurrStamina(components, id, baseStamina);
    updateLastBlock(components, id);
    updateLastTs(components, id);
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
    updateLastTs(components, id);
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

  // increase the balance of X (type+index) of an account
  function incBalanceOf(
    IWorld world,
    IUintComp components,
    uint256 id,
    string memory _type,
    uint256 index,
    uint256 amount
  ) public {
    uint256 inventoryID;
    if (LibString.eq(_type, "ITEM")) {
      inventoryID = LibInventory.get(components, id, index);
      if (inventoryID == 0) inventoryID = LibInventory.create(world, components, id, index);
      LibInventory.inc(components, inventoryID, amount);
      LibInventory.logIncItemTotal(world, components, id, index, amount);
    } else if (LibString.eq(_type, "MOD")) {
      inventoryID = LibInventory.getMod(components, id, index);
      if (inventoryID == 0) inventoryID = LibInventory.createMod(world, components, id, index);
      LibInventory.inc(components, inventoryID, amount);
    } else if (LibString.eq(_type, "GEAR")) {
      inventoryID = LibInventory.getGear(components, id, index);
      if (inventoryID == 0) inventoryID = LibInventory.createGear(world, components, id, index);
      LibInventory.inc(components, inventoryID, amount);
    } else if (LibString.eq(_type, "COIN")) {
      LibCoin.inc(components, id, amount);
    } else if (LibString.eq(_type, "MINT20")) {
      uint256 accountMinted = getMint20Minted(components, id);
      require(
        accountMinted + amount <= LibConfig.getValueOf(components, "MINT_ACCOUNT_MAX"),
        "Mint20Mint: account limit exceeded"
      );
      address to = getOwner(components, id);
      setMint20Minted(world, components, id, accountMinted + amount);
      LibMint20.mint(world, to, amount);
    } else {
      require(false, "LibAccount: unknown type");
    }
  }

  /////////////////
  // SETTERS

  function setOperator(IUintComp components, uint256 id, address addr) internal {
    AddressOperatorComponent(getAddressById(components, AddrOperatorCompID)).set(id, addr);
  }

  function setFavoriteFood(IUintComp components, uint256 id, string memory food) internal {
    FavoriteFoodComponent(getAddressById(components, FavFoodCompID)).set(id, food);
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

  function setMint20Minted(
    IWorld world,
    IUintComp components,
    uint256 account,
    uint256 value
  ) internal {
    LibDataEntity.setFor(world, components, account, 0, "MINT20_MINT", value);
  }

  /////////////////
  // CHECKS

  function isAccount(IUintComp components, uint256 id) internal view returns (bool) {
    return IsAccountComponent(getAddressById(components, IsAccCompID)).has(id);
  }

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

  function getName(IUintComp components, uint256 id) internal view returns (string memory) {
    return NameComponent(getAddressById(components, NameCompID)).getValue(id);
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

  function getPetsMinted(IUintComp components, uint256 id) internal view returns (uint256) {
    return LibDataEntity.get(components, id, 0, "PET721_MINT");
  }

  function getMint20Minted(IUintComp components, uint256 id) internal view returns (uint256) {
    return LibDataEntity.get(components, id, 0, "MINT20_MINT");
  }

  // get the balance of X (type+index) of an account
  function getBalanceOf(
    IUintComp components,
    uint256 id,
    string memory _type,
    uint256 index
  ) public view returns (uint256 balance) {
    uint256 inventoryID;

    if (LibString.eq(_type, "ITEM")) {
      inventoryID = LibInventory.get(components, id, index);
      balance = LibInventory.getBalance(components, inventoryID);
    } else if (LibString.eq(_type, "MOD")) {
      inventoryID = LibInventory.getMod(components, id, index);
      balance = LibInventory.getBalance(components, inventoryID);
    } else if (LibString.eq(_type, "GEAR")) {
      inventoryID = LibInventory.getGear(components, id, index);
      balance = LibInventory.getBalance(components, inventoryID);
    } else if (LibString.eq(_type, "COIN")) {
      balance = LibDataEntity.get(components, id, index, "COIN_TOTAL");
    } else if (LibString.eq(_type, "KAMI")) {
      balance = getPetsOwned(components, id).length;
    } else if (LibString.eq(_type, "ROOM")) {
      balance = getLocation(components, id);
    } else {
      require(false, "LibAccount: unknown type");
    }
  }

  /////////////////
  // QUERIES

  // Get the total number of accounts
  function getTotal(IUintComp components) internal view returns (uint256) {
    return getAll(components).length;
  }

  // retrieves the pet with the specified name
  function getByName(IUintComp components, string memory name) internal view returns (uint256) {
    QueryFragment[] memory fragments = new QueryFragment[](2);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsAccCompID), "");
    fragments[1] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, NameCompID),
      abi.encode(name)
    );

    uint256[] memory results = LibQuery.query(fragments);
    return (results.length > 0) ? results[0] : 0;
  }

  // Get an account entity by Wallet address. Assume only 1.
  function getByOperator(IUintComp components, address operator) internal view returns (uint256) {
    QueryFragment[] memory fragments = new QueryFragment[](2);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsAccCompID), "");
    fragments[1] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, AddrOperatorCompID),
      abi.encode(operator)
    );

    uint256[] memory results = LibQuery.query(fragments);
    return (results.length > 0) ? results[0] : 0;
  }

  // Get the account of an owner. Assume only 1.
  function getByOwner(IUintComp components, address owner) internal view returns (uint256) {
    QueryFragment[] memory fragments = new QueryFragment[](2);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsAccCompID), "");
    fragments[1] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, AddrOwnerCompID),
      abi.encode(owner)
    );

    uint256[] memory results = LibQuery.query(fragments);
    return (results.length > 0) ? results[0] : 0;
  }

  // Get pets owned
  function getPetsOwned(
    IUintComp components,
    uint256 accountID
  ) internal view returns (uint256[] memory) {
    QueryFragment[] memory fragments = new QueryFragment[](2);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsPetCompID), "");
    fragments[1] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, IdAccountCompID),
      abi.encode(accountID)
    );

    uint256[] memory results = LibQuery.query(fragments);
    return results;
  }

  // Get all accounts
  function getAll(IUintComp components) internal view returns (uint256[] memory) {
    QueryFragment[] memory fragments = new QueryFragment[](1);
    fragments[0] = QueryFragment(QueryType.Has, getComponentById(components, IsAccCompID), "");
    return LibQuery.query(fragments);
  }

  //////////////////
  // DATA LOGGING

  function logIncPetsMinted(
    IWorld world,
    IUintComp components,
    uint256 accountID,
    uint256 count
  ) internal {
    LibDataEntity.incFor(world, components, accountID, 0, "PET721_MINT", count);
  }

  function logIncPetsStaked(
    IWorld world,
    IUintComp components,
    uint256 accountID,
    uint256 count
  ) internal {
    LibDataEntity.incFor(world, components, accountID, 0, "PET_STAKE", count);
  }
}
