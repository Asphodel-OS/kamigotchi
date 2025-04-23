// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import "tests/utils/SetupTemplate.t.sol";

/// @notice item test template
contract ItemTemplate is SetupTemplate {
  function setUp() public virtual override {
    super.setUp();
  }

  function _createLootbox(
    uint32 index,
    string memory name,
    uint32[] memory keys,
    uint[] memory weights
  ) public virtual returns (uint256 id) {
    vm.startPrank(deployer);
    id = __ItemRegistrySystem.createConsumable(
      abi.encode(index, "ACCOUNT", name, "description", "LOOTBOX", "media")
    );
    __ItemRegistrySystem.addAlloDT(abi.encode(index, "USE", keys, weights, 1));
    vm.stopPrank();
  }
}
