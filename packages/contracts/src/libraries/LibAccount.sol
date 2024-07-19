// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { LibQuery, QueryFragment, QueryType } from "solecs/LibQuery.sol";
import { getAddressById, getComponentById, addressToEntity } from "solecs/utils.sol";
import { Stat } from "components/types/Stat.sol";

import { IsAccountComponent, ID as IsAccCompID } from "components/IsAccountComponent.sol";
import { IDOwnsPetComponent, ID as IDOwnsPetCompID } from "components/IDOwnsPetComponent.sol";
import { IndexAccountComponent, ID as IndexAccCompID } from "components/IndexAccountComponent.sol";
import { FarcasterIndexComponent, ID as FarcarsterIndexCompID } from "components/FarcasterIndexComponent.sol";
import { AddressOwnerComponent, ID as AddrOwnerCompID } from "components/AddressOwnerComponent.sol";
import { AddressOperatorComponent, ID as AddrOperatorCompID } from "components/AddressOperatorComponent.sol";
import { CacheOperatorComponent, ID as CacheOperatorCompID } from "components/CacheOperatorComponent.sol";
import { IndexRoomComponent, ID as RoomCompID } from "components/IndexRoomComponent.sol";
import { LevelComponent, ID as LevelCompID } from "components/LevelComponent.sol";
import { MediaURIComponent, ID as MediaURICompID } from "components/MediaURIComponent.sol";
import { NameComponent, ID as NameCompID } from "components/NameComponent.sol";
import { StaminaComponent, ID as StaminaCompID } from "components/StaminaComponent.sol";
import { TimeLastActionComponent, ID as TimeLastActCompID } from "components/TimeLastActionComponent.sol";
import { TimeLastComponent, ID as TimeLastCompID } from "components/TimeLastComponent.sol";
import { TimeStartComponent, ID as TimeStartCompID } from "components/TimeStartComponent.sol";

import { LibConfig } from "libraries/LibConfig.sol";
import { LibData } from "libraries/LibData.sol";
import { LibFactions } from "libraries/LibFactions.sol";
import { LibInventory } from "libraries/LibInventory.sol";
import { LibItemRegistry } from "libraries/LibItemRegistry.sol";
import { LibMint20 } from "libraries/LibMint20.sol";
import { LibRoom } from "libraries/LibRoom.sol";
import { LibStat } from "libraries/LibStat.sol";

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
    IndexAccountComponent(getAddressById(components, IndexAccCompID)).set(
      id,
      getAndUpdateTotalAccs(components)
    );
    AddressOwnerComponent(getAddressById(components, AddrOwnerCompID)).set(id, ownerAddr);
    AddressOperatorComponent(getAddressById(components, AddrOperatorCompID)).set(id, operatorAddr);
    IndexRoomComponent(getAddressById(components, RoomCompID)).set(id, 1);
    TimeStartComponent(getAddressById(components, TimeStartCompID)).set(id, block.timestamp);
    CacheOperatorComponent(getAddressById(components, CacheOperatorCompID)).set(
      uint256(uint160(operatorAddr)),
      id
    );

    int32 baseStamina = int32(uint32(LibConfig.get(components, "ACCOUNT_STAMINA_BASE")));
    LibStat.setStamina(components, id, Stat(baseStamina, 0, 0, baseStamina));

    updateLastActionTs(components, id);
    updateLastTs(components, id);
    return id;
  }

  function consume(IUintComp components, uint256 id, uint32 itemIndex) internal {
    uint256 registryID = LibItemRegistry.getByIndex(components, itemIndex);
    LibStat.applyy(components, registryID, id);
  }

  // Move the Account to a room
  function move(IUintComp components, uint256 id, uint32 to) internal {
    StaminaComponent(getAddressById(components, StaminaCompID)).sync(id, -1);
    IndexRoomComponent(getAddressById(components, RoomCompID)).set(id, to);
  }

  // Recover's stamina to an account
  function recover(IUintComp components, uint256 id, int32 amt) internal returns (int32) {
    return StaminaComponent(getAddressById(components, StaminaCompID)).sync(id, amt);
  }

  // syncs the stamina of an account. rounds down, ruthlessly
  function syncStamina(IUintComp components, uint256 id) internal returns (int32) {
    uint256 timePassed = block.timestamp - getLastActionTs(components, id);
    uint256 recoveryPeriod = LibConfig.get(components, "ACCOUNT_STAMINA_RECOVERY_PERIOD");
    int32 recoveredAmt = int32(uint32(timePassed / recoveryPeriod));
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
    uint256 holderID,
    string memory _type,
    uint32 index,
    uint256 amount
  ) internal {
    if (LibString.eq(_type, "ITEM")) {
      LibInventory.incFor(components, holderID, index, amount);
    } else if (LibString.eq(_type, "MINT20")) {
      LibMint20.mint(world, getOwner(components, holderID), amount);
    } else if (LibString.eq(_type, "REPUTATION")) {
      LibFactions.incRep(components, holderID, index, amount);
    } else {
      require(false, "LibAccount: unknown type");
    }
  }

  // decreases the balance of X (type+index) of an account
  function decBalanceOf(
    IUintComp components,
    uint256 holderID,
    string memory _type,
    uint32 index,
    uint256 amount
  ) public {
    if (LibString.eq(_type, "ITEM")) {
      LibInventory.decFor(components, holderID, index, amount);
    } else {
      require(false, "LibAccount: unknown type");
    }
  }

  /////////////////
  // SETTERS

  function setOperator(IUintComp components, uint256 id, address addr, address prevAddr) internal {
    CacheOperatorComponent cacheComp = CacheOperatorComponent(
      getAddressById(components, CacheOperatorCompID)
    );
    cacheComp.remove(uint256(uint160(prevAddr)));
    cacheComp.set(uint256(uint160(addr)), id);
    AddressOperatorComponent(getAddressById(components, AddrOperatorCompID)).set(id, addr);
  }

  function setFarcasterIndex(IUintComp components, uint256 id, uint32 fid) internal {
    FarcasterIndexComponent(getAddressById(components, FarcarsterIndexCompID)).set(id, fid);
  }

  function setMediaURI(IUintComp components, uint256 id, string memory uri) internal {
    MediaURIComponent(getAddressById(components, MediaURICompID)).set(id, uri);
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

  /////////////////
  // CHECKS

  function isAccount(IUintComp components, uint256 id) internal view returns (bool) {
    return IsAccountComponent(getAddressById(components, IsAccCompID)).has(id);
  }

  function ownerInUse(IUintComp components, address owner) internal view returns (bool) {
    return
      AddressOwnerComponent(getAddressById(components, AddrOwnerCompID))
        .getEntitiesWithValue(abi.encode(owner))
        .length > 0;
  }

  function operatorInUse(IUintComp components, address operator) internal view returns (bool) {
    return
      CacheOperatorComponent(getAddressById(components, CacheOperatorCompID)).has(
        uint256(uint160(operator))
      );
  }

  // Check whether an Account shares RoomIndex with another entity.
  function sharesRoom(
    IUintComp components,
    uint256 id,
    uint256 entityID
  ) internal view returns (bool) {
    IndexRoomComponent locComp = IndexRoomComponent(getAddressById(components, RoomCompID));
    return locComp.get(id) == locComp.get(entityID);
  }

  /////////////////
  // GETTERS

  function getLastActionTs(IUintComp components, uint256 id) internal view returns (uint256) {
    return TimeLastActionComponent(getAddressById(components, TimeLastActCompID)).get(id);
  }

  function getLastTs(IUintComp components, uint256 id) internal view returns (uint256) {
    return TimeLastComponent(getAddressById(components, TimeLastCompID)).get(id);
  }

  function getIndex(IUintComp components, uint256 id) internal view returns (uint32) {
    return IndexAccountComponent(getAddressById(components, IndexAccCompID)).get(id);
  }

  function getRoom(IUintComp components, uint256 id) internal view returns (uint32) {
    return IndexRoomComponent(getAddressById(components, RoomCompID)).get(id);
  }

  function getName(IUintComp components, uint256 id) internal view returns (string memory) {
    return NameComponent(getAddressById(components, NameCompID)).get(id);
  }

  // get the address of an Account Operator
  function getOperator(IUintComp components, uint256 id) internal view returns (address) {
    return AddressOperatorComponent(getAddressById(components, AddrOperatorCompID)).get(id);
  }

  // get the address of an Account Owner
  function getOwner(IUintComp components, uint256 id) internal view returns (address) {
    return AddressOwnerComponent(getAddressById(components, AddrOwnerCompID)).get(id);
  }

  function getPetsMinted(IUintComp components, uint256 id) internal view returns (uint256) {
    return LibData.get(components, id, 0, "PET721_MINT");
  }

  /////////////////
  // QUERIES

  // retrieves the account with farcaster index
  function getByFarcasterIndex(IUintComp components, uint32 fid) internal view returns (uint256) {
    uint256[] memory results = LibQuery.getIsWithValue(
      getComponentById(components, FarcarsterIndexCompID),
      getComponentById(components, IsAccCompID),
      abi.encode(fid)
    );
    return (results.length > 0) ? results[0] : 0;
  }

  // retrieves the account with the specified name
  function getByName(IUintComp components, string memory name) internal view returns (uint256) {
    uint256[] memory results = LibQuery.getIsWithValue(
      getComponentById(components, NameCompID),
      getComponentById(components, IsAccCompID),
      abi.encode(name)
    );
    return (results.length > 0) ? results[0] : 0;
  }

  // Get an account entity by Wallet address. Assume only 1.
  function getByOperator(IUintComp components, address operator) internal view returns (uint256) {
    CacheOperatorComponent cacheComp = CacheOperatorComponent(
      getAddressById(components, CacheOperatorCompID)
    );
    uint256 id = uint256(uint160(operator));
    require(cacheComp.has(id), "Account: Operator not found");
    return cacheComp.get(id);
  }

  // Get the account of an owner. Assume only 1.
  function getByOwner(IUintComp components, address owner) internal view returns (uint256) {
    uint256[] memory results = LibQuery.getIsWithValue(
      getComponentById(components, AddrOwnerCompID),
      getComponentById(components, IsAccCompID),
      abi.encode(owner)
    );
    return (results.length > 0) ? results[0] : 0;
  }

  // Get pets owned
  function getPetsOwned(
    IUintComp components,
    uint256 accID
  ) internal view returns (uint256[] memory) {
    return
      IDOwnsPetComponent(getAddressById(components, IDOwnsPetCompID)).getEntitiesWithValue(accID);
  }

  //////////////////
  // DATA LOGGING

  function getAndUpdateTotalAccs(IUintComp components) internal returns (uint32) {
    uint256 total = LibData.get(components, 0, 0, "TOTAL_NUM_ACCOUNTS") + 1;
    LibData.set(components, 0, 0, "TOTAL_NUM_ACCOUNTS", total);
    return uint32(total);
  }

  function logIncPetsMinted(
    IWorld world,
    IUintComp components,
    uint256 accID,
    uint256 count
  ) internal {
    LibData.inc(components, accID, 0, "PET721_MINT", count);
  }

  function logIncPetsRerolled(
    IWorld world,
    IUintComp components,
    uint256 accID,
    uint256 count
  ) internal {
    LibData.inc(components, accID, 0, "PET_REROLL", count);
  }

  function logIncPetsStaked(
    IWorld world,
    IUintComp components,
    uint256 accID,
    uint256 count
  ) internal {
    LibData.inc(components, accID, 0, "PET_STAKE", count);
  }
}
