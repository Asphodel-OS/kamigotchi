// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import "./MintTemplate.t.sol";

import { Kami721 } from "tokens/Kami721.sol";
import { LibGacha } from "libraries/LibGacha.sol";
import { LibKami721 } from "libraries/LibKami721.sol";
import { MUSU_INDEX } from "libraries/LibInventory.sol";

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
    uint256[] memory commitIDs = _mint(alice, 3);
    assertPoolAmt(poolAmt + 3);
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

  /// @notice a claim larger than the current pool is fine while 721 supply remains,
  ///         since creation tops the pool up before the reveal draws from it
  function testGachaMintExceedingPoolWithHeadroom() public {
    _batchMint(1);
    assertPoolAmt(1);

    uint256[] memory commitIDs = _mint(alice, 3);
    assertPoolAmt(4); // three created, none withdrawn yet

    _reveal(commitIDs);
    assertPoolAmt(1);
  }

  /// @notice at max 721 supply the mint stops creating kami, and the claim is served
  ///         by drawing the existing pool down instead
  function testGachaMintAtMaxSupply() public {
    Kami721 nft = LibKami721.getContract(components);
    uint256 max = nft.MAX_SUPPLY();

    // fill the 721 to its cap, seeding the entire supply into the pool
    _batchMint(2222);
    vm.startPrank(deployer);
    while (nft.totalSupply() < max) {
      uint256 left = max - nft.totalSupply();
      __721BatchMinterSystem.batchMint(left > 2222 ? 2222 : left);
    }
    vm.stopPrank();
    assertEq(nft.totalSupply(), max, "expected the 721 at max supply");
    assertPoolAmt(max);

    // the mint no longer tops the pool up
    uint256 commitID = _mint(alice);
    assertEq(nft.totalSupply(), max, "supply moved past max on mint");
    assertPoolAmt(max); // nothing created, nothing withdrawn yet

    // and the reveal draws the claim out of what is already there
    _reveal(commitID);
    assertEq(nft.totalSupply(), max, "supply moved past max on reveal");
    assertPoolAmt(max - 1);
  }

  /// @notice at the cap, unrevealed commits reserve pool kamis: a claim beyond the free
  ///         pool is refused before the ticket burn, and reveals release the reservation
  function testGachaMintOvercommitAtMaxSupply() public {
    _batchMint(3);
    _fillSupplyOutsidePool();
    assertPoolAmt(3);
    assertEq(LibGacha.getNumFree(components), 3, "unexpected free pool");

    // every free kami is claimed, nothing revealed yet
    uint256[] memory commits = _mint(bob, 3);
    assertPoolAmt(3);
    assertEq(LibGacha.getNumPending(components), 3, "unexpected pending");
    assertEq(LibGacha.getNumFree(components), 0, "expected no free pool");

    // a further claim is refused and the ticket is kept
    _giveItem(alice, GACHA_TICKET_INDEX, 1);
    vm.prank(alice.owner);
    vm.expectRevert("gacha pool exhausted");
    _KamiGachaMintSystem.executeTyped(1);
    assertEq(_getItemBal(alice, GACHA_TICKET_INDEX), 1, "ticket consumed on refused claim");

    // revealing serves every accepted claim and drains the pool
    _reveal(commits);
    assertPoolAmt(0);
    assertEq(LibGacha.getNumPending(components), 0, "pending not released");
  }

  /// @notice a reroll deposit is spoken for by the reroller's own commit, so a
  ///         concurrent mint cannot draw it out and strand the reveal
  function testGachaRerollDepositNotClaimableAtMaxSupply() public {
    _batchMint(3);
    _fillSupplyOutsidePool();
    uint256 first = _mintKami(bob);
    uint256 second = _mintKami(bob);
    assertPoolAmt(1);

    // bob's two deposits are reserved for his own commits; only the last free kami is open
    uint256[] memory kamis = new uint256[](2);
    kamis[0] = first;
    kamis[1] = second;
    uint256[] memory reCommits = _reroll(bob, kamis);
    assertPoolAmt(3);
    assertEq(LibGacha.getNumFree(components), 1, "reroll deposit left unreserved");

    uint256 aliceCommit = _mint(alice);
    assertEq(LibGacha.getNumFree(components), 0, "expected no free pool");
    _giveItem(alice, GACHA_TICKET_INDEX, 1);
    vm.prank(alice.owner);
    vm.expectRevert("gacha pool exhausted");
    _KamiGachaMintSystem.executeTyped(1);

    // bob's reveal still finds both, whichever order the reveals land in
    _reveal(aliceCommit);
    uint256[] memory results = _reveal(reCommits);
    assertEq(results.length, 2, "reroll reveal short");
    assertPoolAmt(0);
    assertEq(LibGacha.getNumPending(components), 0, "pending not released");
  }

  /// @notice on an empty pool a reroll is refused before the ticket burn
  function testGachaRerollRefusedOnEmptyPool() public {
    _batchMint(1);
    _fillSupplyOutsidePool();
    uint256 kami = _mintKami(bob);
    assertPoolAmt(0);

    uint256[] memory kamis = new uint256[](1);
    kamis[0] = kami;
    _giveItem(bob, REROLL_TICKET_INDEX, 1);
    vm.prank(bob.owner);
    vm.expectRevert("gacha pool exhausted");
    _KamiGachaRerollSystem.reroll(kamis);
    assertEq(_getItemBal(bob, REROLL_TICKET_INDEX), 1, "reroll ticket consumed on refused reroll");
    _assertOutGacha(kami, 1, 1);
  }

  /// @notice a forced reveal releases the reservation like a regular one
  function testGachaForceRevealReleasesPending() public {
    _batchMint(1);
    _fillSupplyOutsidePool();
    uint256 commitID = _mint(alice);
    assertEq(LibGacha.getNumPending(components), 1, "unexpected pending");

    vm.roll(_currBlock += 300); // past the blockhash window
    uint256[] memory ids = new uint256[](1);
    ids[0] = commitID;
    vm.prank(deployer);
    _KamiGachaRevealSystem.forceReveal(ids);
    assertEq(LibGacha.getNumPending(components), 0, "pending not released");
    assertPoolAmt(0);
  }

  /// @notice commits made before the counter existed reveal without underflowing it
  function testGachaRevealSaturatesUncountedPending() public {
    _batchMint(1);
    uint256 commitID = _mint(alice);
    _setData(0, 0, "GACHA_COMMITS_PENDING", 0);

    _reveal(commitID);
    assertEq(LibGacha.getNumPending(components), 0, "pending underflowed or stuck");
  }

  /// @notice ticket sales stop once nothing can be drawn; unrelated auctions are untouched.
  ///         gacha tickets stay on sale while creation can still top the pool up
  function testGachaTicketAuctionsStopOnEmptyPool() public {
    uint32 otherIndex = 777;
    _createGenericItem(MUSU_INDEX);
    _createGenericItem(GACHA_TICKET_INDEX);
    _createGenericItem(REROLL_TICKET_INDEX);
    _createGenericItem(otherIndex);
    vm.startPrank(deployer);
    __AuctionRegistrySystem.create(
      GACHA_TICKET_INDEX,
      MUSU_INDEX,
      10,
      86400,
      750000,
      32,
      1000,
      block.timestamp
    );
    __AuctionRegistrySystem.create(
      REROLL_TICKET_INDEX,
      MUSU_INDEX,
      10,
      86400,
      750000,
      32,
      1000,
      block.timestamp
    );
    __AuctionRegistrySystem.create(
      otherIndex,
      MUSU_INDEX,
      10,
      86400,
      750000,
      32,
      1000,
      block.timestamp
    );
    vm.stopPrank();
    _giveItem(alice, MUSU_INDEX, 1e9);

    // empty pool with 721 headroom: gacha tickets sell, reroll tickets do not
    _buyAuction(alice, GACHA_TICKET_INDEX, false);
    _buyAuction(alice, REROLL_TICKET_INDEX, true);

    // one free kami at the cap: both sell
    _batchMint(1);
    _fillSupplyOutsidePool();
    _buyAuction(alice, GACHA_TICKET_INDEX, false);
    _buyAuction(alice, REROLL_TICKET_INDEX, false);

    // drained: neither sells, the unrelated auction still does
    _mintKami(bob);
    assertPoolAmt(0);
    _buyAuction(alice, GACHA_TICKET_INDEX, true);
    _buyAuction(alice, REROLL_TICKET_INDEX, true);
    _buyAuction(alice, otherIndex, false);
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

  /// @notice a duplicated kami ID in a reroll must revert: rolls are priced by
  ///         array length but the pool deposit is an idempotent set, so a repeat
  ///         would surrender one kami while receiving two rolls (supply inflation)
  function testGachaRerollDuplicateReverts() public {
    _batchMint(2);
    uint256 petUser = _mintKami(alice);

    uint256[] memory ids = new uint256[](2);
    ids[0] = petUser;
    ids[1] = petUser;
    vm.roll(++_currBlock);
    _giveItem(alice, REROLL_TICKET_INDEX, 2);
    vm.prank(alice.owner);
    vm.expectRevert("LibArray: detected duplicate in array");
    _KamiGachaRerollSystem.reroll(ids);
  }

  /// @notice a duplicated commit ID in a gacha reveal reverts explicitly
  function testGachaRevealDuplicateReverts() public {
    _batchMint(2);
    uint256 commitID = _mint(alice);

    uint256[] memory ids = new uint256[](2);
    ids[0] = commitID;
    ids[1] = commitID;
    vm.roll(++_currBlock);
    vm.prank(alice.owner);
    vm.expectRevert("LibArray: detected duplicate in array");
    _KamiGachaRevealSystem.reveal(ids);
  }

  ///////////
  // UTILS //
  ///////////

  function _buyAuction(PlayerAccount memory acc, uint32 itemIndex, bool expectExhausted) internal {
    uint256 before = _getItemBal(acc, itemIndex);
    vm.prank(acc.owner);
    if (expectExhausted) vm.expectRevert("gacha pool exhausted");
    _AuctionBuySystem.executeTyped(itemIndex, 1);
    assertEq(
      _getItemBal(acc, itemIndex),
      expectExhausted ? before : before + 1,
      "unexpected ticket balance"
    );
  }

  /// @dev mints raw 721s outside the pool up to the cap, so the pool stays small at max supply
  function _fillSupplyOutsidePool() internal {
    Kami721 nft = LibKami721.getContract(components);
    uint256 max = nft.MAX_SUPPLY();
    vm.startPrank(address(__721BatchMinterSystem));
    for (uint256 id = nft.totalSupply() + 1; id <= max; id++) nft.mint(address(0xBEEF), id);
    vm.stopPrank();
    assertEq(nft.totalSupply(), max, "expected the 721 at max supply");
  }

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
