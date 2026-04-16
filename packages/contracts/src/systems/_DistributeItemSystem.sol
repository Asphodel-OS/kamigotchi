// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddrByID } from "solecs/utils.sol";

import { AuthRoles } from "libraries/utils/AuthRoles.sol";
import { LibAccount } from "libraries/LibAccount.sol";
import { LibInventory } from "libraries/LibInventory.sol";

uint256 constant ID = uint256(keccak256("system.distribute.item"));

// _DistributeItemSystem distributes a specific item to players in player-specific amounts.
// used for compensation, apologies, targeted rewards, etc.
contract _DistributeItemSystem is System, AuthRoles {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public onlyAdmin(components) returns (bytes memory) {
    (address[] memory accounts, uint32 itemIndex, uint256[] memory amounts) = abi.decode(
      arguments,
      (address[], uint32, uint256[])
    );
    require(accounts.length == amounts.length, "length mismatch");

    for (uint256 i = 0; i < accounts.length; i++) {
      uint256 accID = LibAccount.getByOwner(components, accounts[i]); // reverts if not an account
      LibInventory.incFor(components, accID, itemIndex, amounts[i]);
    }
    return "";
  }

  function executeTyped(
    address[] memory accounts,
    uint32 itemIndex,
    uint256[] memory amounts
  ) public onlyAdmin(components) returns (bytes memory) {
    return execute(abi.encode(accounts, itemIndex, amounts));
  }
}
