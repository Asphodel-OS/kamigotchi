// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { LibString } from "solady/utils/LibString.sol";
import { SafeCastLib } from "solady/utils/SafeCastLib.sol";

import "./TestSetupImports.sol";

import { Condition } from "libraries/utils/LibBoolean.sol";
import { Location } from "libraries/LibRoom.sol";
import { Stat } from "components/types/StatComponent.sol";

abstract contract SetupTemplate is TestSetupImports {
  using LibString for string;
  using SafeCastLib for int32;
  using SafeCastLib for uint256;

  struct PlayerAccount {
    uint256 id;
    uint256 index;
    address operator;
    address owner;
  }

  uint _currTime;
  mapping(uint256 => PlayerAccount) internal _accounts;
  address[] internal _owners;
  mapping(address => address) internal _operators; // owner => operator
  uint internal _currBlock;

  PlayerAccount alice;
  PlayerAccount bob;

  constructor() MudTest() {}

  //////////////////
  // SETUP

  function setUp() public virtual override {
    super.setUp();

    setUpConfigs();
    setUpTime();

    vm.prank(deployer);
    _PetGachaMintSystem.init(abi.encode(0)); // todo: make deploy script call `init()`

    setUpAccounts();
    setUpMint();
    setUpItems();
    setUpRooms();
  }

  // sets up some default accounts. override to change/remove behaviour if needed
  function setUpAccounts() public virtual {
    _createOwnerOperatorPairs(25); // create 10 pairs of Owners/Operators
    _registerAccounts(10);
    alice = _accounts[0];
    bob = _accounts[1];
  }

  // sets up default configs. override to change/remove behaviour if needed
  function setUpConfigs() public virtual {
    _initAllConfigs();
  }

  // sets up mint to a default state. override to change/remove behaviour if needed
  function setUpMint() public virtual {
    _initCommonTraits();
    vm.startPrank(deployer);
    __721BatchMinterSystem.setTraits();
    __721BatchMinterSystem.batchMint(100);
    vm.stopPrank();
  }

  // sets up items to a default state. override to change/remove behaviour if needed
  function setUpItems() public virtual {
    _initItems();
  }

  // sets up rooms to a default state. override to change/remove behaviour if needed
  // is a big square with every room connected to each other
  function setUpRooms() public virtual {
    _createRoom("testRoom1", Location(1, 1, 0), 1, 4);
    _createRoom("testRoom2", Location(2, 1, 0), 2, 3);
    _createRoom("testRoom3", Location(1, 2, 0), 3, 2);
    _createRoom("testRoom4", Location(2, 2, 0), 4, 1);
  }

  function setUpTime() public virtual {
    _currTime = 5 minutes;
    vm.warp(_currTime);
  }

  function _fastForward(uint timeDelta) internal {
    _currTime += timeDelta;
    vm.warp(_currTime);
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
    address operator = _getOperator(playerIndex);

    vm.prank(deployer);
    __devGiveTokensSystem.executeTyped(operator, amount);
  }

  function _getAccountBalance(uint playerIndex) internal view returns (uint) {
    uint accountID = _getAccount(playerIndex);
    return LibCoin.get(components, accountID);
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
    uint256 accountID = abi.decode(
      _AccountRegisterSystem.executeTyped(operator, LibString.toString(playerIndex)),
      (uint256)
    );
    vm.stopPrank();

    _accounts[playerIndex] = PlayerAccount(accountID, playerIndex, operator, owner);
    return accountID;
  }

  // registers n accounts, starting from 0
  function _registerAccounts(uint n) internal {
    for (uint i = 0; i < n; i++) _registerAccount(i);
  }

  /////////////////
  // OWNER ACTIONS

  // (public) mint and reveal multiple pets for a calling address
  function _mintPets(uint playerIndex, uint amt) internal virtual returns (uint[] memory id) {
    address owner = _owners[playerIndex];

    vm.roll(++_currBlock);
    _giveMint20(playerIndex, amt);
    vm.prank(owner);
    uint256[] memory commits = abi.decode(_PetGachaMintSystem.executeTyped(amt), (uint256[]));

    vm.roll(++_currBlock);
    return _PetGachaRevealSystem.reveal(commits);
  }

  // (public) mint and reveal a single pet to a specified address
  function _mintPet(uint playerIndex) internal virtual returns (uint) {
    address owner = _owners[playerIndex];

    vm.roll(++_currBlock);
    _giveMint20(playerIndex, 1);
    vm.prank(owner);
    uint256[] memory commits = abi.decode(_PetGachaMintSystem.executeTyped(1), (uint256[]));

    vm.roll(++_currBlock);
    return _PetGachaRevealSystem.reveal(commits)[0];
  }

  /////////////////
  // OPERATOR ACTIONS

  // attempt to move an account if it's not already there
  function _moveAccount(uint playerIndex, uint32 roomIndex) internal {
    if (roomIndex != LibAccount.getRoom(components, _getAccount(playerIndex))) {
      address operator = _operators[_owners[playerIndex]];
      vm.prank(operator);
      _AccountMoveSystem.executeTyped(roomIndex);
    }
  }

  function _moveAccount(uint playerIndex, Location memory location) internal {
    uint256 roomID = LibRoom.queryByLocation(components, location);
    return _moveAccount(playerIndex, LibRoom.getIndex(components, roomID));
  }

  function _buyFromListing(uint playerIndex, uint listingID, uint amount) internal {
    vm.prank(_getOperator(playerIndex));
    _ListingBuySystem.executeTyped(listingID, amount);
  }

  function _sellToListing(uint playerIndex, uint listingID, uint amount) internal {
    vm.prank(_getOperator(playerIndex));
    _ListingSellSystem.executeTyped(listingID, amount);
  }

  // easy function for getting the proper inputs to feed a pet
  function _feedPet(uint petID, uint32 foodIndex) internal {
    uint accountID = LibPet.getAccount(components, petID);
    address operator = LibAccount.getOperator(components, accountID);

    vm.prank(operator);
    _PetFeedSystem.executeTyped(petID, foodIndex);
  }

  // easy function for getting the proper inputs to revive a pet
  function _revivePet(uint petID, uint32 reviveIndex) internal {
    uint accountID = LibPet.getAccount(components, petID);
    address operator = LibAccount.getOperator(components, accountID);

    vm.prank(operator);
    _PetReviveSystem.executeTyped(petID, reviveIndex);
  }

  function _startProduction(uint petID, uint nodeID) internal virtual returns (uint) {
    uint accountID = LibPet.getAccount(components, petID);
    address operator = LibAccount.getOperator(components, accountID);

    vm.prank(operator);
    bytes memory productionID = _ProductionStartSystem.executeTyped(petID, nodeID);
    return abi.decode(productionID, (uint));
  }

  function _stopProduction(uint productionID) internal {
    uint petID = LibProduction.getPet(components, productionID);
    uint accountID = LibPet.getAccount(components, petID);
    address operator = LibAccount.getOperator(components, accountID);

    vm.prank(operator);
    _ProductionStopSystem.executeTyped(productionID);
  }

  function _collectProduction(uint productionID) internal {
    uint petID = LibProduction.getPet(components, productionID);
    uint accountID = LibPet.getAccount(components, petID);
    address operator = LibAccount.getOperator(components, accountID);

    vm.prank(operator);
    _ProductionCollectSystem.executeTyped(productionID);
  }

  function _liquidateProduction(uint attackerID, uint productionID) internal virtual {
    uint accountID = LibPet.getAccount(components, attackerID);
    address operator = LibAccount.getOperator(components, accountID);

    vm.prank(operator);
    _ProductionLiquidateSystem.executeTyped(productionID, attackerID);
  }

  /* LOOTBOXES */

  function _openLootbox(uint playerIndex, uint32 index, uint amount) internal virtual {
    address operator = _getOperator(playerIndex);

    vm.startPrank(operator);
    uint256 id = abi.decode(_LootboxStartRevealSystem.executeTyped(index, amount), (uint256));
    vm.roll(_currBlock++);
    _LootboxExecuteRevealSystem.executeTyped(id);
    vm.stopPrank();
  }

  /* QUESTS */

  function _acceptQuest(uint playerIndex, uint32 questIndex) internal virtual returns (uint) {
    address operator = _getOperator(playerIndex);
    vm.prank(operator);
    return abi.decode(_QuestAcceptSystem.executeTyped(questIndex), (uint));
  }

  function _completeQuest(uint playerIndex, uint questID) internal virtual {
    address operator = _getOperator(playerIndex);
    vm.prank(operator);
    _QuestCompleteSystem.executeTyped(questID);
  }

  function _dropQuest(uint playerIndex, uint questID) internal virtual {
    address operator = _getOperator(playerIndex);
    vm.prank(operator);
    _QuestDropSystem.executeTyped(questID);
  }

  /* RELATIONSHIP */

  function _advRelationship(uint playerIdx, uint32 npcIdx, uint32 relIdx) internal returns (uint) {
    vm.prank(_getOperator(playerIdx));
    return abi.decode(_RelationshipAdvanceSystem.executeTyped(npcIdx, relIdx), (uint256));
  }

  /* SKILLS */

  function _upgradeSkill(uint playerIndex, uint targetID, uint32 skillIndex) internal virtual {
    address operator = _getOperator(playerIndex);
    vm.prank(operator);
    _SkillUpgradeSystem.executeTyped(targetID, skillIndex);
  }

  /////////////////
  // GETTERS

  function _getItemBalance(uint playerIndex, uint32 itemIndex) internal view returns (uint) {
    uint accountID = _getAccount(playerIndex);
    uint inventoryID = LibInventory.get(components, accountID, itemIndex);
    return inventoryID == 0 ? 0 : LibInventory.getBalance(components, inventoryID);
  }

  /////////////////
  // ADMIN POWERS

  function _giveMint20(uint playerIndex, uint amount) internal {
    vm.prank(deployer);
    _Mint20.adminMint(_getOwner(playerIndex), amount);
  }

  function _giveLootbox(uint256 playerIndex, uint32 index, uint256 amt) internal {
    uint256 accountID = _getAccount(playerIndex);

    vm.startPrank(deployer);
    uint256 invID = LibInventory.get(components, accountID, index);
    if (invID == 0) invID = LibInventory.create(components, accountID, index);
    LibInventory.inc(components, invID, amt);
    LibInventory.logIncItemTotal(components, accountID, index, amt);
    vm.stopPrank();
  }

  function _giveSkillPoint(uint id, uint amt) internal {
    vm.startPrank(deployer);
    LibSkill.inc(components, id, amt);
    vm.stopPrank();
  }

  function _setPetTrait(uint petID, string memory trait, uint32 traitIndex) internal {
    vm.startPrank(deployer);
    if (trait.eq("BODY")) LibRegistryTrait.setBodyIndex(components, petID, traitIndex);
    else if (trait.eq("HAND")) LibRegistryTrait.setHandIndex(components, petID, traitIndex);
    else if (trait.eq("FACE")) LibRegistryTrait.setFaceIndex(components, petID, traitIndex);
    else if (trait.eq("COLOR")) LibRegistryTrait.setColorIndex(components, petID, traitIndex);
    else if (trait.eq("BACKGROUND"))
      LibRegistryTrait.setBackgroundIndex(components, petID, traitIndex);
    vm.stopPrank();
  }

  /////////////////
  // WORLD POPULATION

  function _createGoal(
    uint32 index,
    uint32 roomIndex,
    Condition memory condition
  ) internal returns (uint256) {
    vm.prank(deployer);
    return
      abi.decode(
        __GoalCreateSystem.executeTyped(index, "name", "description", roomIndex, condition),
        (uint256)
      );
  }

  function _createGoalRequirement(
    uint32 index,
    Condition memory condition
  ) internal returns (uint256) {
    vm.prank(deployer);
    return abi.decode(__GoalCreateRequirementSystem.executeTyped(index, condition), (uint256));
  }

  function _createGoalReward(uint32 index, Condition memory condition) internal returns (uint256) {
    vm.prank(deployer);
    return abi.decode(__GoalCreateRewardSystem.executeTyped(index, condition), (uint256));
  }

  function _createRoom(
    string memory name,
    Location memory location,
    uint32 index
  ) internal returns (uint256) {
    uint32[] memory exits = new uint32[](0);
    return _createRoom(name, location, index, exits);
  }

  function _createRoom(
    string memory name,
    Location memory location,
    uint32 index,
    uint32 exitIndex
  ) internal returns (uint256) {
    uint32[] memory exits = new uint32[](1);
    exits[0] = exitIndex;

    return _createRoom(name, location, index, exits);
  }

  function _createRoom(
    string memory name,
    Location memory location,
    uint32 index,
    uint32[] memory exits
  ) internal returns (uint256) {
    vm.prank(deployer);
    return abi.decode(__RoomCreateSystem.executeTyped(location, index, name, "", exits), (uint256));
  }

  function _createRoomGate(
    uint32 roomIndex,
    uint32 sourceIndex,
    uint32 conditionIndex,
    uint256 conditionValue,
    string memory logicType,
    string memory type_
  ) internal returns (uint256) {
    vm.prank(deployer);
    return
      abi.decode(
        __RoomCreateGateSystem.executeTyped(
          roomIndex,
          sourceIndex,
          conditionIndex,
          conditionValue,
          logicType,
          type_
        ),
        (uint256)
      );
  }

  function _createHarvestingNode(
    uint32 index,
    uint32 roomIndex,
    string memory name,
    string memory description,
    string memory affinity
  ) internal returns (uint) {
    vm.prank(deployer);
    bytes memory nodeID = __NodeCreateSystem.executeTyped(
      index,
      "HARVEST",
      roomIndex,
      name,
      description,
      affinity
    );
    return abi.decode(nodeID, (uint));
  }

  function _createNPC(uint32 index, uint32 roomIndex, string memory name) public returns (uint) {
    vm.prank(deployer);
    bytes memory merchantID = __NPCCreateSystem.executeTyped(index, name, roomIndex);
    return abi.decode(merchantID, (uint));
  }

  function _setListing(
    uint32 npcIndex,
    uint32 itemIndex,
    uint priceBuy,
    uint priceSell
  ) public returns (uint) {
    vm.prank(deployer);
    bytes memory listingID = __ListingSetSystem.executeTyped(
      npcIndex,
      itemIndex,
      priceBuy,
      priceSell
    );
    return abi.decode(listingID, (uint));
  }

  /////////////////////////////////////////////
  // REGISTRIES

  /* ITEMS */

  // @notice creates and empty item index for testing
  function _createGenericItem(uint32 index) public returns (uint256 id) {
    vm.startPrank(deployer);

    id = LibRegistryItem.genID(index);
    _IsRegistryComponent.set(id);
    _IndexItemComponent.set(id, index);

    vm.stopPrank();
  }

  function _createLootbox(
    uint32 index,
    string memory name,
    uint32[] memory keys,
    uint[] memory weights
  ) public {
    vm.prank(deployer);
    __RegistryCreateLootboxSystem.executeTyped(index, name, "DESCRIPTION", keys, weights, "");
  }

  /* QUESTS */

  function _createQuest(uint32 index, uint duration) public returns (uint256) {
    return _createQuest(index, 0, duration);
  }

  function _createQuest(uint32 index, uint points, uint duration) public returns (uint256) {
    vm.prank(deployer);
    return
      abi.decode(
        __RegistryCreateQuestSystem.executeTyped(
          index,
          LibString.toString(index),
          "DESCRIPTION",
          "",
          points,
          duration
        ),
        (uint256)
      );
  }

  function _createQuestObjective(
    uint32 questIndex,
    string memory name,
    string memory logicType,
    string memory _type,
    uint32 index, // can be empty
    uint value // can be empty
  ) public returns (uint256) {
    vm.prank(deployer);
    return
      abi.decode(
        __RegistryCreateQuestObjectiveSystem.executeTyped(
          questIndex,
          name,
          logicType,
          _type,
          index,
          value
        ),
        (uint256)
      );
  }

  function _createQuestRequirement(
    uint32 questIndex,
    string memory logicType,
    string memory _type,
    uint32 index, // can be empty
    uint value // can be empty
  ) public returns (uint256) {
    vm.prank(deployer);
    return
      abi.decode(
        __RegistryCreateQuestRequirementSystem.executeTyped(
          questIndex,
          logicType,
          _type,
          index,
          value
        ),
        (uint256)
      );
  }

  function _createQuestReward(
    uint32 questIndex,
    string memory _type,
    uint32 itemIndex, // can be empty
    uint value // can be empty
  ) public returns (uint256) {
    vm.prank(deployer);
    return
      abi.decode(
        __RegistryCreateQuestRewardSystem.executeTyped(questIndex, _type, itemIndex, value),
        (uint256)
      );
  }

  /* RELATIONSHIP */

  function _createRelationship(uint32 npcIndex, uint32 relIndex) internal returns (uint256) {
    uint32[] memory whitelist = new uint32[](0);
    uint32[] memory blacklist = new uint32[](0);
    return _createRelationship(npcIndex, relIndex, "relationship name", whitelist, blacklist);
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
      abi.decode(
        __RegistryCreateRelationshipSystem.executeTyped(
          npcIndex,
          relIndex,
          name,
          whitelist,
          blacklist
        ),
        (uint256)
      );
  }

  /* SKILLS */

  function _createSkill(
    uint32 index,
    string memory for_,
    string memory type_,
    uint256 cost,
    uint256 max
  ) internal returns (uint256) {
    return _createSkill(index, for_, type_, "", "name", cost, max, 0);
  }

  function _createSkill(
    uint32 index,
    string memory for_,
    string memory type_,
    string memory tree,
    uint256 cost,
    uint256 max,
    uint256 treeTier
  ) internal returns (uint256) {
    return _createSkill(index, for_, type_, tree, "name", cost, max, treeTier);
  }

  function _createSkill(
    uint32 index,
    string memory for_,
    string memory type_,
    string memory tree,
    string memory name,
    uint cost,
    uint max,
    uint treeTier
  ) internal returns (uint256) {
    vm.prank(deployer);
    return
      abi.decode(
        __RegistryCreateSkillSystem.executeTyped(
          index,
          for_,
          type_,
          tree,
          name,
          "description",
          cost,
          max,
          treeTier,
          ""
        ),
        (uint256)
      );
  }

  function _createSkillEffect(
    uint32 skillIndex,
    string memory type_,
    string memory subtype, // can be empty
    int value // can be empty
  ) internal returns (uint256) {
    vm.prank(deployer);
    return
      abi.decode(
        __RegistryCreateSkillEffectSystem.executeTyped(skillIndex, type_, subtype, value),
        (uint256)
      );
  }

  function _createSkillRequirement(
    uint32 skillIndex,
    string memory type_,
    string memory logicType,
    uint32 index, // can be empty
    uint value // can be empty
  ) internal returns (uint256) {
    vm.prank(deployer);
    return
      abi.decode(
        __RegistryCreateSkillRequirementSystem.executeTyped(
          skillIndex,
          type_,
          logicType,
          index,
          value
        ),
        (uint256)
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
    __RegistryCreateTraitSystem.executeTyped(
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

  function _initItems() internal {
    vm.startPrank(deployer);

    // food (foodIndex, name, health)
    __RegistryCreateFoodSystem.executeTyped(1, "Gum", "DESCRIPTION", 25, 0, ""); // itemIndex 1
    __RegistryCreateFoodSystem.executeTyped(2, "Candy", "DESCRIPTION", 50, 0, ""); // itemIndex 2
    __RegistryCreateFoodSystem.executeTyped(3, "Cookie Sticks", "DESCRIPTION", 100, 0, ""); // itemIndex 3

    // revives (reviveIndex, name, health)
    __RegistryCreateReviveSystem.executeTyped(1000, "Ribbon", "DESCRIPTION", 10, ""); // itemIndex 4

    vm.stopPrank();
  }

  /////////////////
  // CONFIGS

  function _setConfig(string memory key, uint value) internal {
    vm.prank(deployer);
    __ConfigSetSystem.setValue(key, value);
  }

  function _setConfigArray(string memory key, uint32[8] memory values) internal {
    vm.prank(deployer);
    __ConfigSetSystem.setValueArray(key, values);
  }

  function _setConfigString(string memory key, string memory value) internal {
    vm.prank(deployer);
    __ConfigSetSystem.setValueString(key, value);
  }

  function _initAllConfigs() internal {
    _initAccountConfigs();
    _initBaseConfigs();
    _initLeaderboardConfigs();
    _initMintConfigs();
    _initLevelingConfigs();
    _initFriendConfigs();
    _initKamiConfigs();
    _initHealthConfigs();
    _initHarvestConfigs();
    _initLiquidationConfigs();
  }

  function _initBaseConfigs() internal {
    _setConfigString("BASE_URI", "https://image.asphodel.io/kami/");
    _setConfig("MINT_TOTAL_MAX", 33333);
  }

  function _initLeaderboardConfigs() internal {
    _setConfig("LEADERBOARD_EPOCH", 1);
  }

  function _initAccountConfigs() internal {
    _setConfig("ACCOUNT_STAMINA_BASE", 20);
    _setConfig("ACCOUNT_STAMINA_RECOVERY_PERIOD", 300);
  }

  function _initFriendConfigs() internal {
    _setConfig("FRIENDS_BASE_LIMIT", 5);
    _setConfig("FRIENDS_REQUEST_LIMIT", 5);
  }

  // Kami Leveling Curve
  function _initLevelingConfigs() internal {
    _setConfig("KAMI_LVL_REQ_BASE", 40);
    _setConfigArray("KAMI_LVL_REQ_MULT_BASE", [uint32(1259), 3, 0, 0, 0, 0, 0, 0]);
  }

  function _initMintConfigs() internal {
    _setConfig("MINT_ACCOUNT_MAX", 500);
    _setConfig("MINT_INITIAL_MAX", 1111);
    _setConfig("MINT_PRICE", 0);
    _setConfig("GACHA_REROLL_PRICE", 0);
    _setConfig("MINT_LEGACY_ENABLED", 0);
  }

  function _initKamiConfigs() internal {
    // Idle Requirements
    _setConfig("STANDARD_COOLDOWN", 300);

    // Kami Stats
    _setConfig("KAMI_BASE_HEALTH", 50);
    _setConfig("KAMI_BASE_POWER", 10);
    _setConfig("KAMI_BASE_VIOLENCE", 10);
    _setConfig("KAMI_BASE_HARMONY", 10);
    _setConfig("KAMI_BASE_SLOTS", 0);
  }

  function _initHealthConfigs() internal {
    // Kami Health Drain Rates
    _setConfigArray("HEALTH_RATE_DRAIN_BASE", [uint32(1000), 3, 0, 0, 0, 0, 0, 0]);

    // Kami Health Heal Rates
    // (prec, base, base_prec, mult_prec)
    _setConfigArray("KAMI_REST_METABOLISM", [uint32(6), 1000, 3, 3, 0, 0, 0, 0]);
  }

  function _initHarvestConfigs() internal {
    // Harvest Rates
    // [prec, base, base_prec, mult_prec]
    _setConfigArray("HARVEST_RATE", [uint32(9), 1000, 3, 9, 0, 0, 0, 0]);
    // [base, up, down]
    _setConfigArray("HARVEST_RATE_MULT_AFF", [uint32(1000), 1500, 500, 0, 0, 0, 0, 0]);
  }

  function _initLiquidationConfigs() internal {
    // Liquidation Calcs
    _setConfigArray("LIQ_THRESH_BASE", [uint32(20), 2, 0, 0, 0, 0, 0, 0]);
    // [base, up, down]
    _setConfigArray("LIQ_THRESH_MULT_AFF", [uint32(100), 200, 50, 0, 0, 0, 0, 0]);
    _setConfig("LIQ_THRESH_MULT_AFF_PREC", 2);

    // Liquidation Bounty
    _setConfigArray("LIQ_BOUNTY_BASE", [uint32(50), 3, 0, 0, 0, 0, 0, 0]);
  }

  ///////////////////////
  // UTILS

  function assertEq(Location memory a, Location memory b) public {
    assertTrue(a.x == b.x && a.y == b.y && a.z == b.z);
  }
}
