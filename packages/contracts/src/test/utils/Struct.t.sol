// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import { console } from "forge-std/Test.sol";

import { LibQuery, QueryFragment, QueryType } from "solecs/LibQuery.sol";
import { Stat } from "components/types/Stat.sol";

import { Uint256BareComponent } from "components/base/Uint256BareComponent.sol";
import { LocationComponent } from "components/LocationComponent.sol";
import { StatComponent } from "components/base/StatComponent.sol";

import { Coord } from "components/LocationComponent.sol";

import { EmptyWorld } from "test/utils/EmptyWorld.t.sol";

contract StructTest is EmptyWorld {
  Uint256BareComponent uintComp;
  LocationComponent locComp;
  StatComponent statComp;

  function setUp() public override {
    super.setUp();

    vm.startPrank(deployer);

    uintComp = new Uint256BareComponent(address(world), uint256(keccak256("test.Uint")));
    locComp = new LocationComponent(address(world));
    statComp = new StatComponent(address(world), uint256(keccak256("test.Stat")));

    vm.stopPrank();
  }

  function testGasCosts() public {
    uint256 id = 111;
    uint256 gasstart;
    vm.startPrank(deployer);

    // cold write
    console.log("Costs: cold write");
    // uint256
    gasstart = gasleft();
    uintComp.set(id, 111);
    console.log("Uint256 bare: ", gasstart - gasleft());
    // location
    gasstart = gasleft();
    locComp.set(id, Coord(1, 1, 0));
    console.log("Coord: ", gasstart - gasleft());
    // stat
    gasstart = gasleft();
    statComp.set(id, Stat(1, 1, 1, 1));
    console.log("Stat: ", gasstart - gasleft());

    // warm read
    console.log("Costs: warm read");
    // uint256
    gasstart = gasleft();
    uintComp.get(id);
    console.log("Uint256 bare: ", gasstart - gasleft());
    // location
    gasstart = gasleft();
    locComp.get(id);
    console.log("Coord: ", gasstart - gasleft());
    // stat
    gasstart = gasleft();
    statComp.get(id);
    console.log("Stat: ", gasstart - gasleft());

    // warm has
    console.log("Costs: warm has");
    // uint256
    gasstart = gasleft();
    uintComp.has(id);
    console.log("Uint256 bare: ", gasstart - gasleft());
    // location
    gasstart = gasleft();
    locComp.has(id);
    console.log("Coord: ", gasstart - gasleft());
    // stat
    gasstart = gasleft();
    statComp.has(id);
    console.log("Stat: ", gasstart - gasleft());

    // warm write
    console.log("Costs: warm write");
    // uint256
    gasstart = gasleft();
    uintComp.set(id, 222);
    console.log("Uint256 bare: ", gasstart - gasleft());
    // location
    gasstart = gasleft();
    locComp.set(id, Coord(2, 2, 0));
    console.log("Coord: ", gasstart - gasleft());
    // stat
    gasstart = gasleft();
    statComp.set(id, Stat(2, 2, 2, 0));
    console.log("Stat: ", gasstart - gasleft());
  }

  function testVisibilityCosts() public {
    uint256 gasstart;

    gasstart = gasleft();
    uint256 a = isPublicView(0);
    console.log("Public view: ", gasstart - gasleft());

    gasstart = gasleft();
    uint256 b = isInternalView(0);
    console.log("Internal view: ", gasstart - gasleft());

    gasstart = gasleft();
    uint256 c = isPublicPure(0);
    console.log("Public pure: ", gasstart - gasleft());

    gasstart = gasleft();
    uint256 d = isInternalPure(0);
    console.log("Internal pure: ", gasstart - gasleft());

    gasstart = gasleft();
    uint256 e = 1;
    console.log("Raw: ", gasstart - gasleft());
  }

  function isPublicView(uint256 id) public view returns (uint256) {
    return 1;
  }

  function isInternalView(uint256 id) internal view returns (uint256) {
    return 1;
  }

  function isPublicPure(uint256 id) public pure returns (uint256) {
    return 1;
  }

  function isInternalPure(uint256 id) internal pure returns (uint256) {
    return 1;
  }
}
