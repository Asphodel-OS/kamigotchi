// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { System } from "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById } from "solecs/utils.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibCoin } from "libraries/LibCoin.sol";

import { KamiERC721 } from "tokens/KamiERC721.sol";
import { ERC721ProxySystem, ID as ProxyID } from "systems/ERC721ProxySystem.sol";

uint256 constant ID = uint256(keccak256("system.ERC721.Withdraw"));

// sets a pet game world => outside world
contract ERC721WithdrawSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    uint256 entityID = abi.decode(arguments, (uint256));
    uint256 accountID = LibAccount.getByAddress(components, msg.sender);

    require(LibPet.getAccount(components, petID) == accountID, "Pet: not urs");

    LibCoin.dec(components, accountID, entityID);
    KamiERC721 token = ERC721ProxySystem(getAddressById(world.systems(), ProxyID)).getToken();
    token.withdraw(address(uint160(LibAccount.getOwner(components, accountID))), entityID);

    return "";
  }

  function executeTyped(uint256 entityID) public returns (bytes memory) {
    return execute(abi.encode(entityID));
  }
}
