// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract MockDataFeed {
    uint8 public immutable decimals;
    int256 private _answer;
    uint80 private _roundId;
    uint256 private _updatedAt;

    constructor(uint8 feedDecimals, int256 initialAnswer) {
        decimals = feedDecimals;
        _roundId = 1;
        _answer = initialAnswer;
        _updatedAt = block.timestamp;
    }

    function setAnswer(int256 newAnswer) external {
        _roundId += 1;
        _answer = newAnswer;
        _updatedAt = block.timestamp;
    }

    function latestRoundData()
        external
        view
        returns (uint80, int256, uint256, uint256, uint80)
    {
        return (_roundId, _answer, _updatedAt, _updatedAt, _roundId);
    }
}
