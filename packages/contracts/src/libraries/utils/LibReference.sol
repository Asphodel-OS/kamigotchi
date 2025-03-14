// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { getAddrByID, getCompByID } from "solecs/utils.sol";

import { IDAnchorComponent, ID as IDAnchorCompID } from "components/IDAnchorComponent.sol";

import { LibEntityType } from "libraries/utils/LibEntityType.sol";

/** @notice
 * References act as null entities that link to their parent entity
 *  they are used when an intermediary between parent and child is needed
 *
 * Shape: id: hash("reference.instance", FIELD, key [optional], anchorID)
 *   - EntityType: REFERENCE
 *   - AnchorID: hash("reference.parent", FIELD, anchorID)
 */
library LibReference {
  ////////////////
  // SHAPES

  function create(
    IUintComp components,
    string memory field,
    uint256 anchorID
  ) internal returns (uint256 id) {
    id = genID(field, anchorID);
    _create(components, id, field, anchorID);
  }

  function create(
    IUintComp components,
    string memory field,
    uint256 key, // additional identifier
    uint256 anchorID
  ) internal returns (uint256 id) {
    id = genID(field, key, anchorID);
    _create(components, id, field, anchorID);
  }

  function _create(
    IUintComp components,
    uint256 id,
    string memory field,
    uint256 anchorID
  ) internal {
    LibEntityType.set(components, id, "REFERENCE");
    IDAnchorComponent(getAddrByID(components, IDAnchorCompID)).set(id, anchorID);
  }

  function remove(IUintComp components, uint256 id) internal {
    LibEntityType.remove(components, id);
    IDAnchorComponent(getAddrByID(components, IDAnchorCompID)).remove(id);
  }

  function remove(IUintComp components, uint256[] memory ids) internal {
    LibEntityType.remove(components, ids);
    IDAnchorComponent(getAddrByID(components, IDAnchorCompID)).remove(ids);
  }

  ////////////////
  // QUERIES

  function queryByParent(
    IUintComp components,
    uint256 anchorID
  ) internal view returns (uint256[] memory) {
    return
      IDAnchorComponent(getAddrByID(components, IDAnchorCompID)).getEntitiesWithValue(anchorID);
  }

  ////////////////
  // IDs

  function genID(string memory field, uint256 anchorID) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("reference.instance", field, anchorID)));
  }

  function genID(
    string memory field,
    uint256 key,
    uint256 anchorID
  ) internal pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("reference.instance", field, key, anchorID)));
  }
}
