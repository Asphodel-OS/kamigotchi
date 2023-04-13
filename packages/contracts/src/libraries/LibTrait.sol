// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { QueryFragment, QueryType } from "solecs/interfaces/Query.sol";
import { LibQuery } from "solecs/LibQuery.sol";
import { getAddressById, getComponentById } from "solecs/utils.sol";

import { IdHolderComponent, ID as IdHolderComponentID } from "components/IdHolderComponent.sol";
import { IndexBodyComponent, ID as IndexBodyCompID } from "components/IndexBodyComponent.sol";
import { IndexBackgroundComponent, ID as IndexBgCompID } from "components/IndexBackgroundComponent.sol";
import { IndexColorComponent, ID as IndexColorCompID } from "components/IndexColorComponent.sol";
import { IndexFaceComponent, ID as IndexFaceCompID } from "components/IndexFaceComponent.sol";
import { IndexHandComponent, ID as IndexHandCompID } from "components/IndexHandComponent.sol";
import { NameComponent, ID as NameCompID } from "components/NameComponent.sol";

import { LibRegistryTrait } from "libraries/LibRegistryTrait.sol";
import { LibStat } from "libraries/LibStat.sol";

// Library specifically for permanent traits. Removing/swapping is not supported, but can be added
library LibTrait {
  ///////////////
  // ASSIGNMENT

  function assignBody(IUintComp components, uint256 holderID, uint256 index) internal {
    IndexBodyComponent(getAddressById(components, IndexBodyCompID)).set(holderID, index);
    LibStat.incAll(components, holderID, LibRegistryTrait.getByBodyIndex(components, index));
  }

  function assignBackground(IUintComp components, uint256 holderID, uint256 index) internal {
    IndexBackgroundComponent(getAddressById(components, IndexBgCompID)).set(holderID, index);
    LibStat.incAll(components, holderID, LibRegistryTrait.getByBackgroundIndex(components, index));
  }

  function assignColor(IUintComp components, uint256 holderID, uint256 index) internal {
    IndexColorComponent(getAddressById(components, IndexColorCompID)).set(holderID, index);
    LibStat.incAll(components, holderID, LibRegistryTrait.getByColorIndex(components, index));
  }

  function assignFace(IUintComp components, uint256 holderID, uint256 index) internal {
    IndexFaceComponent(getAddressById(components, IndexFaceCompID)).set(holderID, index);
    LibStat.incAll(components, holderID, LibRegistryTrait.getByFaceIndex(components, index));
  }

  function assignHand(IUintComp components, uint256 holderID, uint256 index) internal {
    IndexHandComponent(getAddressById(components, IndexHandCompID)).set(holderID, index);
    LibStat.incAll(components, holderID, LibRegistryTrait.getByHandIndex(components, index));
  }

  /////////////////
  // COMPONENT RETRIEVAL

  function getBody(IUintComp components, uint256 holderID) internal view returns (uint256) {
    return IndexBodyComponent(getAddressById(components, IndexBodyCompID)).getValue(holderID);
  }

  function getBackground(IUintComp components, uint256 holderID) internal view returns (uint256) {
    return IndexBackgroundComponent(getAddressById(components, IndexBgCompID)).getValue(holderID);
  }

  function getColor(IUintComp components, uint256 holderID) internal view returns (uint256) {
    return IndexColorComponent(getAddressById(components, IndexColorCompID)).getValue(holderID);
  }

  function getFace(IUintComp components, uint256 holderID) internal view returns (uint256) {
    return IndexFaceComponent(getAddressById(components, IndexFaceCompID)).getValue(holderID);
  }

  function getHand(IUintComp components, uint256 holderID) internal view returns (uint256) {
    return IndexHandComponent(getAddressById(components, IndexHandCompID)).getValue(holderID);
  }

  /////////////////
  // QUERYING REGISTRY ENTITY

  function getBodyPointer(IUintComp components, uint256 entityID) internal view returns (uint256) {
    uint256 index = getBody(components, entityID);
    return LibRegistryTrait.getByBodyIndex(components, index);
  }

  function getBackgroundPointer(
    IUintComp components,
    uint256 entityID
  ) internal view returns (uint256) {
    uint256 index = getBackground(components, entityID);
    return LibRegistryTrait.getByBackgroundIndex(components, index);
  }

  function getColorPointer(IUintComp components, uint256 entityID) internal view returns (uint256) {
    uint256 index = getColor(components, entityID);
    return LibRegistryTrait.getByColorIndex(components, index);
  }

  function getFacePointer(IUintComp components, uint256 entityID) internal view returns (uint256) {
    uint256 index = getFace(components, entityID);
    return LibRegistryTrait.getByFaceIndex(components, index);
  }

  function getHandPointer(IUintComp components, uint256 entityID) internal view returns (uint256) {
    uint256 index = getHand(components, entityID);
    return LibRegistryTrait.getByHandIndex(components, index);
  }

  /////////////////
  // QUERYING

  function getBodyName(
    IUintComp components,
    uint256 entityID
  ) internal view returns (string memory) {
    return LibRegistryTrait.getName(components, getBodyPointer(components, entityID));
  }

  function getBackgroundName(
    IUintComp components,
    uint256 entityID
  ) internal view returns (string memory) {
    return LibRegistryTrait.getName(components, getBackgroundPointer(components, entityID));
  }

  function getColorName(
    IUintComp components,
    uint256 entityID
  ) internal view returns (string memory) {
    return LibRegistryTrait.getName(components, getColorPointer(components, entityID));
  }

  function getFaceName(
    IUintComp components,
    uint256 entityID
  ) internal view returns (string memory) {
    return LibRegistryTrait.getName(components, getFacePointer(components, entityID));
  }

  function getHandName(
    IUintComp components,
    uint256 entityID
  ) internal view returns (string memory) {
    return LibRegistryTrait.getName(components, getHandPointer(components, entityID));
  }
}
