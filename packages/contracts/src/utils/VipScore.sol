// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

error PermissionDenied(address deniedAddress);
error ZeroStage();
error AddrsAndAmountsLengthMistmatch();
error StageNotFound(uint64 stage);
error StageFinalized(uint64 stage);
error PreviousStageNotFinalized(uint64 stage);

event CreateStage(uint64 stage);

event FinalizeStage(uint64 stage);

event UpdateScore(address indexed addr, uint64 indexed stage, uint64 score, uint64 totalScore);

contract VipScore {
  struct StageInfo {
    uint64 stage;
    uint64 totalScore;
    bool isFinalized;
  }

  struct Score {
    bool isIndexed;
    uint64 amount;
  }

  struct ScoreResponse {
    address addr;
    uint64 amount;
    uint64 index;
  }

  uint64 public initStage;
  mapping(uint64 => StageInfo) public stages;
  mapping(uint64 => mapping(address => Score)) public scores; // stage => address => score
  mapping(uint64 => mapping(uint64 => address)) private scoreKeys; // stage => index => address (for iterable mapping)
  mapping(uint64 => uint64) private scoreLength; // stage => count of score length (for iterable mapping)
  mapping(address => bool) public allowList;

  constructor(uint64 initStage_) {
    allowList[msg.sender] = true;
    initStage = initStage_;
    createStage(initStage);
  }

  modifier onlyAllower() {
    if (!allowList[msg.sender]) {
      revert PermissionDenied({ deniedAddress: msg.sender });
    }
    _;
  }

  function finalizeStage(uint64 stage) external onlyAllower {
    if (stages[stage].stage == 0) {
      revert StageNotFound(stage);
    }

    StageInfo storage stageInfo = stages[stage];
    stageInfo.isFinalized = true;

    emit FinalizeStage(stage);

    createStage(stage + 1);
  }

  function increaseScore(uint64 stage, address addr, uint64 amount) external onlyAllower {
    // ignore if address is 0x0
    if (addr == address(0x0)) {
      return;
    }

    if (stages[stage].stage == 0) {
      revert StageNotFound(stage);
    }

    if (stages[stage].isFinalized) {
      revert StageFinalized(stage);
    }

    setScoreIndex(stage, addr);
    StageInfo storage stageInfo = stages[stage];
    Score storage score = scores[stage][addr];

    stageInfo.totalScore += amount;
    score.amount += amount;

    emit UpdateScore(addr, stage, score.amount, stages[stage].totalScore);
  }

  function decreaseScore(uint64 stage, address addr, uint64 amount) external onlyAllower {
    // ignore if address is 0x0
    if (addr == address(0x0)) {
      return;
    }

    if (stages[stage].stage == 0) {
      revert StageNotFound(stage);
    }

    if (stages[stage].isFinalized) {
      revert StageFinalized(stage);
    }

    setScoreIndex(stage, addr);
    StageInfo storage stageInfo = stages[stage];
    Score storage score = scores[stage][addr];

    stageInfo.totalScore -= amount;
    score.amount -= amount;

    emit UpdateScore(addr, stage, score.amount, stages[stage].totalScore);
  }

  function updateScore(uint64 stage, address addr, uint64 amount) external onlyAllower {
    _updateScore(stage, addr, amount);
  }

  function updateScores(
    uint64 stage,
    address[] calldata addrs,
    uint64[] calldata amounts
  ) external onlyAllower {
    if (addrs.length != amounts.length) {
      revert AddrsAndAmountsLengthMistmatch();
    }

    uint256 len = addrs.length;
    for (uint256 i; i < len; i++) {
      _updateScore(stage, addrs[i], amounts[i]);
    }
  }

  function addAllowList(address addr) external onlyAllower {
    allowList[addr] = true;
  }

  function removeAllowList(address addr) external onlyAllower {
    delete allowList[addr];
  }

  function _updateScore(uint64 stage, address addr, uint64 amount) private {
    // ignore if address is 0x0
    if (addr == address(0x0)) {
      return;
    }

    if (stages[stage].stage == 0) {
      revert StageNotFound(stage);
    }

    if (stages[stage].isFinalized) {
      revert StageFinalized(stage);
    }

    setScoreIndex(stage, addr);
    StageInfo storage stageInfo = stages[stage];
    Score storage score = scores[stage][addr];

    int128 scoreDiff = int128(uint128(amount)) - int128(uint128(score.amount));
    score.amount = amount;
    stageInfo.totalScore = uint64(uint128(int128(uint128(stages[stage].totalScore)) + scoreDiff));

    emit UpdateScore(addr, stage, score.amount, stages[stage].totalScore);
  }

  function createStage(uint64 stage) private {
    if (stage == 0) {
      revert ZeroStage();
    }

    if (stages[stage].stage != 0) {
      return;
    }

    StageInfo storage stageInfo = stages[stage];
    stageInfo.stage = stage;
    stageInfo.totalScore = 0;
    stageInfo.isFinalized = false;

    emit CreateStage(stage);
  }

  function getScores(
    uint64 stage,
    uint64 offset,
    uint64 limit
  ) public view returns (ScoreResponse[] memory) {
    ScoreResponse[] memory response = new ScoreResponse[](limit);
    for (uint64 i; i < limit; i++) {
      uint64 index = i + offset + 1;
      address key = scoreKeys[stage][index];
      if (key == address(0x0)) {
        break;
      }

      response[i] = (ScoreResponse({ addr: key, amount: scores[stage][key].amount, index: index }));
    }
    return response;
  }

  function setScoreIndex(uint64 stage, address addr) private {
    // check score exists
    Score storage score = scores[stage][addr];
    if (!score.isIndexed) {
      score.isIndexed = true;
      scoreLength[stage] += 1;
      scoreKeys[stage][scoreLength[stage]] = addr;
    }
  }
}
