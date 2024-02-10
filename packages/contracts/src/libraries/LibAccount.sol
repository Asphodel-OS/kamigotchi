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
import { FavoriteFoodComponent, ID as FavFoodCompID } from "components/FavoriteFoodComponent.sol";
import { IndexRoomComponent, ID as RoomCompID } from "components/IndexRoomComponent.sol";
import { NameComponent, ID as NameCompID } from "components/NameComponent.sol";
import { QuestPointComponent, ID as QuestPointCompID } from "components/QuestPointComponent.sol";
import { StaminaComponent, ID as StaminaCompID } from "components/StaminaComponent.sol";
import { StaminaCurrentComponent, ID as StaminaCurrCompID } from "components/StaminaCurrentComponent.sol";
import { TimeLastActionComponent, ID as TimeLastActCompID } from "components/TimeLastActionComponent.sol";
import { TimeLastComponent, ID as TimeLastCompID } from "components/TimeLastComponent.sol";
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
    IndexRoomComponent(getAddressById(components, RoomCompID)).set(id, 1);
    TimeStartComponent(getAddressById(components, TimeStartCompID)).set(id, block.timestamp);

    uint256 baseStamina = LibConfig.getValueOf(components, "ACCOUNT_STAMINA_BASE");
    setStamina(components, id, baseStamina);
    setCurrStamina(components, id, baseStamina);
    updateLastActionTs(components, id);
    updateLastTs(components, id);
    return id;
  }

  // Move the Account to a room
  function move(IUintComp components, uint256 id, uint256 to) internal {
    StaminaCurrentComponent currStaminaComp = StaminaCurrentComponent(
      getAddressById(components, StaminaCurrCompID)
    );
    currStaminaComp.set(id, currStaminaComp.getValue(id) - 1);
    IndexRoomComponent(getAddressById(components, RoomCompID)).set(id, to);
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
    uint256 timePassed = block.timestamp - getLastActionTs(components, id);
    uint256 recoveryPeriod = LibConfig.getValueOf(components, "ACCOUNT_STAMINA_RECOVERY_PERIOD");
    uint256 recoveredAmt = timePassed / recoveryPeriod;
    updateLastActionTs(components, id);
    return recover(components, id, recoveredAmt);
  }

  // Update the TimeLastAction of the account. Used to throttle world movement.
  function updateLastActionTs(IUintComp components, uint256 id) internal {
    setLastActionTs(components, id, block.timestamp);
  }

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
    } else if (LibString.eq(_type, "QUEST_POINTS")) {
      setQuestPoints(components, id, getQuestPoints(components, id) + amount);
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

  function setLastActionTs(IUintComp components, uint256 id, uint256 ts) internal {
    TimeLastActionComponent(getAddressById(components, TimeLastActCompID)).set(id, ts);
  }

  function setLastTs(IUintComp components, uint256 id, uint256 ts) internal {
    TimeLastComponent(getAddressById(components, TimeLastCompID)).set(id, ts);
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

  function setQuestPoints(IUintComp components, uint256 id, uint256 amt) internal {
    QuestPointComponent(getAddressById(components, QuestPointCompID)).set(id, amt);
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

  // Check whether an Account shares RoomIndex with another entity.
  function sharesRoom(
    IUintComp components,
    uint256 id,
    uint256 entityID
  ) internal view returns (bool) {
    IndexRoomComponent locComp = IndexRoomComponent(getAddressById(components, RoomCompID));
    return locComp.getValue(id) == locComp.getValue(entityID);
  }

  /////////////////
  // GETTERS

  function getLastActionTs(IUintComp components, uint256 id) internal view returns (uint256) {
    return TimeLastActionComponent(getAddressById(components, TimeLastActCompID)).getValue(id);
  }

  function getLastTs(IUintComp components, uint256 id) internal view returns (uint256) {
    return TimeLastComponent(getAddressById(components, TimeLastCompID)).getValue(id);
  }

  // gets the roomIndex of a specified account account
  function getRoom(IUintComp components, uint256 id) internal view returns (uint256) {
    return IndexRoomComponent(getAddressById(components, RoomCompID)).getValue(id);
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

  function getQuestPoints(IUintComp components, uint256 id) internal view returns (uint256) {
    QuestPointComponent comp = QuestPointComponent(getAddressById(components, QuestPointCompID));
    if (comp.has(id)) return comp.getValue(id);
    else return 0;
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
      balance = getRoom(components, id);
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

  function logIncPetsRerolled(
    IWorld world,
    IUintComp components,
    uint256 accountID,
    uint256 count
  ) internal {
    LibDataEntity.incFor(world, components, accountID, 0, "PET_REROLL", count);
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
