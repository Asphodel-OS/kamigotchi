// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID } from "solecs/utils.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibDroptable } from "libraries/LibDroptable.sol";
import { LibCommit } from "libraries/LibCommit.sol";
import { LibInventory } from "libraries/LibInventory.sol";
import { LibRandom } from "libraries/utils/LibRandom.sol";

import { AuthRoles } from "libraries/utils/AuthRoles.sol";

uint256 constant ID = uint256(keccak256("system.droptable.item.reveal"));

// @notice reveals lootbox and distributes items
contract DroptableRevealSystem is System, AuthRoles {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    uint256[] memory ids = abi.decode(arguments, (uint256[]));

    // checks
    if (ids.length == 0) revert("ItemReveal: no reveals");
    LibDroptable.checkAndExtractIsCommit(components, ids);

    // revealing
    LibCommit.filterInvalid(components, ids);
    LibDroptable.reveal(components, ids);
    return "";
  }

  function forceReveal(uint256 id) public onlyCommManager(components) {
    // match to array format
    uint256[] memory ids = new uint256[](1);
    ids[0] = id;

    if (LibCommit.isAvailable(components, ids)) revert("no need for force reveal");
    LibDroptable.checkAndExtractIsCommit(components, ids);

    LibCommit.resetBlocks(components, ids);
    LibDroptable.reveal(components, ids);
  }

  function executeTyped(uint256[] memory ids) public returns (bytes memory) {
    return execute(abi.encode(ids));
  }
}
