// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import { console } from "forge-std/Test.sol";

import { LibQuery, QueryFragment, QueryType } from "solecs/LibQuery.sol";

import { BoolComponent } from "components/base/BoolComponent.sol";
import { Uint256BareComponent } from "components/base/Uint256BareComponent.sol";
import { Uint256Component } from "components/base/Uint256Component.sol";

import { EmptyWorld } from "test/utils/EmptyWorld.t.sol";

contract GasTest is EmptyWorld {
  BoolComponent isComp;
  Uint256Component ownerComp;

  function setUp() public override {
    super.setUp();

    vm.startPrank(deployer);

    isComp = new BoolComponent(address(world), uint256(keccak256("test.Is")));
    ownerComp = new Uint256Component(address(world), uint256(keccak256("test.Owner")));

    vm.stopPrank();
  }

  function createEntity(uint256 amount, uint256 holderID) internal {
    vm.startPrank(deployer);
    for (uint256 i = 0; i < amount; i++) {
      uint256 id = world.getUniqueEntityId();
      isComp.set(id);
      ownerComp.set(id, holderID == 0 ? id : holderID);

      // reading to make all warm
      isComp.has(id);
      ownerComp.get(id);
    }
    vm.stopPrank();
  }
}
