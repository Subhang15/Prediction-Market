// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title PredictionMarketFactory
/// @notice Deploys isolated binary prediction markets for specific events.
contract PredictionMarketFactory {
    address[] public markets;

    event MarketCreated(
        address indexed market,
        address indexed creator,
        string question,
        uint64 endTimestamp,
        address indexed dataFeed,
        int256 outcomeThreshold
    );

    function createMarket(
        string calldata question,
        uint64 endTimestamp,
        address dataFeed,
        int256 outcomeThreshold
    ) external returns (address market) {
        require(bytes(question).length > 0, "QUESTION_REQUIRED");
        require(endTimestamp > block.timestamp, "INVALID_END_TIME");
        require(dataFeed != address(0), "INVALID_DATA_FEED");

        PredictionMarket deployed = new PredictionMarket(
            msg.sender,
            question,
            endTimestamp,
            dataFeed,
            outcomeThreshold
        );

        market = address(deployed);
        markets.push(market);

        emit MarketCreated(
            market,
            msg.sender,
            question,
            endTimestamp,
            dataFeed,
            outcomeThreshold
        );
    }

    function allMarkets() external view returns (address[] memory) {
        return markets;
    }

    function marketsCount() external view returns (uint256) {
        return markets.length;
    }
}

/// @title PredictionMarket
/// @notice Binary market where users mint paired YES/NO shares with ETH.
/// @dev Shares are tracked in internal accounting (not ERC20 tokens).
contract PredictionMarket is ReentrancyGuard {
    enum Outcome {
        Unresolved,
        Yes,
        No
    }

    address public immutable creator;
    string public question;
    uint64 public immutable endTimestamp;
    AggregatorV3Interface public immutable dataFeed;
    int256 public immutable outcomeThreshold;

    // user => share balances (1 share is represented in wei units)
    mapping(address => uint256) public yesShares;
    mapping(address => uint256) public noShares;
    mapping(address => bool) public hasRedeemed;

    // Aggregate reserves used for AMM sell pricing.
    uint256 public yesReserve;
    uint256 public noReserve;
    uint256 public ethReserve;
    uint256 public totalYesHeld;
    uint256 public totalNoHeld;

    bool public marketResolved;
    Outcome public winningOutcome;
    int256 public resolvedOracleValue;
    uint256 public resolvedEthPool;
    uint256 public winningSharesAtResolution;
    uint80 public resolvedRoundId;

    event Minted(address indexed user, uint256 ethIn, uint256 sharesMintedEach);
    event BetPlaced(address indexed user, Outcome indexed outcome, uint256 ethIn, uint256 sharesOut);
    event SoldYes(address indexed user, uint256 yesIn, uint256 ethOut);
    event SoldNo(address indexed user, uint256 noIn, uint256 ethOut);
    event MarketResolved(
        Outcome winningOutcome,
        int256 oracleValue,
        uint80 oracleRoundId,
        uint256 lockedEthPool,
        uint256 winningShares
    );
    event Redeemed(
        address indexed user,
        Outcome winningOutcome,
        uint256 winningSharesRedeemed,
        uint256 ethOut
    );

    constructor(
        address marketCreator,
        string memory marketQuestion,
        uint64 marketEndTimestamp,
        address marketDataFeed,
        int256 marketOutcomeThreshold
    ) {
        creator = marketCreator;
        question = marketQuestion;
        endTimestamp = marketEndTimestamp;
        dataFeed = AggregatorV3Interface(marketDataFeed);
        outcomeThreshold = marketOutcomeThreshold;
    }

    /// @notice Deposit ETH to mint equal YES and NO shares.
    /// @dev 1 wei ETH => 1 wei YES + 1 wei NO share units.
    function mint() external payable nonReentrant {
        require(!_isTradingLocked(), "TRADING_LOCKED");
        require(msg.value > 0, "ZERO_VALUE");

        uint256 sharesToMint = msg.value;

        yesShares[msg.sender] += sharesToMint;
        noShares[msg.sender] += sharesToMint;
        totalYesHeld += sharesToMint;
        totalNoHeld += sharesToMint;

        // Treat mint deposits as adding AMM liquidity for both outcomes.
        yesReserve += sharesToMint;
        noReserve += sharesToMint;
        ethReserve += msg.value;

        emit Minted(msg.sender, msg.value, sharesToMint);
    }

    /// @notice Place a direct YES bet using ETH.
    /// @dev 1 wei ETH => 1 wei YES share units.
    function betYes() external payable nonReentrant {
        require(!_isTradingLocked(), "TRADING_LOCKED");
        require(msg.value > 0, "ZERO_VALUE");

        yesShares[msg.sender] += msg.value;
        totalYesHeld += msg.value;
        yesReserve += msg.value;
        ethReserve += msg.value;

        emit BetPlaced(msg.sender, Outcome.Yes, msg.value, msg.value);
    }

    /// @notice Place a direct NO bet using ETH.
    /// @dev 1 wei ETH => 1 wei NO share units.
    function betNo() external payable nonReentrant {
        require(!_isTradingLocked(), "TRADING_LOCKED");
        require(msg.value > 0, "ZERO_VALUE");

        noShares[msg.sender] += msg.value;
        totalNoHeld += msg.value;
        noReserve += msg.value;
        ethReserve += msg.value;

        emit BetPlaced(msg.sender, Outcome.No, msg.value, msg.value);
    }

    /// @notice Sell YES shares for ETH using simple constant-product pricing.
    function sellYes(uint256 amountYes) external nonReentrant returns (uint256 ethOut) {
        require(!_isTradingLocked(), "TRADING_LOCKED");
        require(amountYes > 0, "ZERO_AMOUNT");
        require(yesShares[msg.sender] >= amountYes, "INSUFFICIENT_YES");
        require(yesReserve > 0 && ethReserve > 0, "NO_LIQUIDITY");

        // x*y=k for YES/ETH side:
        // oldX = yesReserve, oldY = ethReserve, newX = oldX + amountYes.
        // ethOut = oldY - (k / newX) = (oldY * amountYes) / (oldX + amountYes)
        ethOut = (ethReserve * amountYes) / (yesReserve + amountYes);
        require(ethOut > 0, "OUTPUT_TOO_SMALL");
        require(address(this).balance >= ethOut, "INSUFFICIENT_ETH_BALANCE");

        yesShares[msg.sender] -= amountYes;
        totalYesHeld -= amountYes;
        yesReserve += amountYes;
        ethReserve -= ethOut;

        (bool ok, ) = payable(msg.sender).call{value: ethOut}("");
        require(ok, "ETH_TRANSFER_FAILED");

        emit SoldYes(msg.sender, amountYes, ethOut);
    }

    /// @notice Sell NO shares for ETH using simple constant-product pricing.
    function sellNo(uint256 amountNo) external nonReentrant returns (uint256 ethOut) {
        require(!_isTradingLocked(), "TRADING_LOCKED");
        require(amountNo > 0, "ZERO_AMOUNT");
        require(noShares[msg.sender] >= amountNo, "INSUFFICIENT_NO");
        require(noReserve > 0 && ethReserve > 0, "NO_LIQUIDITY");

        // x*y=k for NO/ETH side.
        ethOut = (ethReserve * amountNo) / (noReserve + amountNo);
        require(ethOut > 0, "OUTPUT_TOO_SMALL");
        require(address(this).balance >= ethOut, "INSUFFICIENT_ETH_BALANCE");

        noShares[msg.sender] -= amountNo;
        totalNoHeld -= amountNo;
        noReserve += amountNo;
        ethReserve -= ethOut;

        (bool ok, ) = payable(msg.sender).call{value: ethOut}("");
        require(ok, "ETH_TRANSFER_FAILED");

        emit SoldNo(msg.sender, amountNo, ethOut);
    }

    /// @notice Resolve market outcome from Chainlink Data Feed after event end.
    /// @dev YES wins when latest oracle value >= outcomeThreshold, otherwise NO wins.
    function resolveMarket() external nonReentrant {
        require(block.timestamp >= endTimestamp, "EVENT_NOT_ENDED");
        require(!marketResolved, "ALREADY_RESOLVED");

        (
            uint80 roundId,
            int256 answer,
            ,
            uint256 updatedAt,
            uint80 answeredInRound
        ) = dataFeed.latestRoundData();
        require(updatedAt != 0, "STALE_ORACLE_DATA");
        require(answeredInRound >= roundId, "INCOMPLETE_ORACLE_ROUND");

        Outcome outcome = answer >= outcomeThreshold ? Outcome.Yes : Outcome.No;
        uint256 winnersSupply = outcome == Outcome.Yes ? totalYesHeld : totalNoHeld;
        require(winnersSupply > 0, "NO_WINNING_SHARES");

        marketResolved = true;
        winningOutcome = outcome;
        resolvedOracleValue = answer;
        resolvedRoundId = roundId;
        resolvedEthPool = address(this).balance;
        winningSharesAtResolution = winnersSupply;

        emit MarketResolved(
            outcome,
            answer,
            roundId,
            resolvedEthPool,
            winningSharesAtResolution
        );
    }

    /// @notice Redeem winning shares for proportional ETH after resolution.
    function redeem() external nonReentrant returns (uint256 ethOut) {
        require(marketResolved, "NOT_RESOLVED");
        require(!hasRedeemed[msg.sender], "ALREADY_REDEEMED");

        uint256 userWinningShares = winningOutcome == Outcome.Yes
            ? yesShares[msg.sender]
            : noShares[msg.sender];
        require(userWinningShares > 0, "NO_WINNING_SHARES");

        ethOut = (resolvedEthPool * userWinningShares) / winningSharesAtResolution;
        require(ethOut > 0, "OUTPUT_TOO_SMALL");
        require(address(this).balance >= ethOut, "INSUFFICIENT_ETH_BALANCE");

        hasRedeemed[msg.sender] = true;

        if (winningOutcome == Outcome.Yes) {
            yesShares[msg.sender] = 0;
            totalYesHeld -= userWinningShares;
        } else {
            noShares[msg.sender] = 0;
            totalNoHeld -= userWinningShares;
        }

        (bool ok, ) = payable(msg.sender).call{value: ethOut}("");
        require(ok, "ETH_TRANSFER_FAILED");

        emit Redeemed(msg.sender, winningOutcome, userWinningShares, ethOut);
    }

    function getPoolState()
        external
        view
        returns (uint256 yesPool, uint256 noPool, uint256 ethPool)
    {
        return (yesReserve, noReserve, ethReserve);
    }

    function _isTradingLocked() internal view returns (bool) {
        return marketResolved || block.timestamp >= endTimestamp;
    }
}

