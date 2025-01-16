// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { LibString } from "solady/utils/LibString.sol";

import { LibSetter } from "libraries/utils/LibSetter.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibGacha } from "libraries/LibGacha.sol";
import { LibKami } from "libraries/LibKami.sol";

import { AuthRoles } from "libraries/utils/AuthRoles.sol";

uint256 constant ID = uint256(keccak256("system._Admin.Give"));

/// @notice for playtest & general testing - enables admins to give stuff
contract _AdminGiveSystem is System, AuthRoles {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyAdmin(components) returns (bytes memory) {
    (address owner, string memory _type, uint32 index, uint256 amount) = abi.decode(
      arguments,
      (address, string, uint32, uint256)
    );
    uint256 accID = uint256(uint160(owner));
    LibSetter.update(world, components, _type, index, amount, accID);

    return "";
  }

  function executeTyped(
    address owner,
    string memory _type,
    uint32 index,
    uint256 amount
  ) public onlyAdmin(components) returns (bytes memory) {
    return execute(abi.encode(owner, _type, index, amount));
  }
}
