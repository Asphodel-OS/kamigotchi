// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import { console } from "forge-std/Test.sol";

import { LibQuery, QueryFragment, QueryType } from "solecs/LibQuery.sol";
import { getAddrByID, getIdByAddress } from "solecs/utils.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { LibString } from "solady/utils/LibString.sol";

import { BoolComponent } from "solecs/components/BoolComponent.sol";
import { Uint256BareComponent } from "solecs/components/Uint256BareComponent.sol";
import { Uint256Component } from "solecs/components/Uint256Component.sol";
import { StringComponent } from "solecs/components/StringComponent.sol";
import { System } from "solecs/System.sol";

import { EmptyWorld } from "test/utils/EmptyWorld.t.sol";
import { LibComp } from "libraries/utils/LibComp.sol";

uint256 constant IsCompID = uint256(keccak256("test.Is"));
uint256 constant OwnerCompID = uint256(keccak256("test.Owner"));
uint256 constant StringCompID = uint256(keccak256("test.String"));
uint256 constant TestSystemID = uint256(keccak256("test.system"));

contract SetSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory args) public override returns (bytes memory) {
    (uint256 entity, uint256 value) = abi.decode(args, (uint256, uint256));
    Uint256Component(getAddrByID(components, OwnerCompID)).set(entity, value);
    return "";
  }
}

contract GasTest is EmptyWorld {
  BoolComponent isComp;
  Uint256Component ownerComp;
  StringComponent stringComp;
  SetSystem testSystem;

  function setUp() public override {
    super.setUp();

    vm.startPrank(deployer);

    isComp = new BoolComponent(address(world), IsCompID);
    ownerComp = new Uint256Component(address(world), OwnerCompID);
    stringComp = new StringComponent(address(world), StringCompID);
    testSystem = new SetSystem(world, address(world.components()));
    world.registerSystem(address(testSystem), TestSystemID);
    ownerComp.authorizeWriter(address(testSystem));
    isComp.authorizeWriter(address(testSystem));
    stringComp.authorizeWriter(address(testSystem));

    vm.stopPrank();
  }

  function testGasWrite() public {
    SetSystem sys = testSystem;
    uint256 gasstart = gasleft();
    sys.execute(abi.encode(1, 2));
    console.log("write cost:", gasstart - gasleft());
  }

  function testGasInc() public {
    vm.startPrank(deployer);
    ownerComp.set(1, 2);

    uint256 gasstart = gasleft();
    // LibComp.inc(ownerComp, 1, 2);
    console.log("inc cost:", gasstart - gasleft());

    gasstart = gasleft();
    // ownerComp.incer(1, 2);
    console.log("incer cost:", gasstart - gasleft());
  }
  function testGasReverseQuery() public {
    vm.prank(deployer);
    ownerComp.set(1, 2);

    uint256 gasstart = gasleft();
    address addr = getAddrByID(ownerComp, 2);
    console.log("reverse query cost:", gasstart - gasleft());

    gasstart = gasleft();
    uint256 ider = getIdByAddress(ownerComp, address(1));
    console.log("straight cost:", gasstart - gasleft());

    gasstart = gasleft();
    uint256(uint160(2));
    console.log("addrToEntity cost:", gasstart - gasleft());

    gasstart = gasleft();
    ownerComp.get(1);
    console.log("direct cost:", gasstart - gasleft());

    gasstart = gasleft();
    ownerComp.getRaw(1);
    console.log("getRaw cost:", gasstart - gasleft());

    gasstart = gasleft();
    ownerComp.safeGet(1);
    console.log("safeGet cost:", gasstart - gasleft());

    gasstart = gasleft();
    if (ownerComp.has(1)) ownerComp.get(1);
    console.log("has cost:", gasstart - gasleft());

    gasstart = gasleft();
    uint256 ider2 = ownerComp.get(1);
    console.log("direct cost:", gasstart - gasleft());
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
