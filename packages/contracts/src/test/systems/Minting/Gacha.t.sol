// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { GACHA_ID } from "libraries/LibGacha.sol";
import "test/utils/SetupTemplate.t.sol";

/** @dev
 * this focuses on the gacha, with a strong emphasis on checking invarients
 * and proper component values
 */
contract GachaTest is SetupTemplate {
  function setUp() public override {
    super.setUp();

    _initStockTraits();

    _setConfig("GACHA_REROLL_PRICE", 1);
  }

  function setUpMint() public override {
    return;
  }

  /////////////////
  // GACHA TESTS //
  /////////////////

  function testSingleMintState() public {
    uint256 ogPet = _batchMint(1)[0];
    _assertInGacha(ogPet);

    address owner = _owners[0];

    vm.roll(++_currBlock);
    _giveMint20(0, 1);
    vm.prank(owner);
    uint256 commitID = abi.decode(_PetGachaMintSystem.executeTyped(1), (uint256[]))[0];
    _assertCommit(commitID, 0, _currBlock, 0);

    uint256 newPet = _revealSingle(commitID);
    _assertOutGacha(newPet, 0, 1);

    assertEq(ogPet, newPet);
  }

  function testGachaQuantity() public {
    uint256 numInGacha = 5000;
    _batchMint(numInGacha);

    _mintPet(0);
  }

  function testSingleReroll() public {
    uint256[] memory ogPool = _batchMint(2);

    address owner = _owners[0];

    // minting first pet
    uint256 petUser = _mintPet(0);
    uint256 petPool = ogPool[0] == petUser ? ogPool[1] : ogPool[0];

    // checking pet states
    _assertOutGacha(petUser, 0, 1);
    _assertInGacha(petPool);

    // rerolling
    uint256 cost = _getRerollCost(1);
    uint256[] memory petUserArr = new uint256[](1);
    petUserArr[0] = petUser;
    uint256[] memory reCommits = _reroll(0, cost, petUserArr);
    _assertCommit(reCommits[0], 0, _currBlock, 1);
    vm.roll(++_currBlock);
    petUser = _PetGachaRevealSystem.reveal(reCommits)[0];
    petPool = ogPool[0] == petUser ? ogPool[1] : ogPool[0];
    _assertOutGacha(petUser, 0, 2);
    _assertInGacha(petPool);

    // rerolling again
    cost = _getRerollCost(2);
    petUserArr[0] = petUser;
    reCommits = _reroll(0, cost, petUserArr);
    _assertCommit(reCommits[0], 0, _currBlock, 2);
    vm.roll(++_currBlock);
    petUser = _PetGachaRevealSystem.reveal(reCommits)[0];
    petPool = ogPool[0] == petUser ? ogPool[1] : ogPool[0];
    _assertOutGacha(petUser, 0, 3);
    _assertInGacha(petPool);
  }

  function testMultipleReroll() public {
    uint256[] memory ogPool = _batchMint(10);

    address owner = _owners[0];

    // minting first pet
    uint256[] memory userPets = _mintPets(0, 3);

    // reroll the first pet, replace it with result
    uint256 cost = _getRerollCost(1);
    uint256[] memory petUserArr = new uint256[](1);
    petUserArr[0] = userPets[0];
    uint256[] memory reCommits = _reroll(0, cost, petUserArr);
    vm.roll(++_currBlock);
    userPets[0] = _PetGachaRevealSystem.reveal(reCommits)[0];
    _assertOutGacha(userPets[0], 0, 2);

    // reroll first two pets, but fail pricing
    uint256[] memory petUserArr2 = new uint256[](2);
    petUserArr2[0] = userPets[0];
    petUserArr2[1] = userPets[1];
    vm.roll(++_currBlock);
    vm.deal(owner, cost);
    vm.prank(owner);
    vm.expectRevert("not enough ETH");
    _PetGachaRerollSystem.reroll{ value: cost }(petUserArr2);

    // reroll first two pets, but correct pricing
    cost = _getRerollCost(1) + _getRerollCost(2);
    uint256[] memory reCommits2 = _reroll(0, cost, petUserArr2);
    vm.roll(++_currBlock);
    uint256[] memory outputs = _PetGachaRevealSystem.reveal(reCommits2);
    _assertOutGacha(outputs[0], 0, 3);
    _assertOutGacha(outputs[1], 0, 2);
  }

  // commented to test faster - it takes a few minutes
  // function testMultiple(uint256 mint1, uint256 mint2, uint256 mint3) public {
  //   vm.assume(mint1 < 256 && mint1 > 0);
  //   vm.assume(mint2 < 256 && mint2 > 0);
  //   vm.assume(mint3 < 256 && mint3 > 0);

  //   uint256[] memory ogPool = _batchMint(1000);

  //   uint256[] memory commits = new uint256[](mint1 + mint2 + mint3);

  //   // creating commits
  //   vm.roll(++_currBlock);
  //   _giveMint20(1, mint1);
  //   vm.prank(_owners[1]);
  //   uint256[] memory petMint1 = abi.decode(_PetGachaMintSystem.executeTyped(mint1), (uint256[]));
  //   vm.roll(++_currBlock);
  //   _giveMint20(2, mint2);
  //   vm.prank(_owners[2]);
  //   uint256[] memory petMint2 = abi.decode(_PetGachaMintSystem.executeTyped(mint2), (uint256[]));
  //   vm.roll(++_currBlock);
  //   _giveMint20(3, mint3);
  //   vm.prank(_owners[3]);
  //   uint256[] memory petMint3 = abi.decode(_PetGachaMintSystem.executeTyped(mint3), (uint256[]));
  //   for (uint256 i = 0; i < mint1; i++) commits[i] = petMint1[i];
  //   for (uint256 i = 0; i < mint2; i++) commits[i + mint1] = petMint2[i];
  //   for (uint256 i = 0; i < mint3; i++) commits[i + mint1 + mint2] = petMint3[i];

  //   // mixing commits - actual sorting is tested below, no need to test heavily here
  //   uint256[] memory randCommits = new uint256[](commits.length);
  //   for (uint256 i = 0; i < commits.length; i++) {
  //     randCommits[i] = commits[i];
  //   }
  //   // uint256 swap = randCommits[1000 % randCommits.length];
  //   // randCommits[1000 % randCommits.length] = randCommits[randCommits.length - 1];
  //   // randCommits[randCommits.length - 1] = swap;

  //   // revealing
  //   vm.roll(++_currBlock);
  //   uint256[] memory results = _PetGachaRevealSystem.reveal(randCommits);

  //   // checking results
  //   for (uint256 i; i < mint1; i++) {
  //     assertEq(_IdAccountComponent.get(results[i]), _getAccount(1));
  //   }
  //   for (uint256 i = mint1; i < mint1 + mint2; i++) {
  //     assertEq(_IdAccountComponent.get(results[i]), _getAccount(2));
  //   }
  //   for (uint256 i = mint1 + mint2; i < mint1 + mint2 + mint3; i++) {
  //     assertEq(_IdAccountComponent.get(results[i]), _getAccount(3));
  //   }
  // }

  function testDistribution() public {
    uint256 length = 33;
    uint256[] memory ogPool = _batchMint(length);
    uint256[] memory counts = new uint256[](length + 1);

    address owner = _owners[0];

    // minting first pet
    vm.roll(++_currBlock);
    _giveMint20(0, 1);
    vm.prank(owner);
    uint256[] memory commits = abi.decode(_PetGachaMintSystem.executeTyped(1), (uint256[]));
    vm.roll(++_currBlock);
    uint256[] memory resultPets = _PetGachaRevealSystem.reveal(commits);
    counts[LibPet.getIndex(components, resultPets[0]) - 1]++;

    for (uint256 i = 0; i < 1000; i++) {
      uint256 cost = _getRerollCost(i + 1);
      uint256[] memory reCommits = _reroll(0, cost, resultPets);
      vm.roll(++_currBlock);
      resultPets[0] = _PetGachaRevealSystem.reveal(reCommits)[0];
      counts[LibPet.getIndex(components, resultPets[0]) - 1]++;
    }

    for (uint256 i = 0; i < length; i++) {
      console.log("pet %s: %s", i + 1, counts[i]);
    }
  }

  ///////////////
  // LIB TESTS //
  ///////////////

  function testSort(uint256 seed, uint256 length) public {
    length = (length % 100) + 1; // limit sort test :( otherwise is too long

    _batchMint(200);

    // fill array with random numbers
    uint256[] memory ogIDs = new uint256[](length);
    uint256[] memory ogIndices = new uint256[](length);
    for (uint256 i = 0; i < length; i++) {
      uint256 id = world.getUniqueEntityId();
      ogIDs[i] = id;
      ogIndices[i] = uint256(keccak256(abi.encode(id, seed)));

      vm.prank(deployer);
      _ValueComponent.set(id, ogIndices[i]);
    }

    // sort
    uint256[] memory sortedIDs = LibGacha.sortCommits(components, ogIDs);

    // check sort
    uint256 curr;
    for (uint256 i = 0; i < length; i++) {
      uint256 val = _ValueComponent.get(sortedIDs[i]);
      assertTrue(val >= curr);
      curr = val;
    }
  }

  ///////////
  // UTILS //
  ///////////

  function _batchMint(uint256 amount) internal returns (uint256[] memory results) {
    vm.startPrank(deployer);
    __721BatchMinterSystem.setTraits();
    results = __721BatchMinterSystem.batchMint(amount);
    vm.stopPrank();
  }

  function _reroll(
    uint256 accountIndex,
    uint256 cost,
    uint256[] memory petIDs
  ) internal returns (uint256[] memory results) {
    vm.roll(++_currBlock);
    vm.deal(_owners[accountIndex], cost);
    vm.prank(_owners[accountIndex]);
    results = _PetGachaRerollSystem.reroll{ value: cost }(petIDs);
  }

  function _revealSingle(uint256 commitID) internal returns (uint256) {
    vm.roll(++_currBlock);
    uint256[] memory commits = new uint256[](1);
    commits[0] = commitID;
    return _PetGachaRevealSystem.reveal(commits)[0];
  }

  function _getRerollCost(uint256 rerolls) internal view returns (uint256) {
    return LibGacha.calcRerollCost(components, rerolls);
  }

  ////////////////
  // ASSERTIONS //
  ////////////////

  function _assertInGacha(uint256 petID) internal {
    assertEq(_IDOwnsPetComponent.get(petID), GACHA_ID);
    assertTrue(!_RerollComponent.has(petID));
  }

  function _assertOutGacha(uint256 petID, uint256 account, uint256 rerolls) internal {
    account = _getAccount(account);
    assertEq(_IDOwnsPetComponent.get(petID), account);
    assertEq(_RerollComponent.get(petID), rerolls);
    assertEq(_StateComponent.get(petID), "RESTING");
  }

  function _assertCommit(
    uint256 id,
    uint256 account,
    uint256 revealBlock,
    uint256 rerolls
  ) internal {
    account = _getAccount(account);
    assertTrue(rerolls == 0 ? !_RerollComponent.has(id) : _RerollComponent.get(id) == rerolls);
    assertTrue(_ValueComponent.has(id));
    assertEq(_IdAccountComponent.get(id), account);
    assertEq(_BlockRevealComponent.get(id), revealBlock);
    assertEq(_TypeComponent.get(id), "GACHA_COMMIT");
  }
}
