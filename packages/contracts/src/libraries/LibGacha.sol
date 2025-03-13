// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

import { IComponent } from "solecs/interfaces/IComponent.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID, getCompByID } from "solecs/utils.sol";
import { LibString } from "solady/utils/LibString.sol";
import { LibSort } from "solady/utils/LibSort.sol";

import { IDOwnsKamiComponent, ID as IDOwnsKamiCompID } from "components/IDOwnsKamiComponent.sol";
import { RerollComponent, ID as RerollCompID } from "components/RerollComponent.sol";

import { LibCommit } from "libraries/LibCommit.sol";
import { LibComp } from "libraries/utils/LibComp.sol";
import { LibData } from "libraries/LibData.sol";
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
  /// @dev doesnt use LibKami for batch efficiency
  function depositPets(IUintComp components, uint256[] memory kamiIDs) internal {
    IDOwnsKamiComponent ownerComp = IDOwnsKamiComponent(getAddrByID(components, IDOwnsKamiCompID));
    RerollComponent rerollComp = RerollComponent(getAddrByID(components, RerollCompID));

    for (uint256 i; i < kamiIDs.length; i++) {
      ownerComp.set(kamiIDs[i], GACHA_ID);
      rerollComp.remove(kamiIDs[i]);
    }
  }

  /// @notice transfers multiple pets from gacha to accounts
  /// @dev doesnt use LibKami for batch efficiency
  function withdrawPets(
    IUintComp components,
    uint256[] memory kamiIDs,
    uint256[] memory commitIDs
  ) internal {
    // update rerolls
    RerollComponent rerollComp = RerollComponent(getAddrByID(components, RerollCompID));
    uint256[] memory rerolls = rerollComp.safeGet(commitIDs);
    rerollComp.remove(commitIDs);
    for (uint256 i; i < kamiIDs.length; i++) rerolls[i]++;
    rerollComp.set(kamiIDs, rerolls);

    // update pet ownership
    IDOwnsKamiComponent(getAddrByID(components, IDOwnsKamiCompID)).set(
      kamiIDs,
      LibCommit.extractHolders(components, commitIDs)
    );
  }

  /////////////////
  // CALC

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
    IDOwnsKamiComponent ownerComp = IDOwnsKamiComponent(getAddrByID(components, IDOwnsKamiCompID));

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

  function checkAndExtractIsCommit(IUintComp components, uint256[] memory ids) internal {
    string[] memory types = LibCommit.extractTypes(components, ids);
    for (uint256 i; i < ids.length; i++) {
      if (!LibString.eq(types[i], "GACHA_COMMIT")) revert("not gacha commit");
    }
  }

  /////////////////
  // GETTERS

  function getBaseRerollCost(IUintComp components) internal view returns (uint256) {
    return LibConfig.get(components, "GACHA_REROLL_PRICE");
  }

  function getNumInGacha(IUintComp components) internal view returns (uint256) {
    IDOwnsKamiComponent ownerComp = IDOwnsKamiComponent(getAddrByID(components, IDOwnsKamiCompID));
    return ownerComp.size(abi.encode(GACHA_ID));
  }

  /////////////////
  // SETTERS

  function setRerollBatch(
    IUintComp components,
    uint256[] memory ids,
    uint256[] memory rerolls
  ) internal {
    RerollComponent(getAddrByID(components, RerollCompID)).set(ids, rerolls);
  }

  ///////////////////
  // EXTRACTORS

  function extractRerollBatch(
    IUintComp components,
    uint256[] memory ids
  ) internal returns (uint256[] memory rerolls) {
    RerollComponent rerollComp = RerollComponent(getAddrByID(components, RerollCompID));
    rerolls = rerollComp.safeGet(ids);
    rerollComp.remove(ids);
  }

  /////////////////
  // LOGGING

  function logMint(IUintComp components, uint256 accID, uint256 amount) internal {
    LibData.inc(components, accID, 0, "KAMI_GACHA_MINT", amount);
  }

  function logReroll(IUintComp components, uint256 accID, uint256 amount) internal {
    LibData.inc(components, accID, 0, "KAMI_GACHA_REROLL", amount);
  }

  /////////////////
  // SCRIPTING

  function getAllInGacha(IUintComp components) internal view returns (uint256[] memory) {
    IDOwnsKamiComponent ownerComp = IDOwnsKamiComponent(getAddrByID(components, IDOwnsKamiCompID));
    return ownerComp.getEntitiesWithValue(GACHA_ID);
  }
}
