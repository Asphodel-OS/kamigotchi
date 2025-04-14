// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID } from "solecs/utils.sol";

import { AuthRoles } from "libraries/utils/AuthRoles.sol";
import { LibAccount } from "libraries/LibAccount.sol";

uint256 constant ID = uint256(keccak256("system.world.whitelist.set"));

// _ConfigSetSystem creates a global config field entity of the provided type
contract _WorldWhitelistSystem is System, AuthRoles {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyAdmin(components) returns (bytes memory) {
    address addr = abi.decode(arguments, (address));
    LibAccount.setWorldWL(components, addr, true);

    return "";
  }

  function whitelist(address addr) public onlyAdmin(components) returns (bytes memory) {
    return execute(abi.encode(addr));
  }
}
