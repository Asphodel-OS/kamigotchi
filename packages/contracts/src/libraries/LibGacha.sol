// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IComponent } from "solecs/interfaces/IComponent.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID, getCompByID } from "solecs/utils.sol";
import { LibString } from "solady/utils/LibString.sol";
import { LibSort } from "solady/utils/LibSort.sol";

import { IDOwnsPetComponent, ID as IDOwnsPetCompID } from "components/IDOwnsPetComponent.sol";
import { RerollComponent, ID as RerollCompID } from "components/RerollComponent.sol";

import { LibCommit } from "libraries/LibCommit.sol";
import { LibComp } from "libraries/utils/LibComp.sol";
import { LibConfig } from "libraries/LibConfig.sol";
import { LibRandom } from "libraries/utils/LibRandom.sol";

// hardcoded entity representing the gacha pool
uint256 constant GACHA_ID = uint256(keccak256("gacha.id"));

library LibGacha {
  using LibComp for IComponent;

  /// @notice Creates a commit for a gacha roll
  function commit(
    IWorld world,
    IUintComp components,
    uint256 accID,
    uint256 revealBlock
  ) internal returns (uint256 id) {
    LibCommit.commit(world, components, accID, revealBlock, "GACHA_COMMIT");
  }

  /// @notice Creates a commit for multiple gacha rolls (same account)
  function commitBatch(
    IWorld world,
    IUintComp components,
    uint256 amount,
    uint256 accID,
    uint256 revealBlock
  ) internal returns (uint256[] memory ids) {
    return LibCommit.commitBatch(world, components, accID, revealBlock, "GACHA_COMMIT", amount);
  }

  /////////////////
  // INTERACTIONS

  /// @notice deposits pets into the gacha pool
  /// @dev doesnt use LibPet for batch efficiency
  function depositPets(IUintComp components, uint256[] memory petIDs) internal {
    IDOwnsPetComponent ownerComp = IDOwnsPetComponent(getAddrByID(components, IDOwnsPetCompID));
    RerollComponent rerollComp = RerollComponent(getAddrByID(components, RerollCompID));

    for (uint256 i; i < petIDs.length; i++) {
      ownerComp.set(petIDs[i], GACHA_ID);
      rerollComp.remove(petIDs[i]);
    }
  }

  /// @notice transfers multiple pets from gacha to accounts
  /// @dev doesnt use LibPet for batch efficiency
  function withdrawPets(
    IUintComp components,
    uint256[] memory petIDs,
    uint256[] memory commitIDs
  ) internal {
    // update rerolls
    RerollComponent rerollComp = RerollComponent(getAddrByID(components, RerollCompID));
    uint256[] memory rerolls = LibComp.safeExtractBatchUint256(rerollComp, commitIDs);
    for (uint256 i; i < petIDs.length; i++) rerolls[i]++;
    rerollComp.setBatch(petIDs, rerolls);

    // update pet ownership
    IDOwnsPetComponent(getAddrByID(components, IDOwnsPetCompID)).setBatch(
      petIDs,
      LibCommit.extractHolders(components, commitIDs)
    );
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

  /// @notice sort based on entityID
  function sortCommits(
    IUintComp components,
    uint256[] memory ids
  ) internal view returns (uint256[] memory) {
    LibSort.insertionSort(ids);
    return ids;
  }

  /////////////////
  // RANDOMS

  /// @notice gets random pets from gacha with seeds
  function selectPets(
    IUintComp components,
    uint256[] memory commitIDs
  ) internal returns (uint256[] memory) {
    uint256[] memory seeds = LibCommit.extractSeeds(components, commitIDs);

    // selects pets via their order in the gacha pool
    uint256 max = getNumInGacha(components);
    uint256[] memory selectedIndex = LibRandom.getRandomBatchNoReplacement(seeds, max);

    return _extractPets(components, selectedIndex, max);
  }

  /// @notice remove pets from gacha pool order using a swap pop pattern
  function _extractPets(
    IUintComp components,
    uint256[] memory indices,
    uint256 max
  ) internal returns (uint256[] memory) {
    uint256 count = indices.length;
    uint256[] memory results = new uint256[](count);
    IDOwnsPetComponent ownerComp = IDOwnsPetComponent(getAddrByID(components, IDOwnsPetCompID));

    for (uint256 i; i < count; i++) {
      uint256 selectedID = ownerComp.getAt(abi.encode(GACHA_ID), indices[i]);

      ownerComp.remove(selectedID);
      results[i] = selectedID;
      max--;
    }

    return results;
  }

  /////////////////
  // CHECKERS

  function extractIsCommits(IUintComp components, uint256[] memory ids) internal returns (bool) {
    string[] memory types = LibCommit.extractTypes(components, ids);
    for (uint256 i; i < ids.length; i++) {
      if (!LibString.eq(types[i], "GACHA_COMMIT")) return false;
    }
    return true;
  }

  /////////////////
  // GETTERS

  function getBaseRerollCost(IUintComp components) internal view returns (uint256) {
    return LibConfig.get(components, "GACHA_REROLL_PRICE");
  }

  function getNumInGacha(IUintComp components) internal view returns (uint256) {
    IDOwnsPetComponent ownerComp = IDOwnsPetComponent(getAddrByID(components, IDOwnsPetCompID));
    return ownerComp.size(abi.encode(GACHA_ID));
  }

  /////////////////
  // SETTERS

  function setRerollBatch(
    IUintComp components,
    uint256[] memory ids,
    uint256[] memory rerolls
  ) internal {
    RerollComponent(getAddrByID(components, RerollCompID)).setBatch(ids, rerolls);
  }

  ///////////////////
  // EXTRACTORS

  function extractRerollBatch(
    IUintComp components,
    uint256[] memory ids
  ) internal returns (uint256[] memory) {
    return getCompByID(components, RerollCompID).safeExtractBatchUint256(ids);
  }

  /////////////////
  // SCRIPTING

  function getAllInGacha(IUintComp components) internal view returns (uint256[] memory) {
    IDOwnsPetComponent ownerComp = IDOwnsPetComponent(getAddrByID(components, IDOwnsPetCompID));
    return ownerComp.getEntitiesWithValue(GACHA_ID);
  }
}
