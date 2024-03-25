// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import { Test, console } from 'forge-std/Test.sol';

import { World } from 'solecs/World.sol';
import { Component } from 'solecs/Component.sol';
import { getAddressById, getComponentById } from 'solecs/utils.sol';
import { QueryFragment, QueryType } from 'solecs/interfaces/Query.sol';
import { LibQuery } from 'solecs/LibQuery.sol';
import { BoolComponent } from 'std-contracts/components/BoolComponent.sol';
import { Uint256Component } from 'std-contracts/components/Uint256Component.sol';

contract GasTest is Test {
  address internal deployer = address(111);

  World world;
  BoolComponent isComp;
  Uint256Component ownerComp;

  function setUp() public virtual {
    vm.startPrank(deployer);
    world = new World();
    world.init();

    isComp = new BoolComponent(address(world), uint256(keccak256('test.Is')));
    ownerComp = new Uint256Component(address(world), uint256(keccak256('test.Owner')));

    vm.stopPrank();
  }

  function testQuery() public {
    uint256 holder = uint256(keccak256('iambagholder'));

    QueryFragment[] memory fragments = new QueryFragment[](2);
    fragments[0] = QueryFragment(QueryType.Has, isComp, '');
    fragments[1] = QueryFragment(QueryType.HasValue, ownerComp, abi.encode(holder));

    createEntity(1, 0);
    createEntity(1, holder);
    uint256 gasstart = gasleft();
    LibQuery.query(fragments);
    console.log('1 entity     : ', gasstart - gasleft());

    createEntity(9, 0);
    createEntity(1, holder);
    gasstart = gasleft();
    LibQuery.query(fragments);
    console.log('10 entities  : ', gasstart - gasleft());

    createEntity(100, 0);
    createEntity(1, holder);
    gasstart = gasleft();
    LibQuery.query(fragments);
    console.log('100 entities : ', gasstart - gasleft());

    createEntity(400, 0);
    createEntity(1, holder);
    gasstart = gasleft();
    LibQuery.query(fragments);
    console.log('500 entities : ', gasstart - gasleft());

    createEntity(500, 0);
    createEntity(1, holder);
    gasstart = gasleft();
    LibQuery.query(fragments);
    console.log('1000 entities: ', gasstart - gasleft());

    createEntity(500, 0);
    createEntity(1, holder);
    gasstart = gasleft();
    LibQuery.query(fragments);
    console.log('1500 entities: ', gasstart - gasleft());

    createEntity(500, 0);
    createEntity(1, holder);
    gasstart = gasleft();
    LibQuery.query(fragments);
    console.log('2000 entities: ', gasstart - gasleft());

    createEntity(500, 0);
    createEntity(1, holder);
    gasstart = gasleft();
    LibQuery.query(fragments);
    console.log('2500 entities: ', gasstart - gasleft());
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
