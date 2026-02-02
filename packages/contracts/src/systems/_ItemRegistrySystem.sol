// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { AuthRoles } from "libraries/utils/AuthRoles.sol";
import { LibAllo } from "libraries/LibAllo.sol";
import { Condition } from "libraries/LibConditional.sol";
import { LibEquipment } from "libraries/LibEquipment.sol";
import { LibItem } from "libraries/LibItem.sol";
import { TokenAddressComponent, ID as TokenAddressCompID } from "components/TokenAddressComponent.sol";
import { getAddrByID } from "solecs/utils.sol";

uint256 constant ID = uint256(keccak256("system.item.registry"));

contract _ItemRegistrySystem is System, AuthRoles {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function create(bytes memory arguments) public onlyAdmin(components) returns (uint256) {
    (
      uint32 index,
      string memory type_,
      string memory name,
      string memory description,
      string memory media,
      uint32 rarity
    ) = abi.decode(arguments, (uint32, string, string, string, string, uint32));
    require(LibItem.getByIndex(components, index) == 0, "item reg: index used");

    uint256 id = LibItem.createItem(components, index, type_, name, description, media, rarity);
    return id;
  }

  function createConsumable(bytes memory arguments) public onlyAdmin(components) returns (uint256) {
    (
      uint32 index,
      string memory for_,
      string memory name,
      string memory description,
      string memory type_,
      string memory media,
      uint32 rarity
    ) = abi.decode(arguments, (uint32, string, string, string, string, string, uint32));
    require(LibItem.getByIndex(components, index) == 0, "item reg: index used");

    uint256 id = LibItem.createItem(components, index, type_, name, description, media, rarity);
    LibItem.setFor(components, id, for_);
    return id;
  }

  function addRequirement(bytes memory arguments) public onlyAdmin(components) returns (uint256) {
    (
      uint32 index,
      string memory useCase,
      string memory condType,
      string memory condLogic,
      uint32 condIndex,
      uint256 condValue,
      string memory condFor
    ) = abi.decode(arguments, (uint32, string, string, string, uint32, uint256, string));
    require(LibItem.getByIndex(components, index) != 0, "ItemReg: item does not exist");

    return
      LibItem.addRequirement(
        world,
        components,
        index,
        useCase,
        Condition(condType, condLogic, condIndex, condValue, condFor)
      );
  }

  function addFlag(uint32 index, string memory flag) public onlyAdmin(components) {
    require(LibItem.getByIndex(components, index) != 0, "ItemReg: item does not exist");
    LibItem.addFlag(components, index, flag);
  }

  /// @notice Set the equipment slot for an item
  /// @param index Item registry index
  /// @param slot Equipment slot (e.g., "Kami_Pet_Slot")
  function setSlot(uint32 index, string memory slot) public onlyAdmin(components) {
    require(LibItem.getByIndex(components, index) != 0, "ItemReg: item does not exist");
    LibEquipment.setItemSlot(components, index, slot);
  }

  function addAlloBasic(bytes memory arguments) public onlyAdmin(components) returns (uint256) {
    (
      uint32 index,
      string memory useCase,
      string memory alloType,
      uint32 alloIndex,
      uint256 alloValue
    ) = abi.decode(arguments, (uint32, string, string, uint32, uint256));
    uint256 regID = LibItem.getByIndex(components, index);
    require(regID != 0, "ItemReg: item does not exist");

    uint256 refID = LibItem.createUseCase(components, index, useCase);
    uint256 anchorID = LibItem.genAlloAnchor(refID);
    return LibAllo.createBasic(components, regID, anchorID, alloType, alloIndex, alloValue);
  }

  function addAlloBonus(bytes memory arguments) public onlyAdmin(components) returns (uint256) {
    (
      uint32 index,
      string memory useCase,
      string memory bonusType,
      string memory endType,
      uint256 duration,
      int256 bonusValue
    ) = abi.decode(arguments, (uint32, string, string, string, uint256, int256));
    uint256 regID = LibItem.getByIndex(components, index);
    require(regID != 0, "ItemReg: item does not exist");

    uint256 refID = LibItem.createUseCase(components, index, useCase);
    uint256 anchorID = LibItem.genAlloAnchor(refID);
    return
      LibAllo.createBonus(components, regID, anchorID, bonusType, endType, duration, bonusValue);
  }

  function addAlloDT(bytes memory arguments) public onlyAdmin(components) returns (uint256) {
    (
      uint32 index,
      string memory useCase,
      uint32[] memory keys,
      uint256[] memory weights,
      uint256 value
    ) = abi.decode(arguments, (uint32, string, uint32[], uint256[], uint256));
    uint256 regID = LibItem.getByIndex(components, index);
    require(regID != 0, "ItemReg: item does not exist");

    uint256 refID = LibItem.createUseCase(components, index, useCase);
    uint256 anchorID = LibItem.genAlloAnchor(refID);
    return LibAllo.createDT(components, regID, anchorID, keys, weights, value);
  }

  function addAlloStat(bytes memory arguments) public onlyAdmin(components) returns (uint256) {
    (
      uint32 index,
      string memory useCase,
      string memory statType,
      int32 base,
      int32 shift,
      int32 boost,
      int32 sync
    ) = abi.decode(arguments, (uint32, string, string, int32, int32, int32, int32));
    uint256 regID = LibItem.getByIndex(components, index);
    require(regID != 0, "ItemReg: item does not exist");

    uint256 refID = LibItem.createUseCase(components, index, useCase);
    uint256 anchorID = LibItem.genAlloAnchor(refID);
    return LibAllo.createStat(components, regID, anchorID, statType, base, shift, boost, sync);
  }

  function remove(uint32 index) public onlyAdmin(components) {
    uint256 registryID = LibItem.getByIndex(components, index);
    require(registryID != 0, "ItemReg: item does not exist");

    LibItem.remove(components, index);
  }

  function disable(uint32 index) public onlyAdmin(components) {
    uint256 registryID = LibItem.getByIndex(components, index);
    require(registryID != 0, "ItemReg: item does not exist");
    LibItem.disable(components, index);
  }

  function enable(uint32 index) public onlyAdmin(components) {
    uint256 registryID = LibItem.getByIndex(components, index);
    require(registryID != 0, "ItemReg: item does not exist");
    LibItem.enable(components, index);
  }

  /// @notice Update the rarity of an existing item. Silently skips if item doesn't exist or has a token address.
  /// @param arguments ABI encoded (uint32 index, uint32 rarity)
  /// @return success True if item exists and was updated, false otherwise
  function setRarity(bytes memory arguments) public onlyAdmin(components) returns (bool success) {
    (uint32 index, uint32 rarity) = abi.decode(arguments, (uint32, uint32));
    uint256 registryID = LibItem.getByIndex(components, index);
    if (registryID == 0) return false; // Skip non-existent items gracefully
    // Skip items with token addresses (e.g., MUSU, VIPP) - these are protected
    if (TokenAddressComponent(getAddrByID(components, TokenAddressCompID)).has(registryID)) return false;
    LibItem.setRarity(components, registryID, rarity);
    return true;
  }

  function execute(bytes memory arguments) public onlyAdmin(components) returns (bytes memory) {
    require(false, "not implemented");
    return "";
  }
}
