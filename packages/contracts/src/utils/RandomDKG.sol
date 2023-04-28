// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { IWorld } from "solecs/interfaces/IWorld.sol";
import { IUint256Component as IUintComp } from "solecs/interfaces/IUint256Component.sol";
import { getAddressById } from "solecs/utils.sol";

import { ProxyDKGPermissionsComponent as PermissionsComp, ID as PermissionsCompID } from "components/ProxyDKGPermissionsComponent.sol";
/* 
A simplified implementation of a randomness orcale, inspired by RandDAO and DKGs.

Overview:
  - Randomness is seeded by many participants
  - A participant contributes a random number (entopty) to the pool
  - The final random seed is a keccak256 hash of all the entopties
  - Repeats in Epoches

Randomness is seeded by two groups: 1) game participants, 2) pledgers 
game participants: 
  - randomness is seeded as part of certain actions in the game, e.g. minting a kami
  - this does not require a pledge, and is gated to only allow certain systems
pledgers:
  - similar to RandDAO, pledgers stake a fixed sum which can only be withdrawn they reveal their pledge
  - uses two phases, similar to commit reveal:
    - 1) pledgers submit a hash of their entropy 
    - 2) after the epoch, pledgers reveal their entropy. it is verified by the hash
  - if pledgers attempt to manipulate randomness by not revealing their entropy, they lose their pledge. this creates a cost for manipulating randomness

How is it random?
  - important to note: not perfect, but creates a high cost for random manipulation
  - in the hopeful case items in the Kami ecosystem become so valuable it becomes worth manipulating, the KamiDAO will have to increase costs and pledge more actively
  - This relies heavily on adversarial randomness:
    1) Players as a randomness pool: 
      - players have high activity, transactions can be used to increase entropy
      - quality of seed is lower than pledgers (seed is known in advance), but sheer volume increases security
      - enables orcale to function even without pledgers
    2) Pledgers:
      - High quality randomness (seed not known in advance)
      - Cost to manipulate
      - KamiDAO will run a pledger for additional security; other actors can run their own pledgers to ensure KamiDAO cannot manipulate the result

Why not a VRF?
  - Canto doesnt have any! (and lattice testnets etc)

Epoches:
  - Epoches are 1 day long. This is designed for minting Kami NFTs, which function on a slightly longer cycle
  - modified contracts can have shorter epoches, such as a few minutes for lootboxes
  - uses block.timestamp over block.number to account for varying blocktimes on different chains

Upgradability: 
  - Contract itself is not ownable or upgradable
  - Uses the ProxyDeploy pattern via MUD, abla to upgrade through that

NOTE: 
  - we've decided to shorten epoches to 60 seconds and sacrifice pledging.
  - this reduces random security, but it is a trade-off gameplay UX wise
  - sufficiently adversarially random, very little payoff
  - it would be possible to re-include the pledges for VRGDA mints (or when needed), depeending on KamiDAO
  - pledges is still kept in the contract, but not used. grace period is shortened to 1 block. 
    if someone insane enough wants to pledge, they can. will have no FE interface
*/
uint256 constant REVEAL_GRACE_PERIOD = 6 seconds; // 1 block on canto. shortened because not in use
uint256 constant EPOCH_LENGTH = 1 minutes;
uint256 constant PLEDGE_VALUE = 100 ether; // 100 CANTO

contract RandomDKG {
  IUintComp immutable components;

  uint256 immutable DEPLOY_TIME;

  // archive epoch seeds
  mapping(uint256 => bytes32) public seedPerEpoch;

  // pledge commits
  mapping(uint256 => mapping(address => bytes32)) public pledgeCommits;

  modifier onlySystem() {
    require(
      PermissionsComp(getAddressById(components, PermissionsCompID)).writeAccess(msg.sender),
      "SystemDKG: no write access"
    );
    _;
  }

  constructor(IUintComp _components) {
    DEPLOY_TIME = block.timestamp;
    components = _components;
  }

  function contributePublic(bytes32 entropy) external onlySystem {
    seedPerEpoch[getCurrEpoch()] = combineHash(seedPerEpoch[getCurrEpoch()], entropy);
  }

  // contributing a pledge's hash. Must be hashed off-chain
  function contributePledgeHash(bytes32 entropyHash) external payable {
    require(msg.value == PLEDGE_VALUE, "wrong pledge amount");
    pledgeCommits[getCurrEpoch()][msg.sender] = entropyHash;
  }

  function revealPledge(bytes32 entropy) external {
    bytes32 commit = pledgeCommits[getCurrPledgeEpoch()][msg.sender];

    require(commit != bytes32(0), "no pledge commit");
    require(keccak256(abi.encodePacked(entropy)) == commit, "pledge commit does not match");

    seedPerEpoch[getCurrPledgeEpoch()] = combineHash(
      seedPerEpoch[getCurrPledgeEpoch()],
      bytes32(entropy)
    );

    pledgeCommits[getCurrPledgeEpoch()][msg.sender] = bytes32(0);
    payable(msg.sender).transfer(PLEDGE_VALUE);
  }

  ////////////////////
  // GETTERS

  function getEpochSeed(uint256 epoch) public view returns (bytes32) {
    bytes32 result = seedPerEpoch[epoch];
    require(result != bytes32(0), "seed not set");
    require(getCurrPledgeEpoch() > epoch, "reveal grace period not over");
    return result;
  }

  function getCurrEpoch() public view returns (uint256) {
    return (block.timestamp - DEPLOY_TIME) / EPOCH_LENGTH;
  }

  function getCurrPledgeEpoch() public view returns (uint256) {
    return (block.timestamp - REVEAL_GRACE_PERIOD - DEPLOY_TIME) / EPOCH_LENGTH;
  }

  ///////////////////
  // UTILITY

  // combines hashes
  function combineHash(bytes32 x, bytes32 y) internal pure returns (bytes32) {
    return keccak256(abi.encode(x, y));
  }
}
