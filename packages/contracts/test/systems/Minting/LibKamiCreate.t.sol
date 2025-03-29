// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;

import "./MintTemplate.t.sol";

import { TraitStats } from "libraries/LibTraitRegistry.sol";

contract KamiCreationTest is MintTemplate {
  /////////////////
  // TESTS

  function testKamiCreateShape() public {
    _initStockTraits();

    createKami();
    createKami(10);
  }

  function testKamiCreateBasicTraits() public {
    _initBasicTraits(); // all trait indices = 0

    uint256 kamiID = createKami();
    assertEq(kamiID, calcExpectedStats(KamiTraits(0, 0, 0, 0, 0)));
  }

  function testKamiCreateIndex(uint256 startKamis) public {
    uint256 maxKamis = 111;
    startKamis = startKamis % maxKamis;
    _initStockTraits();
    vm.startPrank(deployer);
    __721BatchMinterSystem.setTraits();
    __721BatchMinterSystem.batchMint(startKamis);
    vm.stopPrank();

    // minting 1 more
    uint256 kamiID = createKami();
    assertEq(startKamis + 1, _IndexKamiComponent.get(kamiID));
    assertEq(LibKami.genID(uint32(startKamis + 1)), kamiID);
  }

  /////////////////
  // UTILS

  function createKami() internal returns (uint256) {
    return ExternalCaller.createKami();
  }

  function createKami(uint256 amt) internal returns (uint256[] memory) {
    return ExternalCaller.createKami(amt);
  }
}
