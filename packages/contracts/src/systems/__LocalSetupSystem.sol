// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import "forge-std/Script.sol";
import "forge-std/Vm.sol";
import "forge-std/console.sol";
import { LibString } from "solady/utils/LibString.sol";

import { IWorld } from "solecs/interfaces/IWorld.sol";
import { System } from "solecs/System.sol";
import { getAddrByID } from "solecs/utils.sol";

import { IDOwnsKamiComponent, ID as IDOwnsKamiCompID } from "components/IDOwnsKamiComponent.sol";

import { TokenBridgeSystem, ID as TokenBridgeSystemID } from "systems/TokenBridgeSystem.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibConfig } from "libraries/LibConfig.sol";
import { LibGacha } from "libraries/LibGacha.sol";
import { LibHarvest } from "libraries/LibHarvest.sol";
import { LibItem } from "libraries/LibItem.sol";
import { LibKami } from "libraries/LibKami.sol";
import { LibNode } from "libraries/LibNode.sol";

import { OpenMintable } from "tokens/OpenMintable.sol";

uint256 constant ID = uint256(keccak256("system.local.setup"));
address constant dummyAccAddr = address(0x000000000000000000000000000000000000000DeaD);

/// @notice only for local development! not intended for production
contract __LocalSetupSystem is System, Script {
  using LibString for string;

  modifier onlyLocal() {
    require(block.chainid == 1337 || block.chainid == 31337, "only local");
    _;
  }

  constructor(IWorld _world, address _components) System(_world, _components) {}

  /// @notice dummy account(s)
  function initAccounts() public onlyLocal onlyOwner {
    uint256 accID = LibAccount.create(components, dummyAccAddr, dummyAccAddr);
    LibAccount.setName(components, accID, "victim bot");
    // accID = LibAccount.create(components, msg.sender, msg.sender);
    // LibAccount.setName(components, accID, "admin");
  }

  /// @notice give accounts pets
  /// @dev assumes at least X pets in gacha
  function initPets() public onlyLocal onlyOwner {
    uint256 numPets = 10;
    uint256 accID = LibAccount.getByOwner(components, dummyAccAddr);
    require(accID != 0, "no account detected");

    uint256[] memory allGachaPets = LibGacha.getAllInGacha(components);
    require(allGachaPets.length > numPets, "not enough pets in gacha");

    // set pets to account
    IDOwnsKamiComponent ownerComp = IDOwnsKamiComponent(getAddrByID(components, IDOwnsKamiCompID));
    uint256[] memory kamiIDs = new uint256[](numPets);
    uint256[] memory accIDs = new uint256[](numPets);
    for (uint256 i = 0; i < numPets; i++) {
      kamiIDs[i] = allGachaPets[i];
      accIDs[i] = accID;
    }
    ownerComp.set(kamiIDs, accIDs);
  }

  /// @notice enslave pets into harvesting on node 1
  /// @dev pets will be starving by block.timestamp syncs lol
  function initHarvests() public onlyLocal onlyOwner {
    uint256 accID = LibAccount.getByOwner(components, dummyAccAddr);
    uint256[] memory kamiIDs = LibAccount.getKamis(components, accID);
    uint256 nodeID = LibNode.getByIndex(components, 30);

    // enslavement
    for (uint256 i = 0; i < kamiIDs.length; i++) {
      uint256 prodID = LibHarvest.create(components, nodeID, kamiIDs[i]);
      LibHarvest.start(components, prodID);
      LibKami.setState(components, kamiIDs[i], "HARVESTING");
      LibKami.setLastActionTs(components, kamiIDs[i], block.timestamp);
    }
  }

  /// @notice deploys an openMintable erc20 at the same prod address
  function attachItemERC20(uint32 itemIndex) public onlyLocal onlyOwner {
    require(LibItem.getByIndex(components, itemIndex) != 0, "item not found");

    // deploying openMintable token at prod addr
    address addr = LibItem.getTokenAddr(components, itemIndex);
    require(addr != address(0), "item no token attached");
    string memory name = LibItem.getName(components, itemIndex);
    addr = address(new OpenMintable(name, name));
    LibItem.addERC20(components, itemIndex, addr);
    OpenMintable(addr).mint(msg.sender, 9999e18); // give deployer some tokens

    // writing config address if onyx
    if (name.toCase(true).eq("ONYX")) {
      LibConfig.setAddress(components, "ONYX_ADDRESS", addr);
    }

    // logging
    console.log(name, " address: ", LibItem.getTokenAddr(components, itemIndex));
  }

  function execute(bytes memory arguments) public returns (bytes memory) {
    return "";
  }
}
