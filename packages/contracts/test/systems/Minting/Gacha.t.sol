// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;

import "./MintTemplate.t.sol";

/** @dev
 * this focuses on the gacha, with a strong emphasis on checking invarients
 * and proper component values
 */
contract GachaTest is MintTemplate {
  function setUp() public override {
    super.setUp();

    _initStockTraits();
  }

  /////////////////
  // GACHA TESTS //
  /////////////////

  function testGachaSingleMintState() public {
    uint256 ogPet = _batchMint(1)[0];
    _assertInGacha(ogPet);

    address owner = _owners[0];

    vm.roll(++_currBlock);
    _giveGachaTicket(alice, 1);
    vm.prank(owner);
    uint256 commitID = abi.decode(_KamiGachaMintSystem.executeTyped(1), (uint256[]))[0];
    _assertCommit(commitID, 0, _currBlock, 0);

    uint256 newPet = _reveal(commitID);
    _assertOutGacha(newPet, 0, 1);

    assertEq(ogPet, newPet);
  }

  function testGachaMintQuantity() public {
    uint256 poolAmt = 2222;
    _batchMint(poolAmt);
    assertPoolAmt(poolAmt);

    // minting 0, no change
    _mint(alice, 0);
    assertPoolAmt(poolAmt);

    // minting 1
    uint256 commitID = _mint(alice);
    assertPoolAmt(poolAmt + 1); // new kami created, target not yet withdrawn
    uint256 kamiID = _reveal(commitID); // target withdrawn
    assertPoolAmt(poolAmt);

    // minting a few
    uint256[] memory commitIDs = _mint(alice, 7);
    assertPoolAmt(poolAmt + 7);
    _reveal(commitIDs);
    assertPoolAmt(poolAmt);

    // minting over max
    _giveItem(alice, GACHA_TICKET_INDEX, 100);
    vm.prank(alice.owner);
    vm.expectRevert("too many mints");
    _KamiGachaMintSystem.executeTyped(100);

    // rerolling 1
    commitID = _reroll(alice, kamiID);
    assertPoolAmt(poolAmt + 1); // reroll in, target not yet withdrawn
    kamiID = _reveal(commitID); // target withdrawn
    assertPoolAmt(poolAmt);
  }

  function testGachaRerollSingle() public {
    uint256[] memory ogPool = _batchMint(2);

    // minting first pet
    uint256 petUser = _mintKami(alice);
    uint256 petPool = ogPool[0] == petUser ? ogPool[1] : ogPool[0];

    // checking pet states
    _assertOutGacha(petUser, 0, 1);
    _assertInGacha(petPool);

    // rerolling
    uint256[] memory petUserArr = new uint256[](1);
    petUserArr[0] = petUser;
    uint256[] memory reCommits = _reroll(alice, petUserArr);
    _assertCommit(reCommits[0], 0, _currBlock, 1);
    vm.roll(++_currBlock);
    petUser = _KamiGachaRevealSystem.reveal(reCommits)[0];
    petPool = ogPool[0] == petUser ? ogPool[1] : ogPool[0];
    _assertOutGacha(petUser, 0, 2);
    _assertInGacha(petPool);

    // rerolling again
    petUserArr[0] = petUser;
    reCommits = _reroll(alice, petUserArr);
    _assertCommit(reCommits[0], 0, _currBlock, 2);
    vm.roll(++_currBlock);
    petUser = _KamiGachaRevealSystem.reveal(reCommits)[0];
    petPool = ogPool[0] == petUser ? ogPool[1] : ogPool[0];
    _assertOutGacha(petUser, 0, 3);
    _assertInGacha(petPool);
  }

  function testGachaRerollMultiple() public {
    _batchMint(10);

    // minting first pet
    uint256[] memory userPets = _mintKamis(alice, 3);

    // reroll the first pet, replace it with result
    uint256[] memory petUserArr = new uint256[](1);
    petUserArr[0] = userPets[0];
    uint256[] memory reCommits = _reroll(alice, petUserArr);
    vm.roll(++_currBlock);
    userPets[0] = _KamiGachaRevealSystem.reveal(reCommits)[0];
    _assertOutGacha(userPets[0], 0, 2);

    // reroll first two pets, but fail pricing
    uint256[] memory petUserArr2 = new uint256[](2);
    petUserArr2[0] = userPets[0];
    petUserArr2[1] = userPets[1];
    vm.roll(++_currBlock);

    // reroll first two pets, but correct pricing
    uint256[] memory reCommits2 = _reroll(alice, petUserArr2);
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

  function testGachaDistribution() public {
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
      uint256[] memory reCommits = _reroll(alice, resultPets);
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

  function _reroll(
    PlayerAccount memory acc,
    uint256[] memory kamiIDs
  ) internal returns (uint256[] memory results) {
    vm.roll(++_currBlock);
    _giveItem(acc, REROLL_TICKET_INDEX, kamiIDs.length);
    vm.prank(acc.owner);
    results = _KamiGachaRerollSystem.reroll(kamiIDs);
  }
  function _reroll(PlayerAccount memory acc, uint256 kamiID) internal returns (uint256) {
    uint256[] memory kamiIDs = new uint256[](1);
    kamiIDs[0] = kamiID;
    return _reroll(acc, kamiIDs)[0];
  }

  function _mint(
    PlayerAccount memory acc,
    uint256 amount
  ) internal returns (uint256[] memory results) {
    vm.roll(++_currBlock);
    _giveItem(acc, GACHA_TICKET_INDEX, amount);
    vm.prank(acc.owner);
    return abi.decode(_KamiGachaMintSystem.executeTyped(amount), (uint256[]));
  }

  function _mint(PlayerAccount memory acc) internal returns (uint256) {
    return _mint(acc, 1)[0];
  }

  function _reveal(uint256[] memory commitIDs) internal returns (uint256[] memory) {
    vm.roll(++_currBlock);
    return _KamiGachaRevealSystem.reveal(commitIDs);
  }

  function _reveal(uint256 commitID) internal returns (uint256) {
    uint256[] memory commits = new uint256[](1);
    commits[0] = commitID;
    return _reveal(commits)[0];
  }

  ////////////////
  // ASSERTIONS //
  ////////////////

  function assertPoolAmt(uint256 amount) internal view {
    assertEq(_IDOwnsKamiComponent.size(abi.encode(GACHA_ID)), amount);
  }

  function _assertInGacha(uint256 kamiID) internal view {
    assertEq(_IDOwnsKamiComponent.get(kamiID), GACHA_ID);
    assertTrue(!_RerollComponent.has(kamiID));
  }

  function _assertOutGacha(uint256 kamiID, uint256 account, uint256 rerolls) internal view {
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
  ) internal view {
    account = _getAccount(account);
    assertTrue(rerolls == 0 ? !_RerollComponent.has(id) : _RerollComponent.get(id) == rerolls);
    assertEq(_IdHolderComponent.get(id), account);
    assertEq(_BlockRevealComponent.get(id), revealBlock);
    assertEq(_TypeComponent.get(id), "GACHA_COMMIT");
  }
}
