// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;

import "tests/utils/SetupTemplate.t.sol";

/// @notice item test template
contract ItemTemplate is SetupTemplate {
  function setUp() public virtual override {
    super.setUp();
  }

  function setUpItems() public virtual override {}

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
