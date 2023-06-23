// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { Deploy } from "test/Deploy.sol";
import "std-contracts/test/MudTest.t.sol";

import { LibString } from "solady/utils/LibString.sol";
import "./TestSetupImports.sol";

abstract contract SetupTemplate is TestSetupImports {
  address[] internal _owners;
  mapping(address => address) internal _operators; // owner => operator

  constructor() MudTest(new Deploy()) {}

  function setUp() public virtual override {
    super.setUp();

    // during setup we want to:
    // - set the world configs
    // - create owner/operator pairs

    // we also want to expose functions to:
    // - register accounts
    // - mint pets
    // - create rooms
    // - create merchants/listings
    // - create nodes
    // - populate trait registries
    // - populate item registries

    _createOwnerOperatorPairs(10); // create 10 pairs of Owners/Operators
    _initConfigs();
  }

  /////////////////
  // EOAs

  // get an owner by its (testing) EOA index
  function _getOwner(uint256 playerIndex) internal view returns (address) {
    require(playerIndex < _owners.length, "playerIndex out of bounds");
    return _owners[playerIndex];
  }

  // get an operator by its (testing) EOA playerIndex
  function _getOperator(uint256 playerIndex) internal view returns (address) {
    require(playerIndex < _owners.length, "playerIndex out of bounds");
    return _operators[_owners[playerIndex]];
  }

  // create multiple sets of owner/operator pair addresses
  function _createOwnerOperatorPairs(uint256 n) internal {
    for (uint256 i = 0; i < n; i++) {
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

  function _getAccountBalance(uint playerIndex) internal view returns (uint256) {
    uint accountID = _getAccount(playerIndex);
    return LibCoin.get(components, accountID);
  }

  // get an account by the Owner address' testing playerIndex
  function _getAccount(uint256 playerIndex) internal view returns (uint256) {
    require(playerIndex < _owners.length, "index out of bounds");
    address owner = _owners[playerIndex];
    return LibAccount.getByOwner(components, owner);
  }

  // create an account. autogenerate names by the address for simplicity
  function _registerAccount(uint256 playerIndex) internal {
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
  function _mintPets(uint256 playerIndex, uint256 n) internal virtual {
    for (uint256 i = 0; i < n; i++) {
      _mintPet(playerIndex);
    }
  }

  // (public) mint and reveal a single pet to a specified address
  function _mintPet(uint256 playerIndex) internal virtual returns (uint256 id) {
    address owner = _owners[playerIndex];
    address operator = _operators[owner];

    vm.startPrank(owner);
    id = abi.decode(_ERC721MintSystem.publicMint(1), (uint256[]))[0];
    vm.stopPrank();

    vm.roll(block.number + 1);

    vm.startPrank(operator);
    _ERC721RevealSystem.executeTyped(LibPet.idToIndex(components, id));
    vm.stopPrank();
  }

  /////////////////
  // OPERATOR ACTIONS
  function _moveAccount(uint256 playerIndex, uint256 location) internal {
    address operator = _operators[_owners[playerIndex]];
    vm.prank(operator);
    _AccountMoveSystem.executeTyped(location);
  }

  /////////////////
  // WORLD POPULATION

  // create a room with up to three exits
  // 0s represent empty inputs
  function _createRoom(
    string memory name,
    uint256 location,
    uint256 exit1,
    uint256 exit2,
    uint256 exit3
  ) internal {
    uint256 numExits = 3;
    if (exit1 == 0) numExits--;
    if (exit2 == 0) numExits--;
    if (exit3 == 0) numExits--;

    uint256[] memory exits = new uint256[](numExits);
    if (numExits > 0) exits[0] = exit1;
    if (numExits > 1) exits[1] = exit2;
    if (numExits > 2) exits[2] = exit3;

    vm.prank(deployer);
    __RoomCreateSystem.executeTyped(name, location, exits);
  }

  /////////////////
  // REGISTRIES

  // creates bare minimum traits (1 of each)
  // PLACEHOLDER
  function registerTrait(
    uint256 specialIndex,
    uint256 health,
    uint256 power,
    uint256 violence,
    uint256 harmony,
    uint256 slots,
    uint256 rarityTier,
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

  function _initTraits() internal {
    // Bodies
    registerTrait(1, 100, 100, 100, 100, 0, 1, "INSECT", "NAME", "BODY");

    // Backgrounds
    registerTrait(1, 100, 100, 100, 100, 0, 1, "INSECT", "NAME", "BACKGROUND");

    // Colors
    registerTrait(1, 100, 100, 100, 100, 0, 1, "INSECT", "NAME", "COLOR");

    // Faces
    registerTrait(1, 100, 100, 100, 100, 0, 1, "INSECT", "NAME", "FACE");
    registerTrait(2, 100, 100, 100, 100, 0, 1, "NORMAL", "NAME", "FACE");
    registerTrait(3, 100, 100, 100, 100, 0, 1, "EERIE", "NAME", "FACE");
    registerTrait(4, 100, 100, 100, 100, 0, 1, "SCRAP", "NAME", "FACE");

    // Hands
    registerTrait(1, 100, 100, 100, 100, 0, 1, "INSECT", "NAME", "HAND");
  }

  function _initItems() internal {
    vm.startPrank(deployer);

    // food (foodIndex, name, health)
    __RegistryCreateFoodSystem.executeTyped(1, "Gum", 25); // itemIndex 1
    __RegistryCreateFoodSystem.executeTyped(2, "Candy", 100); // itemIndex 2
    __RegistryCreateFoodSystem.executeTyped(3, "Cookie Sticks", 200); // itemIndex 3

    // revives (reviveIndex, name, health)
    __RegistryCreateReviveSystem.executeTyped(1, "Ribbon", 10); // itemIndex 4

    vm.stopPrank();
  }

  /////////////////
  // CONFIGS

  function _getConfig(string memory key) internal view returns (uint256) {
    return LibConfig.getValueOf(components, key);
  }

  function _setConfig(string memory key, uint256 value) internal {
    vm.prank(deployer);
    __ConfigSetSystem.executeTyped(key, value);
  }

  function _setConfigString(string memory key, string memory value) internal {
    vm.prank(deployer);
    __ConfigSetStringSystem.executeTyped(key, value);
  }

  function _initConfigs() internal {
    // Base URI
    _setConfigString("baseURI", "https://image.asphodel.io/kami/");

    // Account Stamina
    _setConfig("ACCOUNT_STAMINA_BASE", 20);
    _setConfig("ACCOUNT_STAMINA_RECOVERY_PERIOD", 300);

    // Kami Stats
    _setConfig("KAMI_BASE_HEALTH", 50);
    _setConfig("KAMI_BASE_POWER", 10);
    _setConfig("KAMI_BASE_VIOLENCE", 10);
    _setConfig("KAMI_BASE_HARMONY", 10);
    _setConfig("KAMI_BASE_SLOTS", 0);

    // Harvest Rates
    _setConfig("HARVEST_RATE_PREC", 9);
    _setConfig("HARVEST_RATE_BASE", 100);
    _setConfig("HARVEST_RATE_BASE_PREC", 3);
    _setConfig("HARVEST_RATE_MULT_PREC", 4);
    _setConfig("HARVEST_RATE_MULT_AFF_BASE", 100);
    _setConfig("HARVEST_RATE_MULT_AFF_UP", 150);
    _setConfig("HARVEST_RATE_MULT_AFF_DOWN", 50);
    _setConfig("HARVEST_RATE_MULT_AFF_PREC", 2);

    // Kami Health Drain/Heal Rates
    _setConfig("HEALTH_RATE_DRAIN_BASE", 5000); // in respect to harvest rate
    _setConfig("HEALTH_RATE_DRAIN_BASE_PREC", 3);
    _setConfig("HEALTH_RATE_HEAL_PREC", 6);
    _setConfig("HEALTH_RATE_HEAL_BASE", 100); // in respect to harmony
    _setConfig("HEALTH_RATE_HEAL_BASE_PREC", 3);

    // Liquidation Idle Requirements
    _setConfig("LIQ_IDLE_REQ", 300);

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

    // Mint Settings
    _setConfig("MINT_MAX", 500);
    _setConfig("MINT_PRICE", 0);
  }
}
