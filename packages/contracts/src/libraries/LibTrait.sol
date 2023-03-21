// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { IUint256Component } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { QueryFragment, QueryType } from "solecs/interfaces/Query.sol";
import { LibQuery } from "solecs/LibQuery.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";

import { AffinityComponent, ID as AffinityComponentID } from "components/AffinityComponent.sol";
import { GenusComponent, ID as GenusComponentID } from "components/GenusComponent.sol";
import { IdPetComponent, ID as IdPetComponentID } from "components/IdPetComponent.sol";
import { IndexModifierComponent, ID as IndexModifierComponentID } from "components/IndexModifierComponent.sol";
import { IsTraitComponent, ID as IsTraitComponentID } from "components/IsTraitComponent.sol";
import { IsEquippedComponent, ID as IsEquipCompID } from "components/IsEquippedComponent.sol";
import { NameComponent, ID as NameCompID } from "components/NameComponent.sol";
import { TypeComponent, ID as TypeComponentID } from "components/TypeComponent.sol";
import { ValueComponent, ID as ValueComponentID } from "components/ValueComponent.sol";
import { ID as PrototypeComponentID } from "components/PrototypeComponent.sol";
import { LibRegistryModifier } from "libraries/LibRegistryModifier.sol";
import { LibPrototype } from "libraries/LibPrototype.sol";

// This library would move to LibEquipmet in the future

// COMPONENTS: Component shapes are defined in createIndex, key components are described below
// Affinity
// Genus: Numerical index for 2D referencing - implemented as string for consistency
// Type: Trait category, ie Face, Body, Color
// IsEquipped: All traits are considered permanently equipped. Component is added for compatibility

library LibTrait {
  ///////////////
  // PETS

  // creates a new entity from registry, adds it to the pet
  function addToPet(
    IUint256Component components,
    IWorld world,
    uint256 petID,
    string memory genus,
    string memory _type
  ) internal returns (uint256) {
    uint256 entityID = world.getUniqueEntityId();
    LibRegistryModifier.copyPrototype(components, genus, _type, entityID);
    IdPetComponent(getAddressById(components, IdPetComponentID)).set(entityID, petID);
    return entityID;
  }

  // completely deletes the modifier entity
  function remove(IUint256Component components, uint256 entityID) internal {
    LibPrototype.remove(components, entityID);
    IdPetComponent(getAddressById(components, IdPetComponentID)).remove(entityID);
  }

  // transfers modifier from entities
  // sets entity as inactive
  function transfer(IUint256Component components, uint256 entityID, uint256 to) internal {
    IdPetComponent(getAddressById(components, IdPetComponentID)).set(entityID, to);
  }

  ///////////////
  // REGISTRY

  function createIndex(
    IUint256Component components,
    IWorld world,
    string memory genus,
    uint256 index,
    uint256 modValue,
    string memory modType,
    string memory affinity,
    string memory name
  ) internal returns (uint256) {
    uint256 entityID = world.getUniqueEntityId();

    uint256[] memory componentIDs = new uint256[](8);
    componentIDs[0] = ValueComponentID;
    componentIDs[1] = TypeComponentID;
    componentIDs[2] = IsEquipCompID;
    componentIDs[3] = AffinityComponentID;
    componentIDs[4] = NameCompID;
    componentIDs[5] = GenusComponentID;
    componentIDs[6] = IsTraitComponentID;
    componentIDs[7] = PrototypeComponentID;

    bytes[] memory values = new bytes[](8);
    values[0] = abi.encode(modValue);
    values[1] = abi.encode(modType);
    values[2] = abi.encode(true);
    values[3] = abi.encode(affinity);
    values[4] = abi.encode(name);
    values[5] = abi.encode(genus);
    values[6] = abi.encode(true);
    values[7] = new bytes(0);

    LibRegistryModifier.addPrototype(components, genus, index, entityID, componentIDs, values);

    return entityID;
  }

  /////////////////
  // COMPONENT RETRIEVAL
  function getModType(
    IUint256Component components,
    uint256 id
  ) internal view returns (string memory) {
    return TypeComponent(getAddressById(components, TypeComponentID)).getValue(id);
  }

  function getValue(IUint256Component components, uint256 id) internal view returns (uint256) {
    return ValueComponent(getAddressById(components, ValueComponentID)).getValue(id);
  }

  function getIndex(IUint256Component components, uint256 id) internal view returns (uint256) {
    return
      IndexModifierComponent(getAddressById(components, IndexModifierComponentID)).getValue(id);
  }

  function getName(IUint256Component components, uint256 id) internal view returns (string memory) {
    return NameComponent(getAddressById(components, NameCompID)).getValue(id);
  }

  ///////////////
  // QUERY
  function _getAllX(
    IUint256Component components,
    uint256 petID,
    string memory genus,
    uint256 index,
    string memory modType,
    string memory affinity
  ) internal view returns (uint256[] memory) {
    uint256 numFilters;
    if (petID != 0) numFilters++;
    if (!LibString.eq(genus, "")) numFilters++;
    if (index != 0) numFilters++;
    if (!LibString.eq(modType, "")) numFilters++;
    if (!LibString.eq(affinity, "")) numFilters++;

    QueryFragment[] memory fragments = new QueryFragment[](numFilters + 1);
    fragments[0] = QueryFragment(
      QueryType.Has,
      getComponentById(components, IsTraitComponentID),
      ""
    );

    uint256 filterCount;
    if (petID != 0) {
      fragments[++filterCount] = QueryFragment(
        QueryType.HasValue,
        getComponentById(components, IdPetComponentID),
        abi.encode(petID)
      );
    }
    if (!LibString.eq(genus, "")) {
      fragments[++filterCount] = QueryFragment(
        QueryType.HasValue,
        getComponentById(components, GenusComponentID),
        abi.encode(genus)
      );
    }
    if (index != 0) {
      fragments[++filterCount] = QueryFragment(
        QueryType.HasValue,
        getComponentById(components, IndexModifierComponentID),
        abi.encode(index)
      );
    }
    if (!LibString.eq(modType, "")) {
      fragments[++filterCount] = QueryFragment(
        QueryType.HasValue,
        getComponentById(components, TypeComponentID),
        abi.encode(modType)
      );
    }
    if (!LibString.eq(affinity, "")) {
      fragments[++filterCount] = QueryFragment(
        QueryType.HasValue,
        getComponentById(components, TypeComponentID),
        abi.encode(affinity)
      );
    }

    return LibQuery.query(fragments);
  }

  // deprecated
  function getAffinities(
    IUint256Component components,
    uint256 id
  ) internal view returns (string[] memory) {
    QueryFragment[] memory fragments = new QueryFragment[](2);

    fragments[0] = QueryFragment(
      QueryType.Has,
      getComponentById(components, AffinityComponentID),
      abi.encode(0)
    );
    fragments[1] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, IdPetComponentID),
      abi.encode(id)
    );

    uint256[] memory queried = LibQuery.query(fragments);

    // converts to name array
    string[] memory names = new string[](queried.length);
    AffinityComponent affinityComp = AffinityComponent(
      getAddressById(components, AffinityComponentID)
    );
    for (uint256 i; i < queried.length; i++) {
      names[i] = affinityComp.getValue(id);
    }

    return names;
  }

  //////////////////
  // CALCULATION

  // second step for calculation: better to query once and run the new array
  // depreciated
  function calArray(
    IUint256Component components,
    uint256 baseValue,
    uint256[] memory arr
  ) internal view returns (uint256 power) {
    // assumes all components in array is activated
    uint256 store;
    uint256 add;
    uint256 mul = 100;
    uint256 umul = 100;

    for (uint256 i; i < arr.length; i++) {
      if (arr[i] == 0) continue;

      uint256 val = getValue(components, arr[i]);
      string memory modType = getModType(components, arr[i]);

      if (LibString.eq(modType, "ADD")) {
        add = add + val;
      } else if (LibString.eq(modType, "MUL")) {
        // value is a %
        mul = (mul * (100 + val)) / 100;
      } else if (LibString.eq(modType, "UMUL")) {
        // value is a %
        umul = (umul * (100 + val)) / 100;
      } else if (LibString.eq(modType, "STORAGE")) {
        store = store + val;
      } else {
        require(false, "unspecified mod type");
      }
    }

    // if baseValue is 0, can assume this is calculating for base value
    if (baseValue > 0) {
      power = ((((baseValue * mul) / 100) + add) * umul) / 100;
    } else {
      power = (add * mul * umul) / 10000;
    }
  }
}
