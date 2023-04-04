// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { IUint256Component } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { QueryFragment, QueryType } from "solecs/interfaces/Query.sol";
import { LibQuery } from "solecs/LibQuery.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";

import { IdHolderComponent, ID as IdHolderComponentID } from "components/IdHolderComponent.sol";
import { IndexBodyComponent, ID as IndexBodyCompID } from "components/IndexBodyComponent.sol";
import { IndexBackgroundComponent, ID as IndexBackgroundCompID } from "components/IndexBackgroundComponent.sol";
import { IndexColorComponent, ID as IndexColorCompID } from "components/IndexColorComponent.sol";
import { IndexFaceComponent, ID as IndexFaceCompID } from "components/IndexFaceComponent.sol";
import { IndexHandComponent, ID as IndexHandCompID } from "components/IndexHandComponent.sol";
import { NameComponent, ID as NameCompID } from "components/NameComponent.sol";

import { LibRegistryTrait } from "libraries/LibRegistryTrait.sol";
import { LibStat } from "libraries/LibStat.sol";

// Library specifically for permanent traits. Removing/swapping is not supported, but can be added
library LibTrait {
  ///////////////
  // ASSIGNING
  function assignBody(IUint256Component components, uint256 holderID, uint256 index) internal {
    IndexBodyComponent(getAddressById(components, IndexBodyCompID)).set(holderID, index);
    LibStat.incAll(components, holderID, LibRegistryTrait.getByBodyIndex(components, index));
  }

  function assignBackground(
    IUint256Component components,
    uint256 holderID,
    uint256 index
  ) internal {
    IndexBackgroundComponent(getAddressById(components, IndexBackgroundCompID)).set(
      holderID,
      index
    );
    LibStat.incAll(components, holderID, LibRegistryTrait.getByBackgroundIndex(components, index));
  }

  function assignColor(IUint256Component components, uint256 holderID, uint256 index) internal {
    IndexColorComponent(getAddressById(components, IndexColorCompID)).set(holderID, index);
    LibStat.incAll(components, holderID, LibRegistryTrait.getByColorIndex(components, index));
  }

  function assignFace(IUint256Component components, uint256 holderID, uint256 index) internal {
    IndexFaceComponent(getAddressById(components, IndexFaceCompID)).set(holderID, index);
    LibStat.incAll(components, holderID, LibRegistryTrait.getByFaceIndex(components, index));
  }

  function assignHand(IUint256Component components, uint256 holderID, uint256 index) internal {
    IndexHandComponent(getAddressById(components, IndexHandCompID)).set(holderID, index);
    LibStat.incAll(components, holderID, LibRegistryTrait.getByHandIndex(components, index));
  }

  /////////////////
  // COMPONENT RETRIEVAL
  function getBody(IUint256Component components, uint256 holderID) internal view returns (uint256) {
    return IndexBodyComponent(getAddressById(components, IndexBodyCompID)).getValue(holderID);
  }

  function getBackground(
    IUint256Component components,
    uint256 holderID
  ) internal view returns (uint256) {
    return
      IndexBackgroundComponent(getAddressById(components, IndexBackgroundCompID)).getValue(
        holderID
      );
  }

  function getColor(
    IUint256Component components,
    uint256 holderID
  ) internal view returns (uint256) {
    return IndexColorComponent(getAddressById(components, IndexColorCompID)).getValue(holderID);
  }

  function getFace(IUint256Component components, uint256 holderID) internal view returns (uint256) {
    return IndexFaceComponent(getAddressById(components, IndexFaceCompID)).getValue(holderID);
  }

  function getHand(IUint256Component components, uint256 holderID) internal view returns (uint256) {
    return IndexHandComponent(getAddressById(components, IndexHandCompID)).getValue(holderID);
  }

  /////////////////
  // QUERYING REGISTRY ENTITY

  function getBodyPointer(
    IUint256Component components,
    uint256 entityID
  ) internal view returns (uint256) {
    uint256 index = getBody(components, entityID);
    return LibRegistryTrait.getByBodyIndex(components, index);
  }

  function getBackgroundPointer(
    IUint256Component components,
    uint256 entityID
  ) internal view returns (uint256) {
    uint256 index = getBackground(components, entityID);
    return LibRegistryTrait.getByBackgroundIndex(components, index);
  }

  function getColorPointer(
    IUint256Component components,
    uint256 entityID
  ) internal view returns (uint256) {
    uint256 index = getColor(components, entityID);
    return LibRegistryTrait.getByColorIndex(components, index);
  }

  function getFacePointer(
    IUint256Component components,
    uint256 entityID
  ) internal view returns (uint256) {
    uint256 index = getFace(components, entityID);
    return LibRegistryTrait.getByFaceIndex(components, index);
  }

  function getHandPointer(
    IUint256Component components,
    uint256 entityID
  ) internal view returns (uint256) {
    uint256 index = getHand(components, entityID);
    return LibRegistryTrait.getByHandIndex(components, index);
  }

  /////////////////
  // QUERYING

  function getBodyName(
    IUint256Component components,
    uint256 entityID
  ) internal view returns (string memory) {
    return LibRegistryTrait.getName(components, getBodyPointer(components, entityID));
  }

  function getBackgroundName(
    IUint256Component components,
    uint256 entityID
  ) internal view returns (string memory) {
    return LibRegistryTrait.getName(components, getBackgroundPointer(components, entityID));
  }

  function getColorName(
    IUint256Component components,
    uint256 entityID
  ) internal view returns (string memory) {
    return LibRegistryTrait.getName(components, getColorPointer(components, entityID));
  }

  function getFaceName(
    IUint256Component components,
    uint256 entityID
  ) internal view returns (string memory) {
    return LibRegistryTrait.getName(components, getFacePointer(components, entityID));
  }

  function getHandName(
    IUint256Component components,
    uint256 entityID
  ) internal view returns (string memory) {
    return LibRegistryTrait.getName(components, getHandPointer(components, entityID));
  }
}
