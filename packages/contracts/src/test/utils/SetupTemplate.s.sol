// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { Deploy } from "test/Deploy.sol";
import "std-contracts/test/MudTest.t.sol";

import { LibString } from "solady/utils/LibString.sol";
import "./TestSetupImports.sol";

abstract contract SetupTemplate is TestSetupImports {
  address[] internal owners;
  mapping(address => address) internal operators; // owner => operator

  constructor() MudTest(new Deploy()) {}

  function setUp() public virtual override {
    super.setUp();

    // during setup we want to:
    // - set the world configs
    // - create owner/operator pairs
    // - initialize media metadata

    // we also want to expose functions to:
    // - register accounts
    // - mint pets
    // - create rooms
    // - create merchants/listings
    // - create nodes
    // - populate trait registries
    // - populate item registries

    _initTraits();
    _initConfigs();
  }

  /////////////////
  // CONFIGS

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

  /////////////////
  // OWNER OPERATIONS

  // create an account. autogenerate names by the address for simplicity
  function _registerAccount(address owner, address operator) internal {
    vm.startPrank(owner, owner);
    string memory addressString = LibString.toHexString(owner);
    string memory name = LibString.slice(addressString, 0, 15); // maxlen 16
    _AccountRegisterSystem.executeTyped(operator, name);
    vm.stopPrank();
  }

  // (public) mint and reveal multiple pets for a calling address
  function _mintPets(address addr, uint256 n) internal virtual {
    for (uint256 i = 0; i < n; i++) {
      _mintPet(addr);
    }
  }

  // (public) mint and reveal a single pet to a specified address
  function _mintPet(address addr) internal virtual returns (uint256 entityID) {
    if (LibAccount.getByOwner(components, addr) == 0) {
      _registerAccount(addr, addr);
    }
    vm.startPrank(addr, addr);
    entityID = abi.decode(_ERC721MintSystem.publicMint(1), (uint256[]))[0];
    vm.roll(block.number + 1);
    _ERC721RevealSystem.executeTyped(LibPet.idToIndex(components, entityID));
    vm.stopPrank();
  }

  /////////////////
  // WORLD POPULATION

  // create a room
  function _createRoom(string memory name, uint256 location, uint256[] memory exits) internal {
    vm.prank(deployer);
    __RoomCreateSystem.executeTyped(name, location, exits);
  }

  /////////////////
  // REGISTRIES

  // creates bare minimum traits (1 of each)
  // PLACEHOLDER
  function _initTraits() internal {
    vm.startPrank(deployer);
    __RegistryCreateTraitSystem.executeTyped(
      1, // index
      100, // health
      100, // power
      100, // violence
      100, // harmony
      0, // slots
      1, // rarity tier
      "INSECT", // affinity
      "NAME", // name
      "BODY" // trait type
    );

    __RegistryCreateTraitSystem.executeTyped(
      1, // index
      100, // health
      100, // power
      100, // violence
      100, // harmony
      0, // slots
      1, // rarity tier
      "INSECT", // affinity
      "NAME", // name
      "BACKGROUND" // trait type
    );

    __RegistryCreateTraitSystem.executeTyped(
      1, // index
      100, // health
      100, // power
      100, // violence
      100, // harmony
      0, // slots
      1, // rarity tier
      "INSECT", // affinity
      "NAME", // name
      "COLOR" // trait type
    );

    __RegistryCreateTraitSystem.executeTyped(
      1, // index
      100, // health
      100, // power
      100, // violence
      100, // harmony
      0, // slots
      1, // rarity tier
      "INSECT", // affinity
      "NAME", // name
      "FACE" // trait type
    );

    __RegistryCreateTraitSystem.executeTyped(
      2, // index
      100, // health
      100, // power
      100, // violence
      100, // harmony
      0, // slots
      1, // rarity tier
      "NORMAL", // affinity
      "NAME", // name
      "FACE" // trait type
    );

    __RegistryCreateTraitSystem.executeTyped(
      3, // index
      100, // health
      100, // power
      100, // violence
      100, // harmony
      0, // slots
      1, // rarity tier
      "EERIE", // affinity
      "NAME", // name
      "FACE" // trait type
    );

    __RegistryCreateTraitSystem.executeTyped(
      4, // index
      100, // health
      100, // power
      100, // violence
      100, // harmony
      0, // slots
      1, // rarity tier
      "SCRAP", // affinity
      "NAME", // name
      "FACE" // trait type
    );

    __RegistryCreateTraitSystem.executeTyped(
      1, // index
      100, // health
      100, // power
      100, // violence
      100, // harmony
      0, // slots
      1, // rarity tier
      "INSECT", // affinity
      "NAME", // name
      "HAND" // trait type
    );

    vm.stopPrank();
  }
}
