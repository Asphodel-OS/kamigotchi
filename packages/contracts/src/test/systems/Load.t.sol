// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "test/utils/SetupTemplate.s.sol";

/*
 * This is a load bearing test. Yes. A load bearing test.
 * This test is used to force a compilation error during the build step to
 * circumvent an incorrectly surfaced error by foundry during deployment. This
 * error is only present when compiling/deploying externalized library functions
 * and unavoidable otherwise.
 *
 * See for yourself. Remove this file and 'yarn dev' from the packages/contracts.
 * Witness the cognito-hazard for yourself. Just know that I bear no responsibility
 * for any resulting aneurysms.
 */
contract LoadBearingTest is SetupTemplate {
  __waddafakSystem.executeTyped();
}
