// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

import { ERC20 } from "solmate/tokens/ERC20.sol";

contract OpenMintable is ERC20 {
  constructor(string memory _name, string memory _symbol) ERC20(_name, _symbol, 18) {}

  function mint(address to, uint256 amount) public virtual {
    _mint(to, amount);
  }
}
