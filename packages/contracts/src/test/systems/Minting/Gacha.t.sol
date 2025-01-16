// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;

import { GACHA_ID } from "libraries/LibGacha.sol";
import "tests/utils/SetupTemplate.t.sol";

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

  function setUpTraits() public override {}

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
    _giveGachaTicket(alice, 1);
    vm.prank(owner);
    uint256 commitID = abi.decode(_KamiGachaMintSystem.executeTyped(1), (uint256[]))[0];
    _assertCommit(commitID, 0, _currBlock, 0);

    uint256 newPet = _revealSingle(commitID);
    _assertOutGacha(newPet, 0, 1);

    assertEq(ogPet, newPet);
  }

  function testGachaQuantity() public {
    uint256 numInGacha = 5000;
    _batchMint(numInGacha);

    _mintKami(0);
  }

  function testSingleReroll() public {
    uint256[] memory ogPool = _batchMint(2);

    address owner = _owners[0];

    // minting first pet
    uint256 petUser = _mintKami(0);
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
    petUser = _KamiGachaRevealSystem.reveal(reCommits)[0];
    petPool = ogPool[0] == petUser ? ogPool[1] : ogPool[0];
    _assertOutGacha(petUser, 0, 2);
    _assertInGacha(petPool);

    // rerolling again
    cost = _getRerollCost(2);
    petUserArr[0] = petUser;
    reCommits = _reroll(0, cost, petUserArr);
    _assertCommit(reCommits[0], 0, _currBlock, 2);
    vm.roll(++_currBlock);
    petUser = _KamiGachaRevealSystem.reveal(reCommits)[0];
    petPool = ogPool[0] == petUser ? ogPool[1] : ogPool[0];
    _assertOutGacha(petUser, 0, 3);
    _assertInGacha(petPool);
  }

  function testMultipleReroll() public {
    uint256[] memory ogPool = _batchMint(10);

    address owner = _owners[0];

    // minting first pet
    uint256[] memory userPets = _mintKamis(0, 3);

    // reroll the first pet, replace it with result
    uint256 cost = _getRerollCost(1);
    uint256[] memory petUserArr = new uint256[](1);
    petUserArr[0] = userPets[0];
    uint256[] memory reCommits = _reroll(0, cost, petUserArr);
    vm.roll(++_currBlock);
    userPets[0] = _KamiGachaRevealSystem.reveal(reCommits)[0];
    _assertOutGacha(userPets[0], 0, 2);

    // reroll first two pets, but fail pricing
    uint256[] memory petUserArr2 = new uint256[](2);
    petUserArr2[0] = userPets[0];
    petUserArr2[1] = userPets[1];
    vm.roll(++_currBlock);
    _mintOnyx(cost, owner);
    vm.prank(owner);
    vm.expectRevert(); // not enough, implicit overflow check
    _KamiGachaRerollSystem.reroll(petUserArr2);

    // reroll first two pets, but correct pricing
    cost = _getRerollCost(1) + _getRerollCost(2);
    uint256[] memory reCommits2 = _reroll(0, cost, petUserArr2);
    vm.roll(++_currBlock);
    uint256[] memory outputs = _KamiGachaRevealSystem.reveal(reCommits2);
    // account for sort
    if (reCommits2[1] < reCommits2[0]) {
      uint256 temp = outputs[0];
      outputs[0] = outputs[1];
      outputs[1] = temp;
    }
    _assertOutGacha(outputs[0], 0, 3);
    _assertOutGacha(outputs[1], 0, 2);
  }

  function testDistribution() public {
    uint256 length = 33;
    uint256[] memory ogPool = _batchMint(length);
    uint256[] memory counts = new uint256[](length + 1);

    address owner = _owners[0];

    // minting first pet
    vm.roll(++_currBlock);
    _giveGachaTicket(alice, 1);
    vm.prank(owner);
    uint256[] memory commits = abi.decode(_KamiGachaMintSystem.executeTyped(1), (uint256[]));
    vm.roll(++_currBlock);
    uint256[] memory resultPets = _KamiGachaRevealSystem.reveal(commits);
    counts[LibKami.getIndex(components, resultPets[0]) - 1]++;

    for (uint256 i = 0; i < 1000; i++) {
      uint256 cost = _getRerollCost(i + 1);
      uint256[] memory reCommits = _reroll(0, cost, resultPets);
      vm.roll(++_currBlock);
      resultPets[0] = _KamiGachaRevealSystem.reveal(reCommits)[0];
      counts[LibKami.getIndex(components, resultPets[0]) - 1]++;
    }

    for (uint256 i = 0; i < length; i++) {
      console.log("pet %s: %s", i + 1, counts[i]);
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
    uint256[] memory kamiIDs
  ) internal returns (uint256[] memory results) {
    vm.roll(++_currBlock);
    _mintOnyx(cost, _owners[accountIndex]);
    _approveOnyx(_owners[accountIndex], address(_KamiGachaRerollSystem));
    vm.prank(_owners[accountIndex]);
    results = _KamiGachaRerollSystem.reroll(kamiIDs);
  }

  function _revealSingle(uint256 commitID) internal returns (uint256) {
    vm.roll(++_currBlock);
    uint256[] memory commits = new uint256[](1);
    commits[0] = commitID;
    return _KamiGachaRevealSystem.reveal(commits)[0];
  }

  function _getRerollCost(uint256 rerolls) internal view returns (uint256) {
    return LibGacha.calcRerollCost(components, rerolls);
  }

  ////////////////
  // ASSERTIONS //
  ////////////////

  function _assertInGacha(uint256 kamiID) internal {
    assertEq(_IDOwnsKamiComponent.get(kamiID), GACHA_ID);
    assertTrue(!_RerollComponent.has(kamiID));
  }

  function _assertOutGacha(uint256 kamiID, uint256 account, uint256 rerolls) internal {
    account = _getAccount(account);
    assertEq(_IDOwnsKamiComponent.get(kamiID), account);
    assertEq(_RerollComponent.get(kamiID), rerolls);
    assertEq(_StateComponent.get(kamiID), "RESTING");
  }

  function _assertCommit(
    uint256 id,
    uint256 account,
    uint256 revealBlock,
    uint256 rerolls
  ) internal {
    account = _getAccount(account);
    assertTrue(rerolls == 0 ? !_RerollComponent.has(id) : _RerollComponent.get(id) == rerolls);
    assertEq(_IdHolderComponent.get(id), account);
    assertEq(_BlockRevealComponent.get(id), revealBlock);
    assertEq(_TypeComponent.get(id), "GACHA_COMMIT");
  }
}
