// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID } from "solecs/utils.sol";

import { AuthRoles } from "libraries/utils/AuthRoles.sol";
import { LibShapeRegistry } from "libraries/LibShapeRegistry.sol";

uint256 constant ID = uint256(keccak256("system.shape.registry"));

contract _ShapeRegistrySystem is System, AuthRoles {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyAdmin(components) returns (bytes memory) {
    (string memory type_, string memory description) = abi.decode(arguments, (string, string));
    LibShapeRegistry.create(components, type_, description);
    return "";
  }

  function executeTyped(
    string memory type_,
    string memory description
  ) public onlyAdmin(components) returns (bytes memory) {
    return execute(abi.encode(type_, description));
  }

  function addOwnerComp(string memory type_, uint256 ownerCompID) public onlyAdmin(components) {
    uint256 shapeID = LibShapeRegistry.get(components, type_);
    require(shapeID != 0, "ShapeRegistry: does not exist");
    LibShapeRegistry.addOwnerComp(components, shapeID, ownerCompID);
  }

  function addFlag(string memory type_, string memory flagType) public onlyAdmin(components) {
    uint256 shapeID = LibShapeRegistry.get(components, type_);
    require(shapeID != 0, "ShapeRegistry: does not exist");
    LibShapeRegistry.addFlag(components, shapeID, flagType);
  }

  function remove(string memory type_) public onlyAdmin(components) {
    uint256 shapeID = LibShapeRegistry.get(components, type_);
    require(shapeID != 0, "ShapeRegistry: does not exist");
    LibShapeRegistry.remove(components, shapeID);
  }
}
