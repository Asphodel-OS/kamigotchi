// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import { Ownable } from "solady/auth/Ownable.sol";
import { SafeTransferLib } from "solady/utils/SafeTransferLib.sol";
import { Kami721 } from "tokens/Kami721.sol";

/// @title  KamiMarketVault
/// @notice Persistent relay for WETH and Kami721 transfers.
///         Buyers approve this contract to spend their WETH.
///         Sellers approve this contract to transfer their Kamis.
///         Systems are authorized callers. Address persists across system upgrades.
contract KamiMarketVault is Ownable {
  address public immutable WETH;
  Kami721 public immutable KAMI721;
  mapping(address => bool) public authorizedCallers;

  error NotAuthorized();

  modifier onlyAuthorized() {
    if (!authorizedCallers[msg.sender]) revert NotAuthorized();
    _;
  }

  constructor(address _weth, address _kami721, address _owner) {
    WETH = _weth;
    KAMI721 = Kami721(_kami721);
    _initializeOwner(_owner);
  }

  /// @notice Transfer WETH from buyer to recipient. Only callable by authorized systems.
  function transferWETH(address from, address to, uint256 amount) external onlyAuthorized {
    SafeTransferLib.safeTransferFrom(WETH, from, to, amount);
  }

  /// @notice Transfer a Kami721 token via standard ERC-721 transferFrom.
  ///         Seller must have approved this contract (setApprovalForAll or approve).
  function transferKami(address from, address to, uint256 tokenId) external onlyAuthorized {
    KAMI721.transferFrom(from, to, tokenId);
  }

  function authorizeCaller(address caller) external onlyOwner {
    authorizedCallers[caller] = true;
  }

  function unauthorizeCaller(address caller) external onlyOwner {
    authorizedCallers[caller] = false;
  }
}
