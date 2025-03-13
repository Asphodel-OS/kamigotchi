// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.28;

import { LibString } from "solady/utils/LibString.sol";
import { SafeCastLib } from "solady/utils/SafeCastLib.sol";
import { Stat } from "solecs/components/types/Stat.sol";

import { Condition } from "libraries/LibConditional.sol";
import { Coord } from "libraries/LibRoom.sol";
import { MUSU_INDEX, GACHA_TICKET_INDEX } from "libraries/LibInventory.sol";

import "./TestSetupImports.t.sol";
import { InitWorld } from "deployment/InitWorld.s.sol";
import { LibDeployTokens } from "deployment/LibDeployTokens.s.sol";

import { LibEntityType } from "libraries/utils/LibEntityType.sol";
import { LibGetter } from "libraries/utils/LibGetter.sol";

abstract contract SetupTemplate is TestSetupImports {
  using LibString for string;
  using SafeCastLib for int32;
  using SafeCastLib for uint256;

  struct PlayerAccount {
    uint256 id;
    uint32 index; // testIndex (from 0) ≠ accountIndex (from 1) - need to fix
    address operator;
    address owner;
  }

  uint256 _currTime;
  uint256 _idleRequirement;
  mapping(uint256 => PlayerAccount) internal _accounts;
  address[] internal _owners;
  mapping(address => address) internal _operators; // owner => operator
  uint256 internal _currBlock;

  // Global accounts
  PlayerAccount alice;
  PlayerAccount bob;
  PlayerAccount charlie;

  // Global indices - may be overwritten by tests
  uint32 KAMI_FOOD_INDEX;
  uint32 KAMI_REVIVE_INDEX;

  // Token vars
  Kami721 _Kami721;
  OpenMintable _Onyx;

  constructor() MudTest() {}

  //////////////////
  // SETUP

  function setUp() public virtual override {
    setUpWorld();
    setUpTokens();

    setUpConfigs();
    setUpTime();
    _idleRequirement = LibConfig.get(components, "KAMI_STANDARD_COOLDOWN") + 1;

    setUpAccounts();
    setUpAuthRoles();
    setUpTraits();
    setUpMint();
    setUpItems();
    setUpRooms();
    setUpNodes();
  }

  function setUpWorld() public virtual {
    super.setUp();
  }

  function setUpTokens() public virtual {
    vm.startPrank(deployer);
    _Kami721 = Kami721(LibDeployTokens.deployKami721(world, components));
    _Onyx = OpenMintable(LibDeployTokens.deployOnyx20Local(world, components, deployer));
    LibDeployTokens.deployVIP(world, components);
    vm.stopPrank();
  }

  // sets up some default accounts. override to change/remove behaviour if needed
  function setUpAccounts() public virtual {
    _createOwnerOperatorPairs(25); // create 10 pairs of Owners/Operators
    _registerAccounts(10);
    alice = _accounts[0];
    bob = _accounts[1];
    charlie = _accounts[2];
  }

  function setUpAuthRoles() public virtual {
    vm.startPrank(deployer);
    __AuthManageRoleSystem.addRole(deployer, "ROLE_ADMIN");
    __AuthManageRoleSystem.addRole(deployer, "ROLE_COMMUNITY_MANAGER");
    vm.stopPrank();
  }

  // sets up config using init script
  // Controlled by deployment tooling - update there if we want more than configs in the future
  function setUpConfigs() public virtual {
    InitWorld initer = new InitWorld();
    initer.initTests(deployer, address(world));
  }

  // sets up mint to a default state. override to change/remove behaviour if needed
  function setUpMint() public virtual {
    vm.startPrank(deployer);
    __721BatchMinterSystem.setTraits();
    __721BatchMinterSystem.batchMint(100);
    vm.stopPrank();
  }

  // sets up items to a default state. override to change/remove behaviour if needed
  function setUpItems() public virtual {
    KAMI_FOOD_INDEX = 101;
    KAMI_REVIVE_INDEX = 11001;
    _createFood(KAMI_FOOD_INDEX, "Gum", "DESCRIPTION", 25, 0, "");
    _createRevive(KAMI_REVIVE_INDEX, "Ribbon", "DESCRIPTION", 10, "");
  }

  // sets up rooms to a default state. override to change/remove behaviour if needed
  // is a big square with every room connected to each other
  function setUpRooms() public virtual {
    _createRoom("testRoom1", Coord(1, 1, 0), 1, 4);
    _createRoom("testRoom2", Coord(2, 1, 0), 2, 3);
    _createRoom("testRoom3", Coord(1, 2, 0), 3, 2);
    _createRoom("testRoom4", Coord(2, 2, 0), 4, 1);
  }

  function setUpNodes() public virtual {
    _createHarvestingNode(1, 1, "Test Node", "this is a node", "NORMAL");
    _createHarvestingNode(2, 1, "Test Node", "this is a node", "SCRAP");
    _createHarvestingNode(3, 2, "Test Node", "this is a node", "EERIE");
    _createHarvestingNode(4, 2, "Test Node", "this is a node", "INSECT");
  }

  function setUpTime() public virtual {
    _currTime = 5 minutes;
    vm.warp(_currTime);
  }

  function setUpTraits() public virtual {
    _initCommonTraits();
  }

  function _fastForward(uint timeDelta) internal {
    _currTime += timeDelta;
    vm.warp(_currTime);
  }

  /////////////////
  // ERC20

  function _getTokenBal(address tokenAddr, address owner) internal view returns (uint256) {
    OpenMintable token = OpenMintable(tokenAddr);
    return token.balanceOf(owner);
  }

  function _createERC20(string memory name, string memory symbol) internal returns (address) {
    OpenMintable erc20 = new OpenMintable(name, symbol);
    return address(erc20);
  }

  function _approveERC20(address token, address owner, address spender) internal {
    OpenMintable erc20 = OpenMintable(token);
    vm.prank(owner);
    erc20.approve(spender, type(uint256).max);
  }

  function _approveERC20(address token, address owner) internal {
    return _approveERC20(token, owner, address(_TokenAllowanceComponent));
  }

  /// @dev automatically converts to 15dp (game token units, mToken)
  function _mintERC20(address tokenAddr, uint256 amount, address to) internal {
    OpenMintable token = OpenMintable(tokenAddr);
    token.mint(to, amount * 1e15);
  }

  function _mintOnyx(uint256 amount, address to) internal {
    return _mintERC20(LibERC20.getOnyxAddr(components), amount, to);
  }

  function _approveOnyx(address owner, address spender) internal {
    return _approveERC20(LibERC20.getOnyxAddr(components), owner, spender);
  }

  /////////////////
  // EOAs

  // get an owner by its (testing) EOA index
  function _getOwner(uint playerIndex) internal view returns (address) {
    require(playerIndex < _owners.length, "playerIndex out of bounds");
    return _owners[playerIndex];
  }

  // get an operator by its (testing) EOA playerIndex
  function _getOperator(uint playerIndex) internal view returns (address) {
    require(playerIndex < _owners.length, "playerIndex out of bounds");
    return _operators[_owners[playerIndex]];
  }

  function _getPlayerAccount(uint playerIndex) internal view returns (PlayerAccount memory) {
    return _accounts[playerIndex];
  }

  // create multiple sets of owner/operator pair addresses
  function _createOwnerOperatorPairs(uint n) internal {
    for (uint i = 0; i < n; i++) {
      _createOwnerOperatorPair();
    }
  }

  // create a set of owner/operator pair addresses
  function _createOwnerOperatorPair() internal returns (address) {
    address owner = _getNextUserAddress();
    _owners.push(owner);
    _operators[owner] = _getNextUserAddress();
    return owner;
  }

  /////////////////
  // ACCOUNT MANAGEMENT

  function _fundAccount(uint playerIndex, uint amount) internal {
    uint256 accID = _getAccount(playerIndex);
    vm.startPrank(deployer);
    LibInventory.incFor(components, accID, MUSU_INDEX, amount);
    // LibInventory.logItemTotal(components, accID, MUSU_INDEX, amount);
    LibData.inc(components, accID, MUSU_INDEX, "ITEM_TOTAL", amount);
    vm.stopPrank();
  }

  function _getAccountBalance(uint playerIndex) internal view returns (uint) {
    uint accID = _getAccount(playerIndex);
    return LibInventory.getBalanceOf(components, accID, MUSU_INDEX);
  }

  // get an account by the Owner address' testing playerIndex
  function _getAccount(uint playerIndex) internal view returns (uint) {
    require(playerIndex < _owners.length, "index out of bounds");
    address owner = _owners[playerIndex];
    return LibAccount.getByOwner(components, owner);
  }

  // create an account. autogenerate names by the address for simplicity
  function _registerAccount(uint playerIndex) internal returns (uint) {
    address owner = _owners[playerIndex];
    address operator = _operators[owner];

    vm.startPrank(owner);
    // string memory name = LibString.slice(LibString.toHexString(owner), 0, 15); // maxlen 16
    uint256 accID = abi.decode(
      _AccountRegisterSystem.executeTyped(operator, LibString.toString(playerIndex)),
      (uint256)
    );
    vm.stopPrank();

    _accounts[playerIndex] = PlayerAccount(accID, uint32(playerIndex), operator, owner);
    return accID;
  }

  // registers n accounts, starting from 0
  function _registerAccounts(uint n) internal {
    for (uint i = 0; i < n; i++) _registerAccount(i);
  }

  /////////////////
  // OWNER ACTIONS

  function _mintKamis(PlayerAccount memory acc, uint amt) internal returns (uint[] memory) {
    vm.roll(++_currBlock);
    _giveGachaTicket(acc, amt);
    vm.prank(acc.owner);
    uint256[] memory commits = abi.decode(_KamiGachaMintSystem.executeTyped(amt), (uint256[]));

    vm.roll(++_currBlock);
    return _KamiGachaRevealSystem.reveal(commits);
  }

  // (public) mint and reveal multiple pets for a calling address
  function _mintKamis(uint playerIndex, uint amt) internal virtual returns (uint[] memory) {
    return _mintKamis(_accounts[playerIndex], amt);
  }

  function _mintKami(PlayerAccount memory acc) internal returns (uint) {
    return _mintKamis(acc, 1)[0];
  }

  // (public) mint and reveal a single pet to a specified address
  function _mintKami(uint playerIndex) internal virtual returns (uint) {
    return _mintKami(_accounts[playerIndex]);
  }

  /////////////////
  // OPERATOR ACTIONS

  // attempt to move an account if it's not already there
  function _moveAccount(uint playerIndex, uint32 roomIndex) internal {
    if (roomIndex != LibAccount.getRoom(components, _getAccount(playerIndex))) {
      vm.prank(_getOperator(playerIndex));
      _AccountMoveSystem.executeTyped(roomIndex);
    }
  }

  function _moveAccount(PlayerAccount memory acc, uint32 roomIndex) internal {
    _moveAccount(acc.index, roomIndex);
  }

  function _moveAccount(uint playerIndex, Coord memory location) internal {
    uint256 roomID = LibRoom.queryByLocation(components, location);
    return _moveAccount(playerIndex, LibRoom.get(components, roomID));
  }

  function _buyFromListing(uint playerIndex, uint listingID, uint256 amt) internal {
    uint32[] memory amts = new uint32[](1);
    uint32[] memory itemIndices = new uint32[](1);

    amts[0] = uint32(amt);
    itemIndices[0] = _IndexItemComponent.get(listingID);
    uint32 npcIndex = _IndexNPCComponent.get(listingID);

    vm.prank(_getOperator(playerIndex));
    _ListingBuySystem.executeTyped(npcIndex, itemIndices, amts);
  }

  function _sellToListing(uint playerIndex, uint listingID, uint256 amt) internal {
    uint32[] memory amts = new uint32[](1);
    uint32[] memory itemIndices = new uint32[](1);

    amts[0] = uint32(amt);
    itemIndices[0] = _IndexItemComponent.get(listingID);
    uint32 npcIndex = _IndexNPCComponent.get(listingID);

    vm.prank(_getOperator(playerIndex));
    _ListingSellSystem.executeTyped(npcIndex, itemIndices, amts);
  }

  function _feedKami(PlayerAccount memory acc, uint kamiID) internal virtual {
    _giveItem(acc, KAMI_FOOD_INDEX, 1);
    _feedKami(kamiID);
  }

  // uses KAMI_FOOD_INDEX. needs to be overwritten if setUpItems is overridden
  function _feedKami(uint kamiID) internal virtual {
    require(KAMI_FOOD_INDEX != 0, "KAMI_FOOD_INDEX not set");
    uint accID = LibKami.getAccount(components, kamiID);

    vm.prank(LibAccount.getOperator(components, accID));
    _KamiUseItemSystem.executeTyped(kamiID, KAMI_FOOD_INDEX);
  }

  function _reviveKami(PlayerAccount memory acc, uint kamiID) internal {
    _giveItem(acc, KAMI_REVIVE_INDEX, 1);
    _reviveKami(kamiID);
  }

  // uses KAMI_REVIVE_INDEX. needs to be overwritten if setUpItems is overridden
  function _reviveKami(uint kamiID) internal {
    require(KAMI_REVIVE_INDEX != 0, "KAMI_REVIVE_INDEX not set");
    uint accID = LibKami.getAccount(components, kamiID);

    vm.prank(LibAccount.getOperator(components, accID));
    _KamiUseItemSystem.executeTyped(kamiID, KAMI_REVIVE_INDEX);
  }

  function _startHarvestByIndex(uint kamiID, uint32 nodeIndex) internal virtual returns (uint) {
    uint256 nodeID = LibNode.getByIndex(components, nodeIndex);
    return _startHarvest(kamiID, nodeID);
  }

  function _startHarvest(uint kamiID, uint256 nodeID) internal virtual returns (uint) {
    uint accID = LibKami.getAccount(components, kamiID);
    address operator = LibAccount.getOperator(components, accID);

    vm.prank(operator);
    bytes memory harvestID = _HarvestStartSystem.executeTyped(kamiID, nodeID);
    return abi.decode(harvestID, (uint));
  }

  function _stopHarvest(uint harvestID) internal {
    uint kamiID = LibHarvest.getKami(components, harvestID);
    uint accID = LibKami.getAccount(components, kamiID);
    address operator = LibAccount.getOperator(components, accID);

    vm.prank(operator);
    _HarvestStopSystem.executeTyped(harvestID);
  }

  function _collectHarvest(uint harvestID) internal {
    uint kamiID = LibHarvest.getKami(components, harvestID);
    uint accID = LibKami.getAccount(components, kamiID);
    address operator = LibAccount.getOperator(components, accID);

    vm.prank(operator);
    _HarvestCollectSystem.executeTyped(harvestID);
  }

  function _liquidateHarvest(uint attackerID, uint harvestID) internal virtual {
    uint accID = LibKami.getAccount(components, attackerID);
    address operator = LibAccount.getOperator(components, accID);

    vm.prank(operator);
    _HarvestLiquidateSystem.executeTyped(harvestID, attackerID);
  }

  /* QUESTS */

  function _acceptQuest(PlayerAccount memory account, uint32 questIndex) internal returns (uint) {
    return _acceptQuest(account.index, questIndex);
  }

  function _acceptQuest(uint playerIndex, uint32 questIndex) internal virtual returns (uint) {
    vm.prank(_getOperator(playerIndex));
    return abi.decode(_QuestAcceptSystem.executeTyped(questIndex), (uint));
  }

  function _completeQuest(PlayerAccount memory account, uint32 questIndex) internal {
    uint256 questID = LibQuests.getAccQuestIndex(components, account.id, questIndex);
    return _completeQuest(account.index, questID);
  }

  function _completeQuest(uint playerIndex, uint questID) internal virtual {
    vm.prank(_getOperator(playerIndex));
    _QuestCompleteSystem.executeTyped(questID);
  }

  function _dropQuest(PlayerAccount memory account, uint questID) internal {
    return _dropQuest(account.index, questID);
  }

  function _dropQuest(uint playerIndex, uint questID) internal virtual {
    vm.prank(_getOperator(playerIndex));
    _QuestDropSystem.executeTyped(questID);
  }

  function _hasQuest(PlayerAccount memory account, uint32 questIndex) internal view returns (bool) {
    return LibQuests.getAccQuestIndex(components, account.id, questIndex) != 0;
  }

  /* RELATIONSHIP */

  function _advRelationship(uint playerIdx, uint32 npcIdx, uint32 relIdx) internal returns (uint) {
    vm.prank(_getOperator(playerIdx));
    return abi.decode(_RelationshipAdvanceSystem.executeTyped(npcIdx, relIdx), (uint256));
  }

  /* SKILLS */

  function _upgradeSkill(
    PlayerAccount memory acc,
    uint targetID,
    uint32 skillIndex
  ) internal virtual {
    vm.prank(acc.operator);
    _SkillUpgradeSystem.executeTyped(targetID, skillIndex);
  }

  /////////////////
  // GETTERS

  function _getItemBal(PlayerAccount memory player, uint32 index) internal view returns (uint256) {
    return _getItemBal(player.id, index);
  }

  function _getItemBal(uint holderID, uint32 itemIndex) internal view returns (uint) {
    return LibInventory.getBalanceOf(components, holderID, itemIndex);
  }

  /////////////////
  // ADMIN POWERS

  function _giveGachaTicket(PlayerAccount memory acc, uint amount) internal {
    _giveItem(acc, GACHA_TICKET_INDEX, amount);
  }

  function _giveSkillPoint(uint id, uint amt) internal {
    vm.startPrank(deployer);
    LibSkill.incPoints(components, id, amt);
    vm.stopPrank();
  }

  function _giveItem(
    PlayerAccount memory acc,
    uint32 itemIndex,
    uint256 amt
  ) internal returns (uint256 id) {
    vm.startPrank(deployer);
    id = LibInventory.incFor(components, acc.id, itemIndex, amt);
    LibData.inc(components, acc.id, itemIndex, "ITEM_TOTAL", amt); // direct call to avoid public call
    vm.stopPrank();
  }

  function _decItem(PlayerAccount memory acc, uint32 itemIndex, uint256 amt) internal {
    vm.startPrank(deployer);
    LibInventory.decFor(components, acc.id, itemIndex, amt);
    vm.stopPrank();
  }

  function _setLevel(uint256 id, uint256 level) internal {
    vm.startPrank(deployer);
    LibExperience.setLevel(components, id, level);
    vm.stopPrank();
  }

  function _setUint256(IComponent component, uint256 id, uint256 value) internal {
    vm.prank(deployer);
    component.set(id, abi.encode(value));
  }

  function _setUint32(IComponent component, uint256 id, uint32 value) internal {
    vm.prank(deployer);
    component.set(id, abi.encode(value));
  }

  /////////////////
  // STAT MANIPULATION

  function _healKami(uint256 kamiID, int32 amt) internal {
    ExternalCaller.kamiSync(kamiID);
    vm.startPrank(deployer);
    LibKami.heal(components, kamiID, amt);
    vm.stopPrank();
    ExternalCaller.kamiSync(kamiID);
  }

  /////////////////
  // WORLD POPULATION

  function _createFaction(
    uint32 index,
    string memory name,
    string memory description
  ) internal returns (uint256) {
    vm.prank(deployer);
    return __FactionRegistrySystem.create(abi.encode(index, name, description, ""));
  }

  function _createGoal(
    uint32 index,
    uint32 roomIndex,
    Condition memory condition
  ) internal returns (uint256) {
    vm.prank(deployer);
    return
      __GoalRegistrySystem.create(
        abi.encode(
          index,
          "name",
          "description",
          roomIndex,
          condition.type_,
          condition.logic,
          condition.index,
          condition.value
        )
      );
  }

  function _createGoalRequirement(
    uint32 goalIndex,
    Condition memory condition
  ) internal returns (uint256) {
    vm.prank(deployer);
    return
      __GoalRegistrySystem.addRequirement(
        abi.encode(
          goalIndex,
          condition.type_,
          condition.logic,
          condition.index,
          condition.value,
          condition.for_
        )
      );
  }

  // basic reward only
  function _createGoalRewardBasic(
    uint32 goalIndex,
    uint256 minCont,
    string memory type_,
    uint32 index,
    uint256 value
  ) internal returns (uint256) {
    vm.prank(deployer);
    return
      __GoalRegistrySystem.addRewardBasic(
        abi.encode(goalIndex, "name", minCont, type_, index, value)
      );
  }

  function _createGoalRewardDisplay(
    uint32 goalIndex,
    string memory name
  ) internal returns (uint256) {
    vm.prank(deployer);
    return __GoalRegistrySystem.addRewardDisplay(abi.encode(goalIndex, "name"));
  }

  function _createRoom(
    string memory name,
    Coord memory location,
    uint32 index
  ) internal returns (uint256) {
    uint32[] memory exits = new uint32[](0);
    return _createRoom(name, location, index, exits);
  }

  function _createRoom(
    string memory name,
    Coord memory location,
    uint32 index,
    uint32 exitIndex
  ) internal returns (uint256) {
    uint32[] memory exits = new uint32[](1);
    exits[0] = exitIndex;

    return _createRoom(name, location, index, exits);
  }

  function _createRoom(
    string memory name,
    Coord memory location,
    uint32 index,
    uint32[] memory exits
  ) internal returns (uint256) {
    vm.prank(deployer);
    return
      __RoomRegistrySystem.create(
        abi.encode(location.x, location.y, location.z, index, name, "", exits)
      );
  }

  function _createRoomGate(
    uint32 roomIndex,
    uint32 sourceIndex,
    uint32 conditionIndex,
    uint256 conditionValue,
    string memory logicType,
    string memory type_
  ) internal returns (uint256) {
    return
      _createRoomGate(roomIndex, sourceIndex, conditionIndex, conditionValue, logicType, type_, "");
  }

  function _createRoomGate(
    uint32 roomIndex,
    uint32 sourceIndex,
    uint32 conditionIndex,
    uint256 conditionValue,
    string memory logicType,
    string memory type_,
    string memory for_
  ) internal returns (uint256) {
    vm.prank(deployer);
    return
      __RoomRegistrySystem.addGate(
        abi.encode(roomIndex, sourceIndex, conditionIndex, conditionValue, logicType, type_, for_)
      );
  }

  function _createRoomFlag(uint32 roomIndex, string memory flag) internal {
    vm.prank(deployer);
    __RoomRegistrySystem.addFlag(roomIndex, flag);
  }

  function _createHarvestingNode(
    uint32 index,
    uint32 roomIndex,
    string memory name,
    string memory description,
    string memory affinity
  ) internal returns (uint) {
    vm.prank(deployer);
    return
      __NodeRegistrySystem.create(
        abi.encode(index, "HARVEST", roomIndex, name, description, affinity)
      );
  }

  function _createNPC(uint32 index, uint32 roomIndex, string memory name) public returns (uint) {
    vm.prank(deployer);
    return __NPCRegistrySystem.create(abi.encode(index, name, roomIndex));
  }

  /////////////////////////////////////////////
  // REGISTRIES

  /* ITEMS */

  /// @notice creates and empty item index for testing
  function _createGenericItem(uint32 index) public returns (uint256 id) {
    vm.startPrank(deployer);

    id = LibItem.genID(index);
    _IsRegistryComponent.set(id);
    _IndexItemComponent.set(id, index);

    vm.stopPrank();
  }

  function _addItemERC20(uint32 index, address tokenAddress) public {
    vm.startPrank(deployer);
    LibItem.addERC20(components, index, tokenAddress);
    vm.stopPrank();
  }

  function _createConsumable(uint32 index, string memory type_) public returns (uint256 id) {
    vm.startPrank(deployer);
    id = __ItemRegistrySystem.createConsumable(
      abi.encode(index, "KAMI", "name", "description", type_, "media")
    );
    vm.stopPrank();
  }

  function _createFood(
    uint32 index,
    string memory name,
    string memory description,
    int32 health,
    uint256 experience,
    string memory mediaURI
  ) public returns (uint256 id) {
    vm.startPrank(deployer);
    id = __ItemRegistrySystem.createConsumable(
      abi.encode(index, "KAMI", name, description, "FOOD", mediaURI)
    );
    __ItemRegistrySystem.addRequirement(
      abi.encode(index, "USE", "KAMI_CAN_EAT", "BOOL_IS", 0, 0, "")
    );
    __ItemRegistrySystem.addAlloBasic(abi.encode(index, "USE", "XP", 0, experience));
    __ItemRegistrySystem.addAlloStat(abi.encode(index, "USE", "HEALTH", 0, 0, 0, health));
    vm.stopPrank();
  }

  function _createRevive(
    uint32 index,
    string memory name,
    string memory description,
    int32 health,
    string memory mediaURI
  ) public returns (uint256 id) {
    vm.startPrank(deployer);
    id = __ItemRegistrySystem.createConsumable(
      abi.encode(index, "KAMI", name, description, "REVIVE", mediaURI)
    );
    __ItemRegistrySystem.addRequirement(
      abi.encode(index, "USE", "STATE", "BOOL_IS", LibKami.stateToIndex("DEAD"), 0, "", "")
    );
    __ItemRegistrySystem.addAlloBasic(
      abi.encode(index, "USE", "STATE", LibKami.stateToIndex("RESTING"), 0)
    );
    __ItemRegistrySystem.addAlloStat(abi.encode(index, "USE", "HEALTH", 0, 0, 0, health));
    vm.stopPrank();
  }

  /* QUESTS */

  function _createQuest(uint32 index, uint duration) public returns (uint256) {
    vm.prank(deployer);
    return
      __QuestRegistrySystem.create(
        abi.encode(index, LibString.toString(index), "DESCRIPTION", "", duration)
      );
  }

  function _createQuestObjective(
    uint32 questIndex,
    string memory logicType,
    string memory _type,
    uint32 index,
    uint256 value
  ) public returns (uint256) {
    return _createQuestObjective(questIndex, "NAME", logicType, _type, index, value);
  }

  function _createQuestObjective(
    uint32 questIndex,
    string memory name,
    string memory logicType,
    string memory _type,
    uint32 index, // can be empty
    uint256 value // can be empty
  ) public returns (uint256) {
    return _createQuestObjective(questIndex, name, logicType, _type, index, value, "");
  }

  function _createQuestObjective(
    uint32 questIndex,
    string memory name,
    string memory logicType,
    string memory _type,
    uint32 index,
    uint256 value,
    string memory for_
  ) public returns (uint256) {
    vm.prank(deployer);
    return
      __QuestRegistrySystem.addObjective(
        abi.encode(questIndex, name, logicType, _type, index, value, for_)
      );
  }

  function _createQuestRequirement(
    uint32 questIndex,
    string memory logicType,
    string memory _type,
    uint32 index, // can be empty
    uint value // can be empty
  ) public returns (uint256) {
    return _createQuestRequirement(questIndex, logicType, _type, index, value, "");
  }

  function _createQuestRequirement(
    uint32 questIndex,
    string memory logicType,
    string memory _type,
    uint32 index,
    uint value,
    string memory for_
  ) public returns (uint256) {
    vm.prank(deployer);
    return
      __QuestRegistrySystem.addRequirement(
        abi.encode(questIndex, logicType, _type, index, value, for_)
      );
  }

  // basic reward only
  function _createQuestReward(
    uint32 questIndex,
    string memory _type,
    uint32 itemIndex, // can be empty
    uint value // can be empty
  ) public returns (uint256) {
    vm.prank(deployer);
    return __QuestRegistrySystem.addRewardBasic(abi.encode(questIndex, _type, itemIndex, value));
  }

  /* RELATIONSHIP */

  function _createRelationship(uint32 npcIndex, uint32 relIndex) internal returns (uint256) {
    uint32[] memory list = new uint32[](0);
    return _createRelationship(npcIndex, relIndex, "relationship name", list, list);
  }

  function _createRelationship(
    uint32 npcIndex,
    uint32 relIndex,
    string memory name,
    uint32[] memory whitelist,
    uint32[] memory blacklist
  ) internal returns (uint256) {
    vm.prank(deployer);
    return
      __RelationshipRegistrySystem.create(
        abi.encode(npcIndex, relIndex, name, whitelist, blacklist)
      );
  }

  /* SKILLS */

  function _createSkill(
    uint32 index,
    string memory for_,
    uint256 cost,
    uint256 max
  ) internal returns (uint256) {
    return _createSkill(index, for_, "", "name", cost, max, 0);
  }

  function _createSkill(
    uint32 index,
    string memory for_,
    string memory tree,
    uint256 cost,
    uint256 max,
    uint256 treeTier
  ) internal returns (uint256) {
    return _createSkill(index, for_, tree, "name", cost, max, treeTier);
  }

  function _createSkill(
    uint32 index,
    string memory for_,
    string memory tree,
    string memory name,
    uint cost,
    uint max,
    uint treeTier
  ) internal returns (uint256) {
    vm.prank(deployer);
    return
      __SkillRegistrySystem.create(
        abi.encode(index, for_, tree, name, "description", cost, max, treeTier, "")
      );
  }

  function _createSkillBonus(
    uint32 skillIndex,
    string memory type_,
    int value // can be empty
  ) internal returns (uint256) {
    vm.prank(deployer);
    return __SkillRegistrySystem.addBonus(abi.encode(skillIndex, type_, value));
  }

  function _createSkillRequirement(
    uint32 skillIndex,
    string memory type_,
    string memory logicType,
    uint32 index, // can be empty
    uint value // can be empty
  ) internal returns (uint256) {
    return _createSkillRequirement(skillIndex, type_, logicType, index, value, "");
  }

  function _createSkillRequirement(
    uint32 skillIndex,
    string memory type_,
    string memory logicType,
    uint32 index,
    uint value,
    string memory for_
  ) internal returns (uint256) {
    vm.prank(deployer);
    return
      __SkillRegistrySystem.addRequirement(
        abi.encode(skillIndex, type_, logicType, index, value, for_)
      );
  }

  /* TRAITS */

  function registerTrait(
    uint32 specialIndex,
    int32 health,
    int32 power,
    int32 violence,
    int32 harmony,
    int32 slots,
    uint rarityTier,
    string memory affinity,
    string memory name,
    string memory traitType
  ) internal {
    vm.prank(deployer);
    __TraitRegistrySystem.create(
      abi.encode(
        specialIndex,
        health,
        power,
        violence,
        harmony,
        slots,
        rarityTier,
        affinity,
        name,
        traitType
      )
    );
  }

  function _initStockTraits() internal {
    _initCommonTraits();
    _initUncommonTraits();
    _initRareTraits();
    _initEpicTraits();
    _initMythicTraits();
  }

  /// @notice empty traits for distribution testing
  function _initEmptyTraits() internal {
    // Backgrounds (extra common trait)
    registerTrait(0, 0, 0, 0, 0, 0, 9, "", "BG Common", "BACKGROUND");
    registerTrait(1, 0, 0, 0, 0, 0, 8, "", "BG Uncommon", "BACKGROUND");
    registerTrait(2, 0, 0, 0, 0, 0, 7, "", "BG Rare", "BACKGROUND");
    registerTrait(3, 0, 0, 0, 0, 0, 6, "", "BG Epic", "BACKGROUND");
    registerTrait(4, 0, 0, 0, 0, 0, 5, "", "BG Mythic", "BACKGROUND");
    registerTrait(5, 0, 0, 0, 0, 0, 9, "", "BG Common 2", "BACKGROUND");

    // Bodies (extra uncommon trait)
    registerTrait(0, 0, 0, 0, 0, 0, 9, "INSECT", "Body Common", "BODY");
    registerTrait(1, 0, 0, 0, 0, 0, 8, "SCRAP", "Body Uncommon", "BODY");
    registerTrait(2, 0, 0, 0, 0, 0, 7, "EERIE", "Body Rare", "BODY");
    registerTrait(3, 0, 0, 0, 0, 0, 6, "NORMAL", "Body Epic", "BODY");
    registerTrait(4, 0, 0, 0, 0, 0, 5, "SCRAP", "Body Mythic", "BODY");
    registerTrait(5, 0, 0, 0, 0, 0, 8, "EERIE", "Body Uncommon 2", "BODY");

    // Colors (extra rare trait)
    registerTrait(0, 0, 0, 0, 0, 0, 9, "", "Color Common", "COLOR");
    registerTrait(1, 0, 0, 0, 0, 0, 8, "", "Color Uncommon", "COLOR");
    registerTrait(2, 0, 0, 0, 0, 0, 7, "", "Color Rare", "COLOR");
    registerTrait(3, 0, 0, 0, 0, 0, 6, "", "Color Epic", "COLOR");
    registerTrait(4, 0, 0, 0, 0, 0, 5, "", "Color Mythic", "COLOR");
    registerTrait(5, 0, 0, 0, 0, 0, 7, "", "Color Rare 2", "COLOR");

    // Faces (extra epic trait)
    registerTrait(0, 0, 0, 0, 0, 0, 9, "", "Face Common", "FACE");
    registerTrait(1, 0, 0, 0, 0, 0, 8, "", "Face Uncommon", "FACE");
    registerTrait(2, 0, 0, 0, 0, 0, 7, "", "Face Rare", "FACE");
    registerTrait(3, 0, 0, 0, 0, 0, 6, "", "Face Epic", "FACE");
    registerTrait(4, 0, 0, 0, 0, 0, 5, "", "Face Mythic", "FACE");
    registerTrait(5, 0, 0, 0, 0, 0, 6, "", "Face Epic 2", "FACE");

    // Hands (added Legendary trait)
    registerTrait(0, 0, 0, 0, 0, 0, 9, "INSECT", "Hands Common", "HAND");
    registerTrait(1, 0, 0, 0, 0, 0, 8, "SCRAP", "Hands Uncommon", "HAND");
    registerTrait(2, 0, 0, 0, 0, 0, 7, "EERIE", "Hands Rare", "HAND");
    registerTrait(3, 0, 0, 0, 0, 0, 6, "NORMAL", "Hands Epic", "HAND");
    registerTrait(4, 0, 0, 0, 0, 0, 5, "SCRAP", "Hands Mythic", "HAND");
    registerTrait(5, 0, 0, 0, 0, 0, 4, "NORMAL", "Hands Legendary", "HAND");
  }

  function _initCommonTraits() internal {
    // Backgrounds
    registerTrait(0, 0, 0, 0, 0, 0, 0, "", "Empty BG", "BACKGROUND");
    registerTrait(1, 10, 0, 0, 0, 0, 9, "", "Health BG Basic", "BACKGROUND");
    registerTrait(2, 0, 1, 0, 0, 0, 9, "", "Power BG Basic", "BACKGROUND");
    registerTrait(3, 0, 0, 1, 0, 0, 9, "", "Violence BG Basic", "BACKGROUND");
    registerTrait(4, 0, 0, 0, 1, 0, 9, "", "Harmony BG Basic", "BACKGROUND");

    // Bodies
    registerTrait(0, 0, 1, 1, 0, 0, 0, "INSECT", "Empty Body", "BODY");
    registerTrait(1, 0, 1, 1, 0, 0, 9, "INSECT", "Insect Body Basic", "BODY");
    registerTrait(2, 10, 0, 0, 1, 0, 9, "SCRAP", "Scrap Body Basic", "BODY");
    registerTrait(3, 0, 0, 1, 1, 0, 9, "EERIE", "Eerie Body Basic", "BODY");
    registerTrait(4, 10, 0, 0, 0, 1, 9, "NORMAL", "Normal Body Basic", "BODY");

    // Colors
    registerTrait(0, 10, 0, 0, 0, 0, 0, "", "Empty Color", "COLOR");
    registerTrait(1, 10, 0, 0, 0, 0, 9, "", "Health Color Basic", "COLOR");
    registerTrait(2, 0, 1, 0, 0, 0, 9, "", "Power Color Basic", "COLOR");
    registerTrait(3, 0, 0, 1, 0, 0, 9, "", "Violence Color Basic", "COLOR");
    registerTrait(4, 0, 0, 0, 1, 0, 9, "", "Harmony Color Basic", "COLOR");

    // Faces
    registerTrait(0, 10, 0, 0, 0, 0, 0, "", "Empty Face", "FACE");
    registerTrait(1, 10, 0, 0, 0, 0, 9, "", "Health Mask Basic", "FACE");
    registerTrait(2, 0, 1, 0, 0, 0, 9, "", "Power Mask Basic", "FACE");
    registerTrait(3, 0, 0, 1, 0, 0, 9, "", "Violence Mask Basic", "FACE");
    registerTrait(4, 0, 0, 0, 1, 0, 9, "", "Harmony Mask Basic", "FACE");

    // Hands
    registerTrait(0, 0, 1, 1, 0, 0, 0, "INSECT", "Empty Hands", "HAND");
    registerTrait(1, 0, 1, 1, 0, 0, 9, "INSECT", "Insect Hands Basic", "HAND");
    registerTrait(2, 10, 0, 0, 1, 0, 9, "SCRAP", "Scrap Hands Basic", "HAND");
    registerTrait(3, 0, 0, 1, 1, 0, 9, "EERIE", "Eerie Hands Basic", "HAND");
    registerTrait(4, 10, 1, 0, 0, 0, 9, "NORMAL", "Normal Hands Basic", "HAND");
  }

  function _initUncommonTraits() internal {
    // Backgrounds
    registerTrait(5, 20, 0, 0, 0, 0, 8, "", "Health BG Uncommon", "BACKGROUND");
    registerTrait(6, 0, 0, 2, 0, 0, 8, "", "Violence BG Uncommon", "BACKGROUND");
    registerTrait(7, 0, 0, 0, 2, 0, 8, "", "Harmony BG Uncommon", "BACKGROUND");

    // Bodies
    registerTrait(5, 0, 2, 2, 0, 0, 8, "INSECT", "Insect Body Uncommon", "BODY");
    registerTrait(6, 0, 0, 2, 2, 0, 8, "EERIE", "Eerie Body Uncommon", "BODY");
    registerTrait(7, 20, 0, 0, 0, 2, 8, "NORMAL", "Normal Body Uncommon", "BODY");

    // Colors
    registerTrait(5, 20, 0, 0, 0, 0, 8, "", "Health Color Uncommon", "COLOR");
    registerTrait(6, 0, 2, 0, 0, 0, 8, "", "Power Color Uncommon", "COLOR");
    registerTrait(7, 0, 0, 0, 2, 0, 8, "", "Harmony Color Uncommon", "COLOR");

    // Faces
    registerTrait(5, 20, 0, 0, 0, 0, 8, "", "Health Mask Uncommon", "FACE");
    registerTrait(6, 0, 2, 0, 0, 0, 8, "", "Power Mask Uncommon", "FACE");
    registerTrait(7, 0, 0, 2, 0, 0, 8, "", "Violence Mask Uncommon", "FACE");

    // Hands
    registerTrait(5, 20, 0, 0, 2, 0, 8, "SCRAP", "Scrap Hands Uncommon", "HAND");
    registerTrait(6, 0, 0, 2, 2, 0, 8, "EERIE", "Eerie Hands Uncommon", "HAND");
    registerTrait(7, 20, 2, 0, 0, 0, 8, "NORMAL", "Normal Hands Uncommon", "HAND");
  }

  function _initRareTraits() internal {
    // Backgrounds
    registerTrait(8, 30, 0, 0, 0, 0, 7, "", "Health BG Rare", "BACKGROUND");
    registerTrait(9, 0, 0, 3, 0, 0, 7, "", "Violence BG Rare", "BACKGROUND");

    // Bodies
    registerTrait(8, 0, 3, 3, 0, 0, 7, "INSECT", "Insect Body Rare", "BODY");
    registerTrait(9, 0, 0, 3, 3, 0, 7, "EERIE", "Eerie Body Rare", "BODY");

    // Colors
    registerTrait(8, 30, 0, 0, 0, 0, 7, "", "Health Color Rare", "COLOR");
    registerTrait(9, 0, 3, 0, 0, 0, 7, "", "Power Color Rare", "COLOR");

    // Faces
    registerTrait(8, 30, 0, 0, 0, 0, 7, "", "Health Mask Rare", "FACE");
    registerTrait(9, 0, 3, 0, 0, 0, 7, "", "Power Mask Rare", "FACE");

    // Hands
    registerTrait(8, 30, 0, 0, 3, 0, 7, "SCRAP", "Scrap Hands Rare", "HAND");
    registerTrait(9, 0, 0, 3, 3, 0, 7, "EERIE", "Eerie Hands Rare", "HAND");
  }

  function _initEpicTraits() internal {
    // Backgrounds
    registerTrait(10, 40, 0, 0, 0, 0, 6, "", "Health BG Epic", "BACKGROUND");
    registerTrait(11, 0, 0, 4, 0, 0, 6, "", "Violence BG Epic", "BACKGROUND");

    // Bodies
    registerTrait(10, 0, 4, 4, 0, 0, 6, "INSECT", "Insect Body Epic", "BODY");
    registerTrait(11, 0, 0, 4, 4, 0, 6, "EERIE", "Eerie Body Epic", "BODY");

    // Colors
    registerTrait(10, 40, 0, 0, 0, 0, 6, "", "Health Color Epic", "COLOR");
    registerTrait(11, 0, 4, 0, 0, 0, 6, "", "Power Color Epic", "COLOR");

    // Faces
    registerTrait(10, 40, 0, 0, 0, 0, 6, "", "Health Mask Epic", "FACE");
    registerTrait(11, 0, 4, 0, 0, 0, 6, "", "Power Mask Epic", "FACE");

    // Hands
    registerTrait(10, 40, 0, 0, 4, 0, 6, "SCRAP", "Scrap Hands Epic", "HAND");
    registerTrait(11, 0, 0, 4, 4, 0, 6, "EERIE", "Eerie Hands Epic", "HAND");
  }

  function _initMythicTraits() internal {
    // Backgrounds
    registerTrait(12, 50, 0, 0, 0, 0, 5, "", "Health BG Mythic", "BACKGROUND");
    registerTrait(13, 0, 0, 5, 0, 0, 5, "", "Violence BG Mythic", "BACKGROUND");

    // Bodies
    registerTrait(12, 0, 5, 5, 0, 0, 5, "INSECT", "Insect Body Mythic", "BODY");
    registerTrait(13, 0, 0, 5, 5, 0, 5, "EERIE", "Eerie Body Mythic", "BODY");

    // Colors
    registerTrait(12, 50, 0, 0, 0, 0, 5, "", "Health Color Mythic", "COLOR");
    registerTrait(13, 0, 5, 0, 0, 0, 5, "", "Power Color Mythic", "COLOR");

    // Faces
    registerTrait(12, 50, 0, 0, 0, 0, 5, "", "Health Mask Mythic", "FACE");
    registerTrait(13, 0, 5, 0, 0, 0, 5, "", "Power Mask Mythic", "FACE");

    // Hands
    registerTrait(12, 50, 0, 0, 5, 0, 5, "SCRAP", "Scrap Hands Mythic", "HAND");
    registerTrait(13, 0, 0, 5, 5, 0, 5, "EERIE", "Eerie Hands Mythic", "HAND");
  }

  /////////////////
  // CONFIGS

  function _setConfig(string memory key, uint value) internal {
    vm.prank(deployer);
    __ConfigSetSystem.setValue(key, value);
  }

  function _setConfig(string memory key, address value) internal {
    vm.prank(deployer);
    __ConfigSetSystem.setValueAddress(key, value);
  }

  function _setConfig(string memory key, uint32[8] memory values) internal {
    vm.prank(deployer);
    __ConfigSetSystem.setValueArray(key, values);
  }

  function _setConfig(string memory key, string memory value) internal {
    vm.prank(deployer);
    __ConfigSetSystem.setValueString(key, value);
  }

  ///////////////////////
  // ASSERTIONS

  function assertEq(Coord memory a, Coord memory b) public {
    assertTrue(a.x == b.x && a.y == b.y && a.z == b.z);
  }

  function assertEq(Stat memory a, Stat memory b) public {
    assertEq(a.base, b.base);
    assertEq(a.shift, b.shift);
    assertEq(a.boost, b.boost);
    assertEq(a.sync, b.sync);
  }
}
