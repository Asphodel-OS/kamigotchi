// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.28;

import "tests/utils/SetupTemplate.t.sol";

contract ExternalGetterTest is SetupTemplate {
  function testExternalGet() public {
    _moveAccount(0, 1);
    uint256 kamiID = _mintKami(alice);

    _GetterSystem.getKamiByIndex(_IndexKamiComponent.get(kamiID));
    _GetterSystem.getKami(kamiID);
  }
}
