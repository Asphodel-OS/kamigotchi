// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID } from "solecs/utils.sol";

import { LibFlag } from "libraries/LibFlag.sol";

uint256 constant ID = uint256(keccak256("system.auth.registry"));

contract _AuthManageRoleSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyOwner returns (bytes memory) {
    (address target, string memory role, bool status) = abi.decode(
      arguments,
      (address, string, bool)
    );

    if (status) LibFlag.setFull(components, uint256(uint160(target)), "AUTH", role);
    else LibFlag.removeFull(components, uint256(uint160(target)), role);

    return new bytes(0);
  }

  function addRole(address target, string memory role) public onlyOwner {
    LibFlag.setFull(components, uint256(uint160(target)), "AUTH", role);
  }

  function removeRole(address target, string memory role) public onlyOwner {
    LibFlag.removeFull(components, uint256(uint160(target)), role);
  }
}
