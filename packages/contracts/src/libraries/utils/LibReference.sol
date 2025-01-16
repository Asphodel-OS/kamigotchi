// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { getAddrByID, getCompByID } from "solecs/utils.sol";

import { IDParentComponent, ID as IDParentCompID } from "components/IDParentComponent.sol";

import { LibEntityType } from "libraries/utils/LibEntityType.sol";

/** @notice
 * References act as null entities that link to their parent entity
 *  they are used when an intemediary between parent and child is needed
 *
 * Shape: id: hash("reference.instance", FIELD, key [optional], parentID)
 *   - EntityType: REFERENCE
 *   - ParentID: hash("reference.parent", FIELD, parentID)
 */
library LibReference {
  ////////////////
  // SHAPES

  function create(
    IUintComp components,
    string memory field,
    uint256 parentID
  ) internal returns (uint256 id) {
    id = genID(field, parentID);
    _create(components, id, field, parentID);
  }

  function create(
    IUintComp components,
    string memory field,
    uint256 key, // additional identifier
    uint256 parentID
  ) internal returns (uint256 id) {
    id = genID(field, key, parentID);
    _create(components, id, field, parentID);
  }

  function _create(
    IUintComp components,
    uint256 id,
    string memory field,
    uint256 parentID
  ) internal {
    LibEntityType.set(components, id, "REFERENCE");
    IDParentComponent(getAddrByID(components, IDParentCompID)).set(id, parentID);
  }

  function remove(IUintComp components, uint256 id) internal {
    LibEntityType.remove(components, id);
    IDParentComponent(getAddrByID(components, IDParentCompID)).remove(id);
  }

  function remove(IUintComp components, uint256[] memory ids) internal {
    LibEntityType.remove(components, ids);
    IDParentComponent(getAddrByID(components, IDParentCompID)).remove(ids);
  }

  ////////////////
  // QUERIES

  function queryByParent(
    IUintComp components,
    uint256 parentID
  ) internal view returns (uint256[] memory) {
    return
      IDParentComponent(getAddrByID(components, IDParentCompID)).getEntitiesWithValue(parentID);
  }

  ////////////////
  // IDs

  function genID(string memory field, uint256 parentID) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("reference.instance", field, parentID)));
  }

  function genID(
    string memory field,
    uint256 key,
    uint256 parentID
  ) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("reference.instance", field, key, parentID)));
  }
}
