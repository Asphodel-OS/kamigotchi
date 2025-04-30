// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import "tests/utils/SetupTemplate.t.sol";

contract TradeTest is SetupTemplate {
  function setUp() public override {
    super.setUp();

    vm.roll(_currBlock++);

    vm.startPrank(deployer);
    _IndexRoomComponent.set(alice.id, 66);
    _IndexRoomComponent.set(bob.id, 66);
    _IndexRoomComponent.set(charlie.id, 66);
    vm.stopPrank();
  }

  /// @notice creates and cancels
  function testTradeShape() public {
    // create
    uint32 buyIndex = 1;
    uint256 buyAmt = 3;
    uint32 sellIndex = 2;
    uint256 sellAmt = 5;
    _giveItem(alice, sellIndex, sellAmt);
    uint256 tradeID = _createTrade(alice, buyIndex, buyAmt, sellIndex, sellAmt, 0);

    // checking sell balance
    assertEq(_getItemBal(LibTrade.genSellAnchor(tradeID), sellIndex), sellAmt);
    assertEq(_getItemBal(alice, sellIndex), 0);

    // checking buy balance
    assertEq(_KeysComponent.get(LibTrade.genBuyAnchor(tradeID))[0], buyIndex);
    assertEq(_ValuesComponent.get(LibTrade.genBuyAnchor(tradeID))[0], buyAmt);

    // cancelling
    _cancelTrade(alice, tradeID);

    // checking sell balance
    assertEq(_getItemBal(LibTrade.genSellAnchor(tradeID), sellIndex), 0);
    assertEq(_getItemBal(alice, sellIndex), sellAmt);

    // checking buy balance
    assertFalse(_KeysComponent.has(LibTrade.genBuyAnchor(tradeID)));
    assertFalse(_ValuesComponent.has(LibTrade.genBuyAnchor(tradeID)));
  }

  function testTradeModify() public {
    // create
    uint32 buyIndex = 1;
    uint256 buyAmt = 3;
    uint32 sellIndex = 2;
    uint256 sellAmt = 5;
    _giveItem(alice, sellIndex, sellAmt);
    uint256 tradeID = _createTrade(alice, buyIndex, buyAmt, sellIndex, sellAmt, 0);

    // checking sell balance
    assertEq(_getItemBal(LibTrade.genSellAnchor(tradeID), sellIndex), sellAmt);
    assertEq(_getItemBal(alice, sellIndex), 0);

    // checking buy balance
    assertEq(_KeysComponent.get(LibTrade.genBuyAnchor(tradeID))[0], buyIndex);
    assertEq(_ValuesComponent.get(LibTrade.genBuyAnchor(tradeID))[0], buyAmt);

    // modifying
    uint32 newBuyIndex = 11;
    uint32 newSellIndex = 12;
    _giveItem(alice, newSellIndex, sellAmt);
    _modifyTrade(alice, tradeID, newBuyIndex, buyAmt, newSellIndex, sellAmt, 0);

    // checking sell balance
    assertEq(_getItemBal(LibTrade.genSellAnchor(tradeID), newSellIndex), sellAmt);
    assertEq(_getItemBal(alice, newSellIndex), 0);
    assertEq(_getItemBal(LibTrade.genSellAnchor(tradeID), sellIndex), 0);
    assertEq(_getItemBal(alice, sellIndex), sellAmt);

    // checking buy balance
    assertEq(_KeysComponent.get(LibTrade.genBuyAnchor(tradeID))[0], newBuyIndex);
    assertEq(_ValuesComponent.get(LibTrade.genBuyAnchor(tradeID))[0], buyAmt);
  }

  function testTradeBasic() public {
    // create
    uint32 buyIndex = 1;
    uint256 buyAmt = 3;
    uint32 sellIndex = 2;
    uint256 sellAmt = 5;
    _giveItem(alice, sellIndex, sellAmt);
    _giveItem(bob, buyIndex, buyAmt);
    uint256 tradeID = _createTrade(alice, buyIndex, buyAmt, sellIndex, sellAmt, 0);

    // executing
    _executeTrade(bob, tradeID);
    assertEq(_getItemBal(LibTrade.genSellAnchor(tradeID), sellIndex), 0);
    assertEq(_getItemBal(bob, sellIndex), sellAmt);
    assertEq(_getItemBal(bob, buyIndex), 0);
    assertEq(_getItemBal(alice, buyIndex), buyAmt);
    assertEq(_getItemBal(alice, sellIndex), 0);
  }

  function testTradeModifyPermissions() public {
    uint32 buyIndex = 1;
    uint256 buyAmt = 3;
    uint32 sellIndex = 2;
    uint256 sellAmt = 5;
    _giveItem(alice, sellIndex, sellAmt);
    _giveItem(bob, buyIndex, buyAmt);
    uint256 tradeID = _createTrade(alice, buyIndex, buyAmt, sellIndex, sellAmt, 0);

    // wrong account
    vm.expectRevert();
    _modifyTrade(bob, tradeID, buyIndex, buyAmt, sellIndex, sellAmt, 0);
  }

  function testTradeCancelPermissions() public {
    uint32 buyIndex = 1;
    uint256 buyAmt = 3;
    uint32 sellIndex = 2;
    uint256 sellAmt = 5;
    _giveItem(alice, sellIndex, sellAmt);
    _giveItem(bob, buyIndex, buyAmt);
    uint256 tradeID = _createTrade(alice, buyIndex, buyAmt, sellIndex, sellAmt, 0);

    // wrong account
    vm.expectRevert();
    _cancelTrade(bob, tradeID);
  }

  function testTradeTargeted() public {
    uint32 buyIndex = 1;
    uint256 buyAmt = 3;
    uint32 sellIndex = 2;
    uint256 sellAmt = 5;
    _giveItem(alice, sellIndex, sellAmt);
    _giveItem(bob, buyIndex, buyAmt);
    uint256 tradeID = _createTrade(alice, buyIndex, buyAmt, sellIndex, sellAmt, bob.id);

    // wrong target
    vm.expectRevert();
    _executeTrade(charlie, tradeID);
  }

  /////////////////
  // HELPERS

  function _createTrade(
    PlayerAccount memory acc,
    uint32 buyIndex,
    uint256 buyAmt,
    uint32 sellIndex,
    uint256 sellAmt,
    uint256 targetID
  ) public returns (uint256) {
    uint32[] memory buyIndices = new uint32[](1);
    buyIndices[0] = buyIndex;
    uint256[] memory buyAmts = new uint256[](1);
    buyAmts[0] = buyAmt;
    uint32[] memory sellIndices = new uint32[](1);
    sellIndices[0] = sellIndex;
    uint256[] memory sellAmts = new uint256[](1);
    sellAmts[0] = sellAmt;
    return _createTrade(acc, buyIndices, buyAmts, sellIndices, sellAmts, targetID);
  }

  function _createTrade(
    PlayerAccount memory acc,
    uint32[] memory buyIndices,
    uint256[] memory buyAmts,
    uint32[] memory sellIndices,
    uint256[] memory sellAmts,
    uint256 targetID
  ) public returns (uint256) {
    vm.startPrank(acc.owner);
    bytes memory tradeID = _TradeCreateSystem.executeTyped(
      buyIndices,
      buyAmts,
      sellIndices,
      sellAmts,
      targetID
    );
    vm.stopPrank();
    return abi.decode(tradeID, (uint256));
  }

  function _cancelTrade(PlayerAccount memory acc, uint256 tradeID) public {
    vm.startPrank(acc.owner);
    _TradeCancelSystem.executeTyped(tradeID);
    vm.stopPrank();
  }

  function _executeTrade(PlayerAccount memory acc, uint256 tradeID) public {
    vm.startPrank(acc.owner);
    _TradeExecuteSystem.executeTyped(tradeID);
    vm.stopPrank();
  }

  function _modifyTrade(
    PlayerAccount memory acc,
    uint256 tradeID,
    uint32 buyIndex,
    uint256 buyAmt,
    uint32 sellIndex,
    uint256 sellAmt,
    uint256 targetID
  ) public {
    uint32[] memory buyIndices = new uint32[](1);
    buyIndices[0] = buyIndex;
    uint256[] memory buyAmts = new uint256[](1);
    buyAmts[0] = buyAmt;
    uint32[] memory sellIndices = new uint32[](1);
    sellIndices[0] = sellIndex;
    uint256[] memory sellAmts = new uint256[](1);
    sellAmts[0] = sellAmt;
    _modifyTrade(acc, tradeID, buyIndices, buyAmts, sellIndices, sellAmts, targetID);
  }

  function _modifyTrade(
    PlayerAccount memory acc,
    uint256 tradeID,
    uint32[] memory buyIndices,
    uint256[] memory buyAmts,
    uint32[] memory sellIndices,
    uint256[] memory sellAmts,
    uint256 targetID
  ) public {
    vm.startPrank(acc.owner);
    _TradeModifySystem.executeTyped(tradeID, buyIndices, buyAmts, sellIndices, sellAmts, targetID);
    vm.stopPrank();
  }
}
