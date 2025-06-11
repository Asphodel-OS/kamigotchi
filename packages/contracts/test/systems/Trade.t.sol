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
    _giveItem(alice, MUSU_INDEX, 100);
    _giveItem(alice, sellIndex, sellAmt);
    uint256 tradeID = _createTrade(alice, buyIndex, buyAmt, sellIndex, sellAmt, 0);
    uint256 buyAnchor = LibTrade.genBuyAnchor(tradeID);
    uint256 sellAnchor = LibTrade.genSellAnchor(tradeID);

    // checking buy/sell anchors and balances
    assertEq(_getItemBal(tradeID, sellIndex), sellAmt);
    assertEq(_getItemBal(alice, sellIndex), 0);
    assertEq(_getItemBal(alice, MUSU_INDEX), 97);
    assertEq(_KeysComponent.get(buyAnchor)[0], buyIndex);
    assertEq(_ValuesComponent.get(buyAnchor)[0], buyAmt);
    assertEq(_KeysComponent.get(sellAnchor)[0], sellIndex);
    assertEq(_ValuesComponent.get(sellAnchor)[0], sellAmt);

    // cancel the trade
    _cancelTrade(alice, tradeID);

    // checking buy and sell anchor settings
    assertEq(_getItemBal(tradeID, sellIndex), 0);
    assertEq(_getItemBal(alice, sellIndex), sellAmt);
    assertEq(_getItemBal(alice, MUSU_INDEX), 97);
    assertFalse(_KeysComponent.has(buyAnchor));
    assertFalse(_ValuesComponent.has(buyAnchor));
    assertFalse(_KeysComponent.has(sellAnchor));
    assertFalse(_ValuesComponent.has(sellAnchor));
  }

  function testTradeBasic() public {
    // create
    uint32 buyIndex = 3;
    uint256 buyAmt = 3;
    uint32 sellIndex = 2;
    uint256 sellAmt = 5;
    _giveItem(alice, sellIndex, sellAmt);
    _giveItem(alice, MUSU_INDEX, 100);
    _giveItem(bob, buyIndex, buyAmt);

    // create
    uint256 tradeID = _createTrade(alice, buyIndex, buyAmt, sellIndex, sellAmt, 0);
    assertEq(_getItemBal(alice, buyIndex), 0);
    assertEq(_getItemBal(alice, sellIndex), 0);
    assertEq(_getItemBal(tradeID, buyIndex), 0);
    assertEq(_getItemBal(tradeID, sellIndex), sellAmt);
    assertEq(_getItemBal(bob, buyIndex), buyAmt);
    assertEq(_getItemBal(bob, sellIndex), 0);

    // execute
    _executeTrade(bob, tradeID);
    assertEq(_getItemBal(alice, buyIndex), 0);
    assertEq(_getItemBal(alice, sellIndex), 0);
    assertEq(_getItemBal(tradeID, buyIndex), buyAmt);
    assertEq(_getItemBal(tradeID, sellIndex), 0);
    assertEq(_getItemBal(bob, buyIndex), 0);
    assertEq(_getItemBal(bob, sellIndex), sellAmt);

    // completing
    _completeTrade(alice, tradeID);
    assertEq(_getItemBal(alice, buyIndex), buyAmt);
    assertEq(_getItemBal(alice, sellIndex), 0);
    assertEq(_getItemBal(tradeID, buyIndex), 0);
    assertEq(_getItemBal(tradeID, sellIndex), 0);
    assertEq(_getItemBal(bob, buyIndex), 0);
    assertEq(_getItemBal(bob, sellIndex), sellAmt);
  }

  function testTradeCancelPermissions() public {
    uint32 buyIndex = 1;
    uint256 buyAmt = 3;
    uint32 sellIndex = 2;
    uint256 sellAmt = 5;
    _giveItem(alice, sellIndex, sellAmt);
    _giveItem(alice, MUSU_INDEX, 100);
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
    _giveItem(alice, MUSU_INDEX, 100);
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

  function _completeTrade(PlayerAccount memory acc, uint256 tradeID) public {
    vm.startPrank(acc.owner);
    _TradeCompleteSystem.executeTyped(tradeID);
    vm.stopPrank();
  }
}
