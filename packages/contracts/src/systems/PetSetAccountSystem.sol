// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById, addressToEntity } from "solecs/utils.sol";

import { LibAccount } from "libraries/LibAccount.sol";
import { LibPet } from "libraries/LibPet.sol";

uint256 constant ID = uint256(keccak256("system.Pet.SetAccount"));

// NOTE: this may not be the ideal flow for setting accounts. likely, we'll instead
// want to update the owner on transfer and just clear out the account
// NOTE: this must be called by the OWNER (not the Operator)
contract PetSetAccountSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint256 id, address to) = abi.decode(arguments, (uint256, address));
    uint256 accountID = LibAccount.getByOwner(components, msg.sender);

    require(LibPet.isPet(components, id), "Pet: not a pet");
    require(LibPet.getAccount(components, id) == accountID, "Pet: not urs");

    uint256 newAccountID = LibAccount.getByOwner(components, to);
    require(newAccountID != 0, "No Account for Owner");
    LibPet.setAccount(components, id, newAccountID);

    return abi.encode(to);
  }

  function executeTyped(uint256 id, address to) public returns (bytes memory) {
    return execute(abi.encode(id, to));
  }
}
