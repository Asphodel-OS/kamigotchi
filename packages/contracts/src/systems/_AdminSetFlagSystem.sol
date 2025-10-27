// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID } from "solecs/utils.sol";

import { AuthRoles } from "libraries/utils/AuthRoles.sol";
import { LibAccount } from "libraries/LibAccount.sol";
import { LibFlag } from "libraries/LibFlag.sol";

uint256 constant ID = uint256(keccak256("system.admin.set.flag"));

// _AdminSetFlagSystem sets arbitrary flags for entities. used for giveaways, airdrops, etc.
contract _AdminSetFlagSystem is System, AuthRoles {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyAdmin(components) returns (bytes memory) {
    (uint256[] memory ids, string memory flagType, bool state) = abi.decode(
      arguments,
      (uint256[], string, bool)
    );
    for (uint256 i = 0; i < ids.length; i++) {
      require(LibAccount.isAccount(components, ids[i]), "not an account");
      LibFlag.set(components, ids[i], flagType, state);
    }
    return "";
  }

  function executeTyped(
    uint256[] memory ids,
    string memory flagType,
    bool state
  ) public onlyAdmin(components) returns (bytes memory) {
    return execute(abi.encode(ids, flagType, state));
  }
}
