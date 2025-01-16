// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

import { LibString } from "solady/utils/LibString.sol";
import { TypeLib } from "solecs/components/types/standard.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID, getCompByID, addressToEntity } from "solecs/utils.sol";
import { Stat } from "solecs/components/types/Stat.sol";
import { SafeCastLib } from "solady/utils/SafeCastLib.sol";
import { LibTypes } from "solecs/LibTypes.sol";

import { IDOwnsKamiComponent, ID as IDOwnsKamiCompID } from "components/IDOwnsKamiComponent.sol";
import { IndexAccountComponent, ID as IndexAccCompID } from "components/IndexAccountComponent.sol";
import { FarcasterIndexComponent, ID as FarcarsterIndexCompID } from "components/FarcasterIndexComponent.sol";
import { AddressOwnerComponent, ID as AddrOwnerCompID } from "components/AddressOwnerComponent.sol";
import { AddressOperatorComponent, ID as AddrOperatorCompID } from "components/AddressOperatorComponent.sol";
import { CacheOperatorComponent as CacheOpComponent, ID as CacheOpCompID } from "components/CacheOperatorComponent.sol";
import { IndexRoomComponent, ID as RoomCompID } from "components/IndexRoomComponent.sol";
import { MediaURIComponent, ID as MediaURICompID } from "components/MediaURIComponent.sol";
import { NameComponent, ID as NameCompID } from "components/NameComponent.sol";
import { StaminaComponent, ID as StaminaCompID } from "components/StaminaComponent.sol";
import { TimeLastActionComponent, ID as TimeLastActCompID } from "components/TimeLastActionComponent.sol";
import { TimeLastComponent, ID as TimeLastCompID } from "components/TimeLastComponent.sol";
import { TimeStartComponent, ID as TimeStartCompID } from "components/TimeStartComponent.sol";

import { LibEntityType } from "libraries/utils/LibEntityType.sol";
import { LibEmitter } from "libraries/utils/LibEmitter.sol";
import { LibConfig } from "libraries/LibConfig.sol";
import { LibData } from "libraries/LibData.sol";
import { LibExperience } from "libraries/LibExperience.sol";
import { LibFactions } from "libraries/LibFactions.sol";
import { LibInventory } from "libraries/LibInventory.sol";
import { LibItem } from "libraries/LibItem.sol";
import { LibRoom } from "libraries/LibRoom.sol";
import { LibStat } from "libraries/LibStat.sol";

library LibAccount {
  using SafeCastLib for uint32;
  using SafeCastLib for int32;
  /////////////////
  // INTERACTIONS

  // Create an account account
  function create(
    IUintComp components,
    address ownerAddr,
    address operatorAddr
  ) internal returns (uint256) {
    uint256 id = addressToEntity(ownerAddr);
    LibEntityType.set(components, id, "ACCOUNT");
    IndexAccountComponent(getAddrByID(components, IndexAccCompID)).set(
      id,
      getAndUpdateTotalAccs(components)
    );
    AddressOwnerComponent(getAddrByID(components, AddrOwnerCompID)).set(id, ownerAddr);
    AddressOperatorComponent(getAddrByID(components, AddrOperatorCompID)).set(id, operatorAddr);
    IndexRoomComponent(getAddrByID(components, RoomCompID)).set(id, 1);
    TimeStartComponent(getAddrByID(components, TimeStartCompID)).set(id, block.timestamp);
    CacheOpComponent(getAddrByID(components, CacheOpCompID)).set(
      uint256(uint160(operatorAddr)),
      id
    );

    uint32[8] memory config = LibConfig.getArray(components, "ACCOUNT_STAMINA");
    int32 baseStamina = int32(config[0]);
    LibStat.setStamina(components, id, Stat(baseStamina, 0, 0, baseStamina));

    updateLastActionTs(components, id);
    updateLastTs(components, id);
    return id;
  }

  function consume(IUintComp components, uint256 id, uint32 itemIndex) internal {
    uint256 registryID = LibItem.getByIndex(components, itemIndex);
    LibStat.applyAll(components, registryID, id);
  }

  // Move the Account to a room
  function move(IUintComp components, uint256 id, uint32 to) internal {
    uint32[8] memory config = LibConfig.getArray(components, "ACCOUNT_STAMINA");
    depleteStamina(components, id, config[2]);
    IndexRoomComponent(getAddrByID(components, RoomCompID)).set(id, to);
    LibExperience.inc(components, id, config[3]);
  }

  // syncs the stamina of an account. rounds down, ruthlessly
  function sync(IUintComp components, uint256 id) internal returns (int32) {
    uint32[8] memory config = LibConfig.getArray(components, "ACCOUNT_STAMINA");
    uint32 recoveryPeriod = config[1];
    uint32 timePassed = uint32(block.timestamp - getLastActionTs(components, id));
    int32 recoveredAmt = timePassed.toInt32() / recoveryPeriod.toInt32(); // rounds down
    updateLastActionTs(components, id);
    return recoverStamina(components, id, recoveredAmt);
  }

  // recover the stamina or an account
  function recoverStamina(IUintComp components, uint256 id, int32 amt) internal returns (int32) {
    return LibStat.sync(components, "STAMINA", amt, id);
  }

  /// @notice deplete the stamina of an account.
  /// @dev assume it's already synced in this tx
  function depleteStamina(
    IUintComp components,
    uint256 id,
    uint32 rawAmt
  ) internal returns (int32) {
    int32 curr = LibStat.getCurrent(components, "STAMINA", id);
    if (rawAmt > uint32(curr.toUint256())) revert("Account: insufficient stamina");
    int32 amt = -1 * rawAmt.toInt32();
    return LibStat.sync(components, "STAMINA", amt, id); // optimisable: double sync
  }

  // Update the TimeLastAction of the account. Used to throttle world movement.
  function updateLastActionTs(IUintComp components, uint256 id) internal {
    setLastActionTs(components, id, block.timestamp);
  }

  function updateLastTs(IUintComp components, uint256 id) internal {
    setLastTs(components, id, block.timestamp);
  }

  /////////////////
  // SETTERS

  function setOperator(IUintComp components, uint256 id, address addr, address prevAddr) internal {
    CacheOpComponent cacheComp = CacheOpComponent(getAddrByID(components, CacheOpCompID));
    cacheComp.remove(uint256(uint160(prevAddr)));
    cacheComp.set(uint256(uint160(addr)), id);
    AddressOperatorComponent(getAddrByID(components, AddrOperatorCompID)).set(id, addr);
  }

  function setFarcasterIndex(IUintComp components, uint256 id, uint32 fid) internal {
    FarcasterIndexComponent(getAddrByID(components, FarcarsterIndexCompID)).set(id, fid);
  }

  function setMediaURI(IUintComp components, uint256 id, string memory uri) internal {
    MediaURIComponent(getAddrByID(components, MediaURICompID)).set(id, uri);
  }

  function setLastActionTs(IUintComp components, uint256 id, uint256 ts) internal {
    TimeLastActionComponent(getAddrByID(components, TimeLastActCompID)).set(id, ts);
  }

  function setLastTs(IUintComp components, uint256 id, uint256 ts) internal {
    TimeLastComponent(getAddrByID(components, TimeLastCompID)).set(id, ts);
  }

  function setName(IUintComp components, uint256 id, string memory name) internal {
    NameComponent(getAddrByID(components, NameCompID)).set(id, name);
  }

  /////////////////
  // CHECKS

  function isAccount(IUintComp components, uint256 id) internal view returns (bool) {
    return LibEntityType.isShape(components, id, "ACCOUNT");
  }

  function ownerInUse(IUintComp components, address owner) internal view returns (bool) {
    return
      AddressOwnerComponent(getAddrByID(components, AddrOwnerCompID))
        .getEntitiesWithValue(abi.encode(owner))
        .length > 0;
  }

  function operatorInUse(IUintComp components, address operator) internal view returns (bool) {
    return CacheOpComponent(getAddrByID(components, CacheOpCompID)).has(uint256(uint160(operator)));
  }

  /////////////////
  // GETTERS

  function getLastActionTs(IUintComp components, uint256 id) internal view returns (uint256) {
    return TimeLastActionComponent(getAddrByID(components, TimeLastActCompID)).get(id);
  }

  function getLastTs(IUintComp components, uint256 id) internal view returns (uint256) {
    return TimeLastComponent(getAddrByID(components, TimeLastCompID)).get(id);
  }

  function getIndex(IUintComp components, uint256 id) internal view returns (uint32) {
    return IndexAccountComponent(getAddrByID(components, IndexAccCompID)).get(id);
  }

  function getRoom(IUintComp components, uint256 id) internal view returns (uint32) {
    return IndexRoomComponent(getAddrByID(components, RoomCompID)).get(id);
  }

  function getName(IUintComp components, uint256 id) internal view returns (string memory) {
    return NameComponent(getAddrByID(components, NameCompID)).get(id);
  }

  // get the address of an Account Operator
  function getOperator(IUintComp components, uint256 id) internal view returns (address) {
    return AddressOperatorComponent(getAddrByID(components, AddrOperatorCompID)).get(id);
  }

  // get the address of an Account Owner
  function getOwner(IUintComp components, uint256 id) internal view returns (address) {
    return AddressOwnerComponent(getAddrByID(components, AddrOwnerCompID)).get(id);
  }

  /////////////////
  // QUERIES

  // retrieves the account with farcaster index
  function getByFarcasterIndex(IUintComp components, uint32 fid) internal view returns (uint256) {
    uint256[] memory results = LibEntityType.queryWithValue(
      components,
      "ACCOUNT",
      getCompByID(components, FarcarsterIndexCompID),
      abi.encode(fid)
    );
    return (results.length > 0) ? results[0] : 0;
  }

  // retrieves the account with the specified name
  function getByName(IUintComp components, string memory name) internal view returns (uint256) {
    uint256[] memory results = LibEntityType.queryWithValue(
      components,
      "ACCOUNT",
      getCompByID(components, NameCompID),
      abi.encode(name)
    );
    return (results.length > 0) ? results[0] : 0;
  }

  // Get an account entity by Wallet address. Assume only 1.
  function getByOperator(IUintComp components, address operator) internal view returns (uint256) {
    uint256 value = CacheOpComponent(getAddrByID(components, CacheOpCompID)).safeGet(
      uint256(uint160(operator)) // operator address as entityID
    );
    if (value == 0) revert("Account: Operator not found");
    return value;
  }

  // Get the account of an owner. Assume only 1.
  function getByOwner(IUintComp components, address owner) internal view returns (uint256) {
    uint256 id = uint256(uint160(owner));
    return LibEntityType.isShape(components, id, "ACCOUNT") ? id : 0;
  }

  // Get kamis owned
  function getKamis(IUintComp components, uint256 accID) internal view returns (uint256[] memory) {
    return
      IDOwnsKamiComponent(getAddrByID(components, IDOwnsKamiCompID)).getEntitiesWithValue(accID);
  }

  function getNumKamis(IUintComp components, uint256 accID) internal view returns (uint256) {
    return
      IDOwnsKamiComponent(getAddrByID(components, IDOwnsKamiCompID)).size(
        TypeLib.encodeUint256(accID)
      );
  }

  //////////////////
  // DATA LOGGING

  function getAndUpdateTotalAccs(IUintComp components) internal returns (uint32) {
    uint256 total = LibData.get(components, 0, 0, "TOTAL_NUM_ACCOUNTS") + 1;
    LibData.set(components, 0, 0, "TOTAL_NUM_ACCOUNTS", total);
    return uint32(total);
  }

  function logIncKamisStaked(
    IWorld world,
    IUintComp components,
    uint256 accID,
    uint256 count
  ) internal {
    LibData.inc(components, accID, 0, "KAMI_STAKE", count);
  }

  function logMove(IWorld world, uint256 systemId, bytes memory values) internal {
    uint8[] memory _schema = new uint8[](1);
    _schema[0] = uint8(LibTypes.SchemaValue.UINT32);

    LibEmitter.emitSystemCall(world, systemId, _schema, values);
  }
}
