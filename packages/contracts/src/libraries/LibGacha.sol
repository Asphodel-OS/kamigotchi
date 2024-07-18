// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IComponent } from "solecs/interfaces/IComponent.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";

import { ValueComponent, ID as ValueCompID } from "components/ValueComponent.sol";
import { BlockRevealComponent, ID as BlockRevealCompID } from "components/BlockRevealComponent.sol";
import { IdAccountComponent, ID as IdAccountCompID } from "components/IdAccountComponent.sol";
import { IDOwnsPetComponent, ID as IDOwnsPetCompID } from "components/IDOwnsPetComponent.sol";
import { IsPetComponent, ID as IsPetCompID } from "components/IsPetComponent.sol";
import { RerollComponent, ID as RerollCompID } from "components/RerollComponent.sol";
import { StateComponent, ID as StateCompID } from "components/StateComponent.sol";
import { TypeComponent, ID as TypeCompID } from "components/TypeComponent.sol";

import { LibComp } from "libraries/utils/LibComp.sol";
import { LibConfig } from "libraries/LibConfig.sol";
import { LibPet } from "libraries/LibPet.sol";
import { LibRandom } from "libraries/utils/LibRandom.sol";
import { LibStat } from "libraries/LibStat.sol";

// hardcoded entity representing the gacha pool
uint256 constant GACHA_ID = uint256(keccak256("gacha.id"));
// stores an increment to add entropy and prevent ordering attacks
uint256 constant GACHA_DATA_ID = uint256(keccak256("gacha.data.id"));

library LibGacha {
  using LibComp for IComponent;

  /// @notice Creates a commit for a gacha roll
  function commit(
    IWorld world,
    IUintComp components,
    uint256 accID,
    uint256 revealBlock
  ) internal returns (uint256 id) {
    id = world.getUniqueEntityId();
    IdAccountComponent(getAddressById(components, IdAccountCompID)).set(id, accID);
    BlockRevealComponent(getAddressById(components, BlockRevealCompID)).set(id, revealBlock);
    TypeComponent(getAddressById(components, TypeCompID)).set(id, string("GACHA_COMMIT"));

    // setting increment on commit, increasing increment
    ValueComponent valComp = ValueComponent(getAddressById(components, ValueCompID));
    uint256 curr = valComp.get(GACHA_DATA_ID);
    valComp.set(id, curr + 1);
    valComp.set(GACHA_DATA_ID, curr + 1);
  }

  /// @notice Creates a commit for multiple gacha rolls (same account)
  function commitBatch(
    IWorld world,
    IUintComp components,
    uint256 amount,
    uint256 accID,
    uint256 revealBlock
  ) internal returns (uint256[] memory ids) {
    ids = new uint256[](amount);
    ValueComponent valueComp = ValueComponent(getAddressById(components, ValueCompID));
    uint256 currInc = valueComp.get(GACHA_DATA_ID) + 1;

    uint256[] memory increments = new uint256[](amount);
    uint256 initialID = world.getUniqueEntityId(); // needed to get unique ID each time - does not update till value is set
    for (uint256 i; i < amount; i++) {
      ids[i] = uint256(keccak256(abi.encodePacked(initialID, i)));
      increments[i] = currInc + i;
    }

    // setting values
    getComponentById(components, IdAccountCompID).setAll(ids, accID);
    getComponentById(components, BlockRevealCompID).setAll(ids, revealBlock);
    getComponentById(components, TypeCompID).setAll(ids, string("GACHA_COMMIT"));
    valueComp.setBatch(ids, increments);

    // update increment counter
    valueComp.set(GACHA_DATA_ID, currInc + amount);
  }

  /// @notice deposits pets into the gacha pool
  /// @dev doesnt use LibPet for batch efficiency
  function depositPets(IUintComp components, uint256[] memory petIDs) internal {
    IDOwnsPetComponent ownerComp = IDOwnsPetComponent(getAddressById(components, IDOwnsPetCompID));
    RerollComponent rerollComp = RerollComponent(getAddressById(components, RerollCompID));

    uint256 numInGacha = getNumInGacha(components);

    for (uint256 i; i < petIDs.length; i++) {
      ownerComp.set(petIDs[i], GACHA_ID);
      if (rerollComp.has(petIDs[i])) rerollComp.remove(petIDs[i]);
    }
  }

  /// @notice transfers multiple pets from gacha to accounts
  /// @dev doesnt use LibPet for batch efficiency. GachaOrder removed during selection
  function withdrawPets(
    IUintComp components,
    uint256[] memory petIDs,
    uint256[] memory accountIDs,
    uint256[] memory rerolls
  ) internal {
    IDOwnsPetComponent ownerComp = IDOwnsPetComponent(getAddressById(components, IDOwnsPetCompID));
    RerollComponent rerollComp = RerollComponent(getAddressById(components, RerollCompID));

    for (uint256 i; i < petIDs.length; i++) rerolls[i]++;

    ownerComp.setBatch(petIDs, accountIDs);
    rerollComp.setBatch(petIDs, rerolls);
  }

  /////////////////
  // CALC

  /// @notice calculates the cost of a gacha roll
  /// @dev assuming flat scaling - may change
  function calcRerollCost(
    IUintComp components,
    uint256 rerollCount
  ) internal view returns (uint256) {
    uint256 baseCost = getBaseRerollCost(components);
    return baseCost * (rerollCount + 1);
  }

  function calcRerollsCost(
    IUintComp components,
    uint256[] memory rerollCounts
  ) internal view returns (uint256) {
    uint256 baseCost = getBaseRerollCost(components);

    uint256 total;
    for (uint256 i; i < rerollCounts.length; i++) {
      total += baseCost * (rerollCounts[i] + 1);
    }
    return total;
  }

  /// @notice uses insertion sort to sort commits by increment
  function sortCommits(
    IUintComp components,
    uint256[] memory ids
  ) internal view returns (uint256[] memory) {
    uint256[] memory indices = getIncrementBatch(components, ids);

    uint256 length = ids.length;
    for (uint256 i = 1; i < length; i++) {
      uint256 key = indices[i];
      uint256 keyID = ids[i];
      int256 j = int(i) - 1;
      while (j >= 0 && indices[uint256(j)] > key) {
        uint256 uj = uint256(j);
        indices[uj + 1] = indices[uj];
        ids[uj + 1] = ids[uj];
        j--;
      }
      indices[uint256(j + 1)] = key;
      ids[uint256(j + 1)] = keyID;
    }

    return ids;
  }

  /////////////////
  // RANDOMS

  /// @notice gets random pets from gacha with seeds
  function selectPets(
    IUintComp components,
    uint256[] memory seeds
  ) internal returns (uint256[] memory) {
    // selects pets via their order in the gacha pool
    uint256 max = getNumInGacha(components);
    uint256[] memory selectedIndex = LibRandom.getRandomBatchNoReplacement(seeds, max);

    uint256[] memory results = _extractPets(components, selectedIndex, max);
    return results;
  }

  /// @notice calculates and extracts the seed from gacha commits
  function extractSeeds(
    IUintComp components,
    uint256[] memory ids
  ) internal returns (uint256[] memory) {
    uint256[] memory results = new uint256[](ids.length);
    uint256[] memory blockNums = BlockRevealComponent(getAddressById(components, BlockRevealCompID))
      .extractBatch(ids);
    uint256[] memory increments = ValueComponent(getAddressById(components, ValueCompID))
      .extractBatch(ids);

    for (uint256 i; i < ids.length; i++)
      results[i] = uint256(
        keccak256(abi.encode(LibRandom.getSeedBlockhash(blockNums[i]), increments[i]))
      );

    return results;
  }

  /// @notice remove pets from gacha pool order using a swap pop pattern
  function _extractPets(
    IUintComp components,
    uint256[] memory indices,
    uint256 max
  ) internal returns (uint256[] memory) {
    uint256 count = indices.length;
    uint256[] memory results = new uint256[](count);
    IDOwnsPetComponent ownerComp = IDOwnsPetComponent(getAddressById(components, IDOwnsPetCompID));
    IsPetComponent isPetComp = IsPetComponent(getAddressById(components, IsPetCompID));

    for (uint256 i; i < count; i++) {
      uint256 selectedID = ownerComp.getAt(abi.encode(GACHA_ID), indices[i]);
      require(isPetComp.has(selectedID), "not a pet");

      ownerComp.remove(selectedID);
      results[i] = selectedID;
      max--;
    }

    return results;
  }

  /////////////////
  // GETTERS

  function getAccount(IUintComp components, uint256 id) internal view returns (uint256) {
    return IdAccountComponent(getAddressById(components, IdAccountCompID)).get(id);
  }

  function getBaseRerollCost(IUintComp components) internal view returns (uint256) {
    return LibConfig.get(components, "GACHA_REROLL_PRICE");
  }

  function getIncrement(IUintComp components) internal view returns (uint256) {
    return ValueComponent(getAddressById(components, ValueCompID)).get(GACHA_DATA_ID);
  }

  function getNumInGacha(IUintComp components) internal view returns (uint256) {
    IDOwnsPetComponent ownerComp = IDOwnsPetComponent(getAddressById(components, IDOwnsPetCompID));
    return ownerComp.size(abi.encode(GACHA_ID));
  }

  function getType(IUintComp components, uint256 id) internal view returns (string memory) {
    return TypeComponent(getAddressById(components, TypeCompID)).get(id);
  }

  function getReroll(IUintComp components, uint256 id) internal view returns (uint256) {
    RerollComponent comp = RerollComponent(getAddressById(components, RerollCompID));
    return comp.has(id) ? comp.get(id) : 0;
  }

  function getIncrementBatch(
    IUintComp components,
    uint256[] memory ids
  ) internal view returns (uint256[] memory) {
    return ValueComponent(getAddressById(components, ValueCompID)).getBatch(ids);
  }

  function getTypeBatch(
    IUintComp components,
    uint256[] memory ids
  ) internal view returns (string[] memory) {
    return TypeComponent(getAddressById(components, TypeCompID)).getBatch(ids);
  }

  function getRerollBatch(
    IUintComp components,
    uint256[] memory ids
  ) internal view returns (uint256[] memory) {
    return RerollComponent(getAddressById(components, RerollCompID)).getBatch(ids);
  }

  /////////////////
  // SETTERS

  function initIncrement(IUintComp components) internal {
    ValueComponent comp = ValueComponent(getAddressById(components, ValueCompID));
    if (!comp.has(GACHA_DATA_ID)) comp.set(GACHA_DATA_ID, 0);
  }

  function setIncrement(IUintComp components, uint256 increment) internal {
    ValueComponent(getAddressById(components, ValueCompID)).set(GACHA_DATA_ID, increment);
  }

  function setReroll(IUintComp components, uint256 id, uint256 reroll) internal {
    RerollComponent(getAddressById(components, RerollCompID)).set(id, reroll);
  }

  function setRerollBatch(
    IUintComp components,
    uint256[] memory ids,
    uint256[] memory rerolls
  ) internal {
    RerollComponent(getAddressById(components, RerollCompID)).setBatch(ids, rerolls);
  }

  ///////////////////
  // EXTRACTORS (get and remove)

  function extractReroll(IUintComp components, uint256 id) internal returns (uint256 result) {
    // rerolls are not guaranteed to exist, so we need to check
    bytes memory data = RerollComponent(getAddressById(components, RerollCompID)).extractRaw(id);
    return data.length > 0 ? abi.decode(data, (uint256)) : 0;
  }

  function extractAccountBatch(
    IUintComp components,
    uint256[] memory ids
  ) internal returns (uint256[] memory) {
    return IdAccountComponent(getAddressById(components, IdAccountCompID)).extractBatch(ids);
  }

  function extractIncrementBatch(
    IUintComp components,
    uint256[] memory ids
  ) internal returns (uint256[] memory) {
    return ValueComponent(getAddressById(components, ValueCompID)).extractBatch(ids);
  }

  function extractTypeBatch(
    IUintComp components,
    uint256[] memory ids
  ) internal returns (string[] memory) {
    return TypeComponent(getAddressById(components, TypeCompID)).extractBatch(ids);
  }

  function extractRerollBatch(
    IUintComp components,
    uint256[] memory ids
  ) internal returns (uint256[] memory) {
    // rerolls are not guaranteed to exist, so we need to check

    bytes[] memory data = RerollComponent(getAddressById(components, RerollCompID)).extractRawBatch(
      ids
    );
    uint256[] memory results = new uint256[](ids.length);
    for (uint256 i; i < ids.length; i++)
      results[i] = data[i].length > 0 ? abi.decode(data[i], (uint256)) : 0;
    return results;
  }

  function extractRevealBlockBatch(
    IUintComp components,
    uint256[] memory ids
  ) internal returns (uint256[] memory) {
    return BlockRevealComponent(getAddressById(components, BlockRevealCompID)).extractBatch(ids);
  }
}
