// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { QueryFragment, QueryType } from "solecs/interfaces/Query.sol";
import { LibQuery } from "solecs/LibQuery.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";

import { BalanceComponent, ID as BalanceCompID } from "components/BalanceComponent.sol";
import { BlockRevealComponent, ID as BlockRevealCompID } from "components/BlockRevealComponent.sol";
import { GachaOrderComponent, ID as GachaOrderCompID } from "components/GachaOrderComponent.sol";
import { IdAccountComponent, ID as IdAccountCompID } from "components/IdAccountComponent.sol";
import { IsPetComponent, ID as IsPetCompID } from "components/IsPetComponent.sol";
import { RerollComponent, ID as RerollCompID } from "components/RerollComponent.sol";
import { StateComponent, ID as StateCompID } from "components/StateComponent.sol";
import { TypeComponent, ID as TypeCompID } from "components/TypeComponent.sol";
import { ValueComponent, ID as ValueCompID } from "components/ValueComponent.sol";

import { LibConfig } from "libraries/LibConfig.sol";
import { LibPet } from "libraries/LibPet.sol";
import { LibRandom } from "libraries/LibRandom.sol";
import { LibStat } from "libraries/LibStat.sol";

// stores an increment to add entropy and prevent ordering attacks
uint256 constant GACHA_DATA_ID = uint256(keccak256("gacha.data.id"));

library LibGacha {
  /// @notice Creates a commit for a gacha roll
  function commit(
    IWorld world,
    IUintComp components,
    uint256 accountID,
    uint256 revealBlock
  ) internal returns (uint256 id) {
    id = world.getUniqueEntityId();
    IdAccountComponent(getAddressById(components, IdAccountCompID)).set(id, accountID);
    BlockRevealComponent(getAddressById(components, BlockRevealCompID)).set(id, revealBlock);
    TypeComponent(getAddressById(components, TypeCompID)).set(id, string("GACHA_COMMIT"));

    // setting increment on commit, increasing increment
    ValueComponent valComp = ValueComponent(getAddressById(components, ValueCompID));
    uint256 curr = valComp.getValue(GACHA_DATA_ID);
    valComp.set(id, curr + 1);
    valComp.set(GACHA_DATA_ID, curr + 1);
  }

  /// @notice Creates a commit for multiple gacha rolls (same account)
  function commitBatch(
    IWorld world,
    IUintComp components,
    uint256 amount,
    uint256 accountID,
    uint256 revealBlock
  ) internal returns (uint256[] memory ids) {
    ids = new uint256[](amount);
    IdAccountComponent accComp = IdAccountComponent(getAddressById(components, IdAccountCompID));
    BlockRevealComponent revealComp = BlockRevealComponent(
      getAddressById(components, BlockRevealCompID)
    );
    TypeComponent typeComp = TypeComponent(getAddressById(components, TypeCompID));
    ValueComponent valueComp = ValueComponent(getAddressById(components, ValueCompID));
    uint256 currInc = valueComp.getValue(GACHA_DATA_ID) + 1;
    for (uint256 i; i < amount; i++) {
      uint256 id = world.getUniqueEntityId();
      accComp.set(id, accountID);
      revealComp.set(id, revealBlock);
      typeComp.set(id, string("GACHA_COMMIT"));
      valueComp.set(id, currInc + i);
      ids[i] = id;
    }
    valueComp.set(GACHA_DATA_ID, currInc + amount);
  }

  /// @notice deposits a pet into the gacha pool
  function depositPet(IUintComp components, uint256 petID) internal {
    LibPet.toGacha(components, petID);

    uint256 numInGacha = getNumInGacha(components);
    GachaOrderComponent(getAddressById(components, GachaOrderCompID)).set(petID, numInGacha);
    setNumInGacha(components, numInGacha + 1);
  }

  /// @notice transfers multiple pets from gacha to accounts
  /// @dev doesnt use LibPet for batch efficiency. GachaOrder removed during selection
  function withdrawPets(
    IUintComp components,
    uint256[] memory petIDs,
    uint256[] memory accountIDs,
    uint256[] memory rerolls
  ) internal {
    IdAccountComponent accComp = IdAccountComponent(getAddressById(components, IdAccountCompID));
    RerollComponent rerollComp = RerollComponent(getAddressById(components, RerollCompID));
    StateComponent stateComp = StateComponent(getAddressById(components, StateCompID));

    for (uint256 i; i < petIDs.length; i++) {
      accComp.set(petIDs[i], accountIDs[i]);
      rerollComp.set(petIDs[i], rerolls[i] + 1);
      stateComp.set(petIDs[i], string("RESTING"));
    }
  }

  /////////////////
  // CALC

  /// @notice calculates the cost of a gacha roll
  /// @dev assuming flat scaling - may change
  function calcRerollCost(
    IUintComp components,
    uint256 rerollCount
  ) internal view returns (uint256) {
    uint256 baseCost = LibConfig.getValueOf(components, "GACHA_REROLL_PRICE");
    return baseCost * (rerollCount + 1);
  }

  /// @notice calculates and extracts the seed from gacha commits
  function calcSeeds(
    IUintComp components,
    uint256[] memory ids
  ) internal returns (uint256[] memory) {
    BlockRevealComponent blockComp = BlockRevealComponent(
      getAddressById(components, BlockRevealCompID)
    );
    ValueComponent valueComp = ValueComponent(getAddressById(components, ValueCompID));
    uint256[] memory results = new uint256[](ids.length);
    for (uint256 i; i < ids.length; i++) {
      results[i] = uint256(
        keccak256(
          abi.encode(
            LibRandom.getSeedBlockhash(blockComp.getValue(ids[i])),
            valueComp.getValue(ids[i])
          )
        )
      );
      blockComp.remove(ids[i]);
      valueComp.remove(ids[i]);
    }
    return results;
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

    // updating max in gacha
    setNumInGacha(components, max - selectedIndex.length);

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

    IsPetComponent isPetComp = IsPetComponent(getAddressById(components, IsPetCompID));
    GachaOrderComponent orderComp = GachaOrderComponent(
      getAddressById(components, GachaOrderCompID)
    );

    for (uint256 i; i < count; i++) {
      uint256 selectedID = orderComp.getEntitiesWithValue(indices[i])[0]; // only 1 of each index
      require(isPetComp.has(selectedID), "not a pet");
      if (indices[i] < max - 1) {
        // swap pop
        uint256 lastID = orderComp.getEntitiesWithValue(max - 1)[0];
        require(isPetComp.has(lastID), "not a pet");
        orderComp.set(lastID, indices[i]);
      }

      orderComp.remove(selectedID);
      results[i] = selectedID;

      max--;
    }

    return results;
  }

  /////////////////
  // GETTERS

  function getAccount(IUintComp components, uint256 id) internal view returns (uint256) {
    return IdAccountComponent(getAddressById(components, IdAccountCompID)).getValue(id);
  }

  function getIncrement(IUintComp components) internal view returns (uint256) {
    return ValueComponent(getAddressById(components, ValueCompID)).getValue(GACHA_DATA_ID);
  }

  function getNumInGacha(IUintComp components) internal view returns (uint256) {
    return BalanceComponent(getAddressById(components, BalanceCompID)).getValue(GACHA_DATA_ID);
  }

  function getType(IUintComp components, uint256 id) internal view returns (string memory) {
    return TypeComponent(getAddressById(components, TypeCompID)).getValue(id);
  }

  function getReroll(IUintComp components, uint256 id) internal view returns (uint256) {
    RerollComponent comp = RerollComponent(getAddressById(components, RerollCompID));
    return comp.has(id) ? comp.getValue(id) : 0;
  }

  function getAccountBatch(
    IUintComp components,
    uint256[] memory ids
  ) internal view returns (uint256[] memory) {
    IdAccountComponent comp = IdAccountComponent(getAddressById(components, IdAccountCompID));
    uint256[] memory results = new uint256[](ids.length);
    for (uint256 i; i < ids.length; i++) {
      results[i] = comp.getValue(ids[i]);
    }
    return results;
  }

  function getIncrementBatch(
    IUintComp components,
    uint256[] memory ids
  ) internal view returns (uint256[] memory) {
    ValueComponent comp = ValueComponent(getAddressById(components, ValueCompID));
    uint256[] memory results = new uint256[](ids.length);
    for (uint256 i; i < ids.length; i++) {
      results[i] = comp.getValue(ids[i]);
    }
    return results;
  }

  function getTypeBatch(
    IUintComp components,
    uint256[] memory ids
  ) internal view returns (string[] memory) {
    TypeComponent comp = TypeComponent(getAddressById(components, TypeCompID));
    string[] memory results = new string[](ids.length);
    for (uint256 i; i < ids.length; i++) {
      results[i] = comp.getValue(ids[i]);
    }
    return results;
  }

  function getRerollBatch(
    IUintComp components,
    uint256[] memory ids
  ) internal view returns (uint256[] memory) {
    RerollComponent comp = RerollComponent(getAddressById(components, RerollCompID));
    uint256[] memory results = new uint256[](ids.length);
    for (uint256 i; i < ids.length; i++) {
      results[i] = comp.getValue(ids[i]);
    }
    return results;
  }

  /////////////////
  // SETTERS

  function initIncrement(IUintComp components) internal {
    ValueComponent comp = ValueComponent(getAddressById(components, ValueCompID));
    if (!comp.has(GACHA_DATA_ID)) comp.set(GACHA_DATA_ID, 0);
  }

  function initNumInGacha(IUintComp components) internal {
    BalanceComponent comp = BalanceComponent(getAddressById(components, BalanceCompID));
    if (!comp.has(GACHA_DATA_ID)) comp.set(GACHA_DATA_ID, 0);
  }

  function setIncrement(IUintComp components, uint256 increment) internal {
    ValueComponent(getAddressById(components, ValueCompID)).set(GACHA_DATA_ID, increment);
  }

  function setNumInGacha(IUintComp components, uint256 num) internal {
    BalanceComponent(getAddressById(components, BalanceCompID)).set(GACHA_DATA_ID, num);
  }

  function setReroll(IUintComp components, uint256 id, uint256 reroll) internal {
    RerollComponent(getAddressById(components, RerollCompID)).set(id, reroll);
  }

  function setRerollBatch(
    IUintComp components,
    uint256[] memory ids,
    uint256[] memory rerolls
  ) internal {
    RerollComponent comp = RerollComponent(getAddressById(components, RerollCompID));
    for (uint256 i; i < ids.length; i++) {
      comp.set(ids[i], rerolls[i]);
    }
  }

  ///////////////////
  // EXTRACTORS (get and remove)

  function extractReroll(IUintComp components, uint256 id) internal returns (uint256 result) {
    RerollComponent comp = RerollComponent(getAddressById(components, RerollCompID));
    if (comp.has(id)) {
      result = comp.getValue(id);
      comp.remove(id);
    } else {
      result = 0;
    }
  }

  function extractAccountBatch(
    IUintComp components,
    uint256[] memory ids
  ) internal returns (uint256[] memory) {
    IdAccountComponent comp = IdAccountComponent(getAddressById(components, IdAccountCompID));
    uint256[] memory results = new uint256[](ids.length);
    for (uint256 i; i < ids.length; i++) {
      results[i] = comp.getValue(ids[i]);
      comp.remove(ids[i]);
    }
    return results;
  }

  function extractIncrementBatch(
    IUintComp components,
    uint256[] memory ids
  ) internal returns (uint256[] memory) {
    ValueComponent comp = ValueComponent(getAddressById(components, ValueCompID));
    uint256[] memory results = new uint256[](ids.length);
    for (uint256 i; i < ids.length; i++) {
      results[i] = comp.getValue(ids[i]);
      comp.remove(ids[i]);
    }
    return results;
  }

  function extractTypeBatch(
    IUintComp components,
    uint256[] memory ids
  ) internal returns (string[] memory) {
    TypeComponent comp = TypeComponent(getAddressById(components, TypeCompID));
    string[] memory results = new string[](ids.length);
    for (uint256 i; i < ids.length; i++) {
      results[i] = comp.getValue(ids[i]);
      comp.remove(ids[i]);
    }
    return results;
  }

  function extractRerollBatch(
    IUintComp components,
    uint256[] memory ids
  ) internal returns (uint256[] memory) {
    RerollComponent comp = RerollComponent(getAddressById(components, RerollCompID));
    uint256[] memory results = new uint256[](ids.length);
    for (uint256 i; i < ids.length; i++) {
      if (comp.has(ids[i])) {
        results[i] = comp.getValue(ids[i]);
        comp.remove(ids[i]);
      } else {
        results[i] = 0;
      }
    }
    return results;
  }

  function extractRevealBlockBatch(
    IUintComp components,
    uint256[] memory ids
  ) internal returns (uint256[] memory) {
    BlockRevealComponent comp = BlockRevealComponent(getAddressById(components, BlockRevealCompID));
    uint256[] memory results = new uint256[](ids.length);
    for (uint256 i; i < ids.length; i++) {
      results[i] = comp.getValue(ids[i]);
      comp.remove(ids[i]);
    }
    return results;
  }
}
