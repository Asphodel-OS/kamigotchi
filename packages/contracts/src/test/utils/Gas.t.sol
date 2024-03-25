// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import { console } from "forge-std/Test.sol";

import { QueryFragment, QueryType } from "solecs/interfaces/Query.sol";
import { LibQuery } from "solecs/LibQuery.sol";
import { LibSafeQuery } from "libraries/utils/LibSafeQuery.sol";

import { BoolComponent } from "std-contracts/components/BoolComponent.sol";
import { Uint256BareComponent } from "std-contracts/components/Uint256BareComponent.sol";
import { Uint256Component } from "std-contracts/components/Uint256Component.sol";

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

  function testIsQueryVsCacheComp() public {
    uint256 holder = uint256(keccak256("iambagholder"));

    vm.prank(deployer);
    Uint256BareComponent bareComp = new Uint256BareComponent(
      address(world),
      uint256(keccak256("test.Bare"))
    );
    vm.startPrank(deployer);
    uint256 id = world.getUniqueEntityId();
    isComp.set(id);
    ownerComp.set(id, holder);
    bareComp.set(holder, id);

    // reading to make all warm
    isComp.has(id);
    ownerComp.getValue(id);
    bareComp.getValue(holder);
    vm.stopPrank();

    createEntity(1, 0);
    createEntity(1, holder);
    uint256 gasstart = gasleft();
    LibSafeQuery.getIsWithValue(ownerComp, isComp, abi.encode(holder));
    console.log("1 entity     : ", gasstart - gasleft());
    gasstart = gasleft();
    if (bareComp.has(holder)) bareComp.getValue(holder);
    console.log("1 cache     : ", gasstart - gasleft());
    gasstart = gasleft();
    ownerComp.getEntitiesWithValue(abi.encode(holder))[0];
    console.log("1 entitiesWVal: ", gasstart - gasleft());

    createEntity(9, 0);
    gasstart = gasleft();
    LibSafeQuery.getIsWithValue(ownerComp, isComp, abi.encode(holder));
    console.log("10 entities  : ", gasstart - gasleft());
    gasstart = gasleft();
    if (bareComp.has(holder)) bareComp.getValue(holder);
    console.log("10 cache    : ", gasstart - gasleft());
    gasstart = gasleft();
    ownerComp.getEntitiesWithValue(abi.encode(holder))[0];
    console.log("10 entitiesWVal: ", gasstart - gasleft());

    createEntity(100, 0);
    gasstart = gasleft();
    LibSafeQuery.getIsWithValue(ownerComp, isComp, abi.encode(holder));
    console.log("100 entities : ", gasstart - gasleft());
    gasstart = gasleft();
    if (bareComp.has(holder)) bareComp.getValue(holder);
    console.log("100 cache   : ", gasstart - gasleft());
    gasstart = gasleft();
    ownerComp.getEntitiesWithValue(abi.encode(holder))[0];
    console.log("100 entitiesWVal: ", gasstart - gasleft());

    createEntity(400, 0);
    gasstart = gasleft();
    LibSafeQuery.getIsWithValue(ownerComp, isComp, abi.encode(holder));
    console.log("500 entities : ", gasstart - gasleft());
    gasstart = gasleft();
    if (bareComp.has(holder)) bareComp.getValue(holder);
    console.log("500 cache   : ", gasstart - gasleft());
    gasstart = gasleft();
    ownerComp.getEntitiesWithValue(abi.encode(holder))[0];
    console.log("500 entitiesWVal: ", gasstart - gasleft());

    createEntity(500, 0);
    gasstart = gasleft();
    LibSafeQuery.getIsWithValue(ownerComp, isComp, abi.encode(holder));
    console.log("1000 entities: ", gasstart - gasleft());
    gasstart = gasleft();
    if (bareComp.has(holder)) bareComp.getValue(holder);
    console.log("1000 cache  : ", gasstart - gasleft());
    gasstart = gasleft();
    ownerComp.getEntitiesWithValue(abi.encode(holder))[0];
    console.log("1000 entitiesWVal: ", gasstart - gasleft());

    createEntity(500, 0);
    gasstart = gasleft();
    LibSafeQuery.getIsWithValue(ownerComp, isComp, abi.encode(holder));
    console.log("1500 entities: ", gasstart - gasleft());
    gasstart = gasleft();
    if (bareComp.has(holder)) bareComp.getValue(holder);
    console.log("1500 cache  : ", gasstart - gasleft());
    gasstart = gasleft();
    ownerComp.getEntitiesWithValue(abi.encode(holder))[0];
    console.log("1500 entitiesWVal: ", gasstart - gasleft());

    createEntity(500, 0);
    gasstart = gasleft();
    LibSafeQuery.getIsWithValue(ownerComp, isComp, abi.encode(holder));
    console.log("2000 entities: ", gasstart - gasleft());
    gasstart = gasleft();
    if (bareComp.has(holder)) bareComp.getValue(holder);
    console.log("2000 cache  : ", gasstart - gasleft());
    gasstart = gasleft();
    ownerComp.getEntitiesWithValue(abi.encode(holder))[0];
    console.log("2000 entitiesWVal: ", gasstart - gasleft());

    createEntity(500, 0);
    gasstart = gasleft();
    LibSafeQuery.getIsWithValue(ownerComp, isComp, abi.encode(holder));
    console.log("2500 entities: ", gasstart - gasleft());
    gasstart = gasleft();
    if (bareComp.has(holder)) bareComp.getValue(holder);
    console.log("2500 cache  : ", gasstart - gasleft());
    gasstart = gasleft();
    ownerComp.getEntitiesWithValue(abi.encode(holder))[0];
    console.log("2500 entitiesWVal: ", gasstart - gasleft());
  }

  function testQuery() public {
    uint256 holder = uint256(keccak256("iambagholder"));

    QueryFragment[] memory fragments = new QueryFragment[](2);
    fragments[0] = QueryFragment(QueryType.Has, isComp, "");
    fragments[1] = QueryFragment(QueryType.HasValue, ownerComp, abi.encode(holder));

    createEntity(1, 0);
    createEntity(1, holder);
    uint256 gasstart = gasleft();
    LibQuery.query(fragments);
    console.log("1 entity     : ", gasstart - gasleft());

    createEntity(9, 0);
    createEntity(1, holder);
    gasstart = gasleft();
    LibQuery.query(fragments);
    console.log("10 entities  : ", gasstart - gasleft());

    createEntity(100, 0);
    createEntity(1, holder);
    gasstart = gasleft();
    LibQuery.query(fragments);
    console.log("100 entities : ", gasstart - gasleft());

    createEntity(400, 0);
    createEntity(1, holder);
    gasstart = gasleft();
    LibQuery.query(fragments);
    console.log("500 entities : ", gasstart - gasleft());

    createEntity(500, 0);
    createEntity(1, holder);
    gasstart = gasleft();
    LibQuery.query(fragments);
    console.log("1000 entities: ", gasstart - gasleft());

    createEntity(500, 0);
    createEntity(1, holder);
    gasstart = gasleft();
    LibQuery.query(fragments);
    console.log("1500 entities: ", gasstart - gasleft());

    createEntity(500, 0);
    createEntity(1, holder);
    gasstart = gasleft();
    LibQuery.query(fragments);
    console.log("2000 entities: ", gasstart - gasleft());

    createEntity(500, 0);
    createEntity(1, holder);
    gasstart = gasleft();
    LibQuery.query(fragments);
    console.log("2500 entities: ", gasstart - gasleft());
  }

  function createEntity(uint256 amount, uint256 holderID) internal {
    vm.startPrank(deployer);
    for (uint256 i = 0; i < amount; i++) {
      uint256 id = world.getUniqueEntityId();
      isComp.set(id);
      ownerComp.set(id, holderID == 0 ? id : holderID);

      // reading to make all warm
      isComp.has(id);
      ownerComp.getValue(id);
    }
    vm.stopPrank();
  }
}
