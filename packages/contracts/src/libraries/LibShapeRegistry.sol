// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID } from "solecs/utils.sol";

import { DescriptionComponent, ID as DescriptionCompID } from "components/DescriptionComponent.sol";
import { IdHolderComponent, ID as IdHolderCompID } from "components/IdHolderComponent.sol";
import { IsRegistryComponent, ID as IsRegistryCompID } from "components/IsRegistryComponent.sol";
import { TypeComponent, ID as TypeCompID } from "components/TypeComponent.sol";
import { NameComponent, ID as NameCompID } from "components/NameComponent.sol";

import { LibFlag } from "libraries/LibFlag.sol";
import { LibEntityType } from "libraries/utils/LibEntityType.sol";

/**  @notice
 * LibShapeRegistry is a registry for EntityTypes in game. Used for client and shape-wide configs
 * Shape:
 *  - EntityType: SHAPE_REGISTRY
 *  - Type: original shape's EntityType
 *  - Name: type
 *  - Description
 *  - IdHolderComp (optional): compID of shape's ownerComp, e.g. IDOwnsKami
 *  - Flags
 */
library LibShapeRegistry {
  function create(
    IUintComp comps,
    string memory type_,
    string memory description
  ) internal returns (uint256 id) {
    id = genID(type_);
    LibEntityType.set(comps, id, "SHAPE_REGISTRY");
    IsRegistryComponent(getAddrByID(comps, IsRegistryCompID)).set(id);
    TypeComponent(getAddrByID(comps, TypeCompID)).set(id, type_);
    NameComponent(getAddrByID(comps, NameCompID)).set(id, type_);
    DescriptionComponent(getAddrByID(comps, DescriptionCompID)).set(id, description);
  }

  function addOwnerComp(IUintComp comps, uint256 id, uint256 ownerCompID) internal {
    IdHolderComponent(getAddrByID(comps, IdHolderCompID)).set(id, ownerCompID);
  }

  function addFlag(IUintComp comps, uint256 id, string memory flagType) internal {
    LibFlag.setFull(comps, id, "SHAPE_REGISTRY", flagType);
  }

  function remove(IUintComp comps, uint256 id) internal {
    LibEntityType.remove(comps, id);
    TypeComponent(getAddrByID(comps, TypeCompID)).remove(id);
    NameComponent(getAddrByID(comps, NameCompID)).remove(id);
    DescriptionComponent(getAddrByID(comps, DescriptionCompID)).remove(id);
    IdHolderComponent(getAddrByID(comps, IdHolderCompID)).remove(id);
    IsRegistryComponent(getAddrByID(comps, IsRegistryCompID)).remove(id);

    uint256[] memory flags = LibFlag.queryFor(comps, id);
    LibFlag.removeFull(comps, flags);
  }

  /////////////////
  // CHECKERS

  function isInstance(IUintComp comps, uint256 id) internal view returns (bool) {
    return LibEntityType.isShape(comps, id, "SHAPE_REGISTRY");
  }

  /////////////////
  // GETTERS

  function get(IUintComp comps, string memory type_) internal view returns (uint256 result) {
    uint256 id = genID(type_);
    return isInstance(comps, id) ? id : 0;
  }

  /////////////////
  // UTILS

  function genID(string memory type_) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("shape.registry", type_)));
  }
}
