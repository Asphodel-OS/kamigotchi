// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IWorld } from "solecs/interfaces/IWorld.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { getAddressById } from "solecs/utils.sol";
import { ProxyPermissionsMintTokenComponent as PermissionsComp, ID as PermissionsCompID } from "components/ProxyPermissionsMintTokenComponent.sol";

import { ERC20 } from "solmate/tokens/ERC20.sol";

// ERC20 mint token. This can be redeemed to mint a kami
// TODO: GDA should be implemented here

uint256 constant SUPPLY = 3333;

contract MintToken is ERC20 {
  IWorld immutable World;

  modifier onlyWriter() {
    require(
      PermissionsComp(getAddressById(World.components(), PermissionsCompID)).writeAccess(
        msg.sender
      ),
      "ERC20: not a writer"
    );
    _;
  }

  constructor(
    IWorld _world,
    string memory _name,
    string memory _symbol,
    address mintTo
  ) ERC20(_name, _symbol, 18) {
    World = _world;

    // mint token to target
    super._mint(mintTo, _convertDP(SUPPLY));
  }

  //////////////////////////
  // SYSTEM INTERACTIONS

  // burns ERC20 tokens to mint a kami token
  function mintERC721(address from, uint256 amount) external onlyWriter {
    super._burn(from, _convertDP(amount));
  }

  //////////////////////////
  // INTERNAL

  // converts decimal places between game and ERC20
  // game has no decimals
  function _convertDP(uint256 amount) internal view returns (uint256) {
    return amount * 10 ** decimals;
  }
}
