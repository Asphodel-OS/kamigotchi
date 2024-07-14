// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "test/utils/SetupTemplate.t.sol";

import { PlayerSystem } from "systems/base/PlayerSystem.sol";

uint256 constant LiveSystemID = uint256(keccak256("system.Player.Live"));

contract PlayerSystemTest is SetupTemplate {
  LiveSystem internal _LiveSystem;

  function setUp() public override {
    super.setUp();

    vm.startPrank(deployer);
    _LiveSystem = new LiveSystem(world, address(components));
    world.registerSystem(address(_LiveSystem), LiveSystemID);
    vm.stopPrank();
  }

  function testPausable() public {
    // run per normal
    _LiveSystem.executeTyped(1);

    // pause
    vm.prank(deployer);
    __ConfigSetSystem.setValueBool("PAUSED", true);

    // run when paused
    vm.expectRevert("Game paused");
    _LiveSystem.executeTyped(1);

    // unpause
    vm.prank(deployer);
    __ConfigSetSystem.setValueBool("PAUSED", false);

    // run when unpaused
    _LiveSystem.executeTyped(1);
  }
}

contract LiveSystem is PlayerSystem {
  constructor(IWorld _world, address _components) PlayerSystem(_world, _components) {}

  function execute(bytes memory arguments) public notPaused returns (bytes memory) {
    uint256 id = abi.decode(arguments, (uint256));
    return abi.encode(id);
  }

  function executeTyped(uint256 id) public notPaused returns (bytes memory) {
    return execute(abi.encode(id));
  }
}
