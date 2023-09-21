// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { Deploy } from "test/Deploy.sol";
import "std-contracts/test/MudTest.t.sol";

import "forge-std/console.sol";

import { LibString } from "solady/utils/LibString.sol";
import "./TestSetupImports.sol";

abstract contract SetupTemplate is TestSetupImports {
  uint _currTime;
  address[] internal _owners;
  mapping(address => address) internal _operators; // owner => operator
  uint internal _currBlock;

  constructor() MudTest(new Deploy()) {}

  function setUp() public virtual override {
    super.setUp();
    _createOwnerOperatorPairs(10); // create 10 pairs of Owners/Operators
    _initAllConfigs();
    _currTime = 5 minutes;
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
    address owner = utils.getNextUserAddress();
    _owners.push(owner);
    _operators[owner] = utils.getNextUserAddress();
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
  function _registerAccount(uint playerIndex) internal {
    address owner = _owners[playerIndex];
    address operator = _operators[owner];

    vm.startPrank(owner);
    // string memory name = LibString.slice(LibString.toHexString(owner), 0, 15); // maxlen 16
    _AccountRegisterSystem.executeTyped(operator, LibString.toString(playerIndex));
    vm.stopPrank();
  }

  /////////////////
  // OWNER ACTIONS

  // (public) mint and reveal multiple pets for a calling address
  function _mintPets(uint playerIndex, uint n) internal virtual returns (uint[] memory) {
    uint[] memory ids = new uint[](n);
    for (uint i = 0; i < n; i++) {
      ids[i] = _mintPet(playerIndex);
    }
    return ids;
  }

  // (public) mint and reveal a single pet to a specified address
  function _mintPet(uint playerIndex) internal virtual returns (uint id) {
    address owner = _owners[playerIndex];
    address operator = _operators[owner];

    // move the player to room 4
    uint initialLoc = LibAccount.getLocation(components, _getAccount(playerIndex));
    _moveAccount(playerIndex, 4);

    vm.roll(_currBlock++);
    _mintMint20(playerIndex, 1);
    vm.startPrank(owner);
    id = abi.decode(_Pet721MintSystem.executeTyped(1), (uint[]))[0];
    vm.stopPrank();

    vm.roll(_currBlock++);
    vm.startPrank(operator);
    _Pet721RevealSystem.executeTyped(LibPet.idToIndex(components, id));
    vm.stopPrank();

    _moveAccount(playerIndex, initialLoc);
  }

  // mints an mint20 token for user
  function _mintMint20(uint playerIndex, uint amount) internal {
    address owner = _owners[playerIndex];

    uint price = LibConfig.getValueOf(components, "MINT_PRICE");

    vm.deal(owner, amount * price);
    vm.prank(owner);
    _Mint20MintSystem.mint{ value: amount * price }(amount);
  }

  /////////////////
  // OPERATOR ACTIONS

  // attempt to move an account if it's not already there
  function _moveAccount(uint playerIndex, uint location) internal {
    if (location != LibAccount.getLocation(components, _getAccount(playerIndex))) {
      address operator = _operators[_owners[playerIndex]];
      vm.prank(operator);
      _AccountMoveSystem.executeTyped(location);
    }
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
  function _feedPet(uint petID, uint foodIndex) internal {
    uint accountID = LibPet.getAccount(components, petID);
    address operator = LibAccount.getOperator(components, accountID);

    vm.prank(operator);
    _PetFeedSystem.executeTyped(petID, foodIndex);
  }

  // easy function for getting the proper inputs to revive a pet
  function _revivePet(uint petID, uint reviveIndex) internal {
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

  /* QUESTS */

  function _acceptQuest(uint playerIndex, uint questIndex) internal virtual returns (uint) {
    address operator = _getOperator(playerIndex);
    vm.prank(operator);
    return abi.decode(_QuestAcceptSystem.executeTyped(questIndex), (uint));
  }

  function _completeQuest(uint playerIndex, uint questID) internal virtual {
    address operator = _getOperator(playerIndex);
    vm.prank(operator);
    _QuestCompleteSystem.executeTyped(questID);
  }

  /* SKILLS */

  function _upgradeSkill(uint playerIndex, uint targetID, uint skillIndex) internal virtual {
    address operator = _getOperator(playerIndex);
    vm.prank(operator);
    _SkillUpgradeSystem.executeTyped(targetID, skillIndex);
  }

  /////////////////
  // GETTERS

  function _getItemBalance(uint playerIndex, uint itemIndex) internal view returns (uint) {
    uint accountID = _getAccount(playerIndex);
    uint inventoryID = LibInventory.get(components, accountID, itemIndex);
    return LibInventory.getBalance(components, inventoryID);
  }

  /////////////////
  // ADMIN POWERS

  function _giveSkillPoint(uint id, uint amt) internal {
    vm.startPrank(deployer);
    LibSkill.incPoints(components, id, 1);
    vm.stopPrank();
  }

  /////////////////
  // WORLD POPULATION

  // create a room with up to three exits
  // 0s represent empty inputs
  function _createRoom(
    string memory name,
    uint location,
    uint exit1,
    uint exit2,
    uint exit3
  ) internal {
    uint numExits = 3;
    if (exit1 == 0) numExits--;
    if (exit2 == 0) numExits--;
    if (exit3 == 0) numExits--;

    uint[] memory exits = new uint[](numExits);
    if (numExits > 0) exits[0] = exit1;
    if (numExits > 1) exits[1] = exit2;
    if (numExits > 2) exits[2] = exit3;

    vm.prank(deployer);
    __RoomCreateSystem.executeTyped(location, name, "", exits);
  }

  function _createHarvestingNode(
    uint index,
    uint location,
    string memory name,
    string memory description,
    string memory affinity
  ) internal returns (uint) {
    vm.prank(deployer);
    bytes memory nodeID = __NodeCreateSystem.executeTyped(
      index,
      "HARVEST",
      location,
      name,
      description,
      affinity
    );
    return abi.decode(nodeID, (uint));
  }

  function _createNPC(uint index, uint location, string memory name) public returns (uint) {
    vm.prank(deployer);
    bytes memory merchantID = __NPCCreateSystem.executeTyped(index, name, location);
    return abi.decode(merchantID, (uint));
  }

  function _setListing(
    uint index,
    uint itemId,
    uint priceBuy,
    uint priceSell
  ) public returns (uint) {
    vm.prank(deployer);
    bytes memory listingID = __ListingSetSystem.executeTyped(index, itemId, priceBuy, priceSell);
    return abi.decode(listingID, (uint));
  }

  /////////////////////////////////////////////
  // REGISTRIES

  /* QUESTS */

  function _createQuest(
    uint index,
    string memory name,
    string memory description,
    uint location
  ) public {
    vm.prank(deployer);
    __RegistryCreateQuestSystem.executeTyped(index, name, description, location);
  }

  function _createQuestObjective(
    uint questIndex,
    string memory name,
    string memory logicType,
    string memory _type,
    uint index, // can be empty
    uint value // can be empty
  ) public {
    vm.prank(deployer);
    __RegistryCreateQuestObjectiveSystem.executeTyped(
      questIndex,
      name,
      logicType,
      _type,
      index,
      value
    );
  }

  function _createQuestRequirement(
    uint questIndex,
    string memory logicType,
    string memory _type,
    uint index, // can be empty
    uint value // can be empty
  ) public {
    vm.prank(deployer);
    __RegistryCreateQuestRequirementSystem.executeTyped(questIndex, logicType, _type, index, value);
  }

  function _createQuestReward(
    uint questIndex,
    string memory _type,
    uint itemIndex, // can be empty
    uint value // can be empty
  ) public {
    vm.prank(deployer);
    __RegistryCreateQuestRewardSystem.executeTyped(questIndex, _type, itemIndex, value);
  }

  /* SKILLS */

  function _createSkill(
    uint index,
    string memory type_,
    string memory name,
    string memory description
  ) public {
    vm.prank(deployer);
    __RegistryCreateSkillSystem.executeTyped(index, type_, name, description);
  }

  function _createSkillEffect(
    uint skillIndex,
    string memory type_,
    string memory logicType, // can be empty
    uint index, // can be empty
    uint value // can be empty
  ) public {
    vm.prank(deployer);
    __RegistryCreateSkillEffectSystem.executeTyped(index, type_, logicType, index, value);
  }

  function _createSkillRequirement(
    uint skillIndex,
    string memory type_,
    uint index, // can be empty
    uint value // can be empty
  ) public {
    vm.prank(deployer);
    __RegistryCreateSkillRequirementSystem.executeTyped(skillIndex, type_, index, value);
  }

  /* TRAITS */

  function registerTrait(
    uint specialIndex,
    uint health,
    uint power,
    uint violence,
    uint harmony,
    uint slots,
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

  function _initCommonTraits() internal {
    // Backgrounds
    registerTrait(1, 10, 0, 0, 0, 0, 9, "", "Health BG Basic", "BACKGROUND");
    registerTrait(2, 0, 1, 0, 0, 0, 9, "", "Power BG Basic", "BACKGROUND");
    registerTrait(3, 0, 0, 1, 0, 0, 9, "", "Violence BG Basic", "BACKGROUND");
    registerTrait(4, 0, 0, 0, 1, 0, 9, "", "Harmony BG Basic", "BACKGROUND");

    // Bodies
    registerTrait(1, 0, 1, 1, 0, 0, 9, "INSECT", "Insect Body Basic", "BODY");
    registerTrait(2, 10, 0, 0, 1, 0, 9, "SCRAP", "Scrap Body Basic", "BODY");
    registerTrait(3, 0, 0, 1, 1, 0, 9, "EERIE", "Eerie Body Basic", "BODY");
    registerTrait(4, 10, 0, 0, 0, 1, 9, "NORMAL", "Normal Body Basic", "BODY");

    // Colors
    registerTrait(1, 10, 0, 0, 0, 0, 9, "", "Health Color Basic", "COLOR");
    registerTrait(2, 0, 1, 0, 0, 0, 9, "", "Power Color Basic", "COLOR");
    registerTrait(3, 0, 0, 1, 0, 0, 9, "", "Violence Color Basic", "COLOR");
    registerTrait(4, 0, 0, 0, 1, 0, 9, "", "Harmony Color Basic", "COLOR");

    // Faces
    registerTrait(1, 10, 0, 0, 0, 0, 9, "", "Health Mask Basic", "FACE");
    registerTrait(2, 0, 1, 0, 0, 0, 9, "", "Power Mask Basic", "FACE");
    registerTrait(3, 0, 0, 1, 0, 0, 9, "", "Violence Mask Basic", "FACE");
    registerTrait(4, 0, 0, 0, 1, 0, 9, "", "Harmony Mask Basic", "FACE");

    // Hands
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
    __RegistryCreateFoodSystem.executeTyped(1, "Gum", 25); // itemIndex 1
    __RegistryCreateFoodSystem.executeTyped(2, "Candy", 50); // itemIndex 2
    __RegistryCreateFoodSystem.executeTyped(3, "Cookie Sticks", 100); // itemIndex 3

    // revives (reviveIndex, name, health)
    __RegistryCreateReviveSystem.executeTyped(1, "Ribbon", 10); // itemIndex 4

    vm.stopPrank();
  }

  /////////////////
  // CONFIGS

  function _getConfig(string memory key) internal view returns (uint) {
    return LibConfig.getValueOf(components, key);
  }

  function _setConfig(string memory key, uint value) internal {
    vm.prank(deployer);
    __ConfigSetSystem.executeTyped(key, value);
  }

  function _setConfigString(string memory key, string memory value) internal {
    vm.prank(deployer);
    __ConfigSetStringSystem.executeTyped(key, value);
  }

  function _initAllConfigs() internal {
    _initAccountConfigs();
    _initBaseConfigs();
    _initLeaderboardConfigs();
    _initMintConfigs();
    _initLevelingConfigs();
    _initKamiConfigs();
    _initHealthConfigs();
    _initHarvestConfigs();
    _initLiquidationConfigs();
  }

  function _initBaseConfigs() internal {
    _setConfigString("BASE_URI", "https://image.asphodel.io/kami/");
    _setConfig("MINT_TOTAL_MAX", 4444);
  }

  function _initLeaderboardConfigs() internal {
    _setConfig("LEADERBOARD_EPOCH", 1);
  }

  function _initAccountConfigs() internal {
    _setConfig("ACCOUNT_STAMINA_BASE", 20);
    _setConfig("ACCOUNT_STAMINA_RECOVERY_PERIOD", 300);
  }

  // Kami Leveling Curve
  function _initLevelingConfigs() internal {
    _setConfig("KAMI_LVL_REQ_BASE", 40);
    _setConfig("KAMI_LVL_REQ_MULT_BASE", 1259);
    _setConfig("KAMI_LVL_REQ_MULT_BASE_PREC", 3);
  }

  function _initMintConfigs() internal {
    _setConfig("MINT_ACCOUNT_MAX", 500);
    _setConfig("MINT_INITIAL_MAX", 1111);
    _setConfig("MINT_PRICE", 0);
  }

  function _initKamiConfigs() internal {
    // Idle Requirements
    _setConfig("KAMI_IDLE_REQ", 300);

    // Kami Stats
    _setConfig("KAMI_BASE_HEALTH", 50);
    _setConfig("KAMI_BASE_POWER", 10);
    _setConfig("KAMI_BASE_VIOLENCE", 10);
    _setConfig("KAMI_BASE_HARMONY", 10);
    _setConfig("KAMI_BASE_SLOTS", 0);
  }

  function _initHealthConfigs() internal {
    // Kami Health Drain Rates
    _setConfig("HEALTH_RATE_DRAIN_BASE", 1000); // in respect to harvest rate
    _setConfig("HEALTH_RATE_DRAIN_BASE_PREC", 3);

    // Kami Health Heal Rates
    _setConfig("HEALTH_RATE_HEAL_PREC", 6);
    _setConfig("HEALTH_RATE_HEAL_BASE", 100); // in respect to harmony
    _setConfig("HEALTH_RATE_HEAL_BASE_PREC", 3);
  }

  function _initHarvestConfigs() internal {
    // Harvest Rates
    _setConfig("HARVEST_RATE_PREC", 9);
    _setConfig("HARVEST_RATE_BASE", 1000);
    _setConfig("HARVEST_RATE_BASE_PREC", 3);
    _setConfig("HARVEST_RATE_MULT_PREC", 4);
    _setConfig("HARVEST_RATE_MULT_AFF_BASE", 100);
    _setConfig("HARVEST_RATE_MULT_AFF_UP", 150);
    _setConfig("HARVEST_RATE_MULT_AFF_DOWN", 50);
    _setConfig("HARVEST_RATE_MULT_AFF_PREC", 2);
  }

  function _initLiquidationConfigs() internal {
    // Liquidation Calcs
    _setConfig("LIQ_THRESH_BASE", 20);
    _setConfig("LIQ_THRESH_BASE_PREC", 2);
    _setConfig("LIQ_THRESH_MULT_AFF_BASE", 100);
    _setConfig("LIQ_THRESH_MULT_AFF_UP", 200);
    _setConfig("LIQ_THRESH_MULT_AFF_DOWN", 50);
    _setConfig("LIQ_THRESH_MULT_AFF_PREC", 2);

    // Liquidation Bounty
    _setConfig("LIQ_BOUNTY_BASE", 50);
    _setConfig("LIQ_BOUNTY_BASE_PREC", 3);
  }
}
