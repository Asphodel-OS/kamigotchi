// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { Uint256Component } from "std-contracts/components/Uint256Component.sol";
import { IUint256Component } from "solecs/interfaces/IUint256Component.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";
import { QueryFragment, QueryType } from "solecs/interfaces/Query.sol";
import { LibQuery } from "solecs/LibQuery.sol";

import { LibPrototype } from "libraries/LibPrototype.sol";

import { IsRegistryEntryComponent, ID as IsRegistryEntryCompID } from "components/IsRegistryEntryComponent.sol";
import { IndexModComponent, ID as IndexModCompID } from "components/IndexModComponent.sol";

// DEPRECIATED, still in for battery

library LibRegistry {
  // returns entity at registry
  function get(
    IUint256Component components,
    uint256 registryID,
    uint256 index
  ) internal view returns (uint256) {
    QueryFragment[] memory fragments = new QueryFragment[](2);
    fragments[0] = QueryFragment(
      QueryType.Has,
      getComponentById(components, IsRegistryEntryCompID),
      new bytes(0)
    );
    fragments[1] = QueryFragment(
      QueryType.HasValue,
      getComponentById(components, registryID),
      abi.encode(index)
    );

    uint256[] memory results = LibQuery.query(fragments);

    require(results.length == 1, "index does not exist in registry");
    // hardcoded to first index. should not create multiple indexes with same id
    // create custom component for this?
    return results[0];
  }

  function add(
    IUint256Component components,
    uint256 registryID,
    uint256 index,
    uint256 entityToAdd
  ) internal {
    // no check
    Uint256Component comp = Uint256Component(getAddressById(components, registryID));
    IsRegistryEntryComponent isComp = IsRegistryEntryComponent(
      getAddressById(components, IsRegistryEntryCompID)
    );
    comp.set(entityToAdd, index);
    isComp.set(entityToAdd);
  }

  function addPrototype(
    IUint256Component components,
    uint256 registryID,
    uint256 index,
    uint256 entityToAdd,
    uint256[] memory componentIDs,
    bytes[] memory values
  ) internal {
    // creates prototype and assigns it a registryID
    LibPrototype.create(components, entityToAdd, componentIDs, values);

    add(components, registryID, index, entityToAdd);
  }

  function copyPrototype(
    IUint256Component components,
    uint256 registryID,
    uint256 index,
    uint256 entityID
  ) internal {
    uint256 prototypeID = get(components, registryID, index);

    LibPrototype.copy(components, entityID, prototypeID);
  }
}
