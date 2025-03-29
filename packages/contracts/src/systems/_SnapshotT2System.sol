// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibFlag } from "libraries/LibFlag.sol";
import { LibInventory, GACHA_TICKET_INDEX } from "libraries/LibInventory.sol";

uint256 constant ID = uint256(keccak256("system.setup.snapshot.t2"));

uint32 constant PASSPORT_BOX = 21002;

contract _SnapshotT2System is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function distributePassports(address[] memory owners, uint256[] memory amts) public onlyOwner {
    require(owners.length == amts.length, "array length mismatch");
    for (uint256 i; i < owners.length; i++) {
      distributePassport(owners[i], amts[i]);
    }
  }

  function whitelistAccounts(address[] memory owners) public onlyOwner {
    for (uint256 i; i < owners.length; i++) {
      whitelist(owners[i]);
    }
  }

  function execute(bytes memory arguments) public returns (bytes memory) {
    require(false, "not implemented");
    return "";
  }

  //////////////////
  // INTERNAL

  function distributePassport(address owner, uint256 amt) internal {
    uint256 accID = uint256(uint160(owner));
    LibInventory.incFor(components, accID, PASSPORT_BOX, amt);
    LibInventory.incFor(components, accID, GACHA_TICKET_INDEX, amt);
  }

  function whitelist(address owner) internal {
    uint256 accID = uint256(uint160(owner));
    LibFlag.set(components, accID, "MINT_WHITELISTED", true);
  }
}
