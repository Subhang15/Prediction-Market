# Prophet Zero

## Overview

This project contains:

- **Smart contracts** in `contracts/PredictionMarket.sol`
  - `PredictionMarketFactory` deploys market instances
  - `PredictionMarket` handles minting, AMM-based trading, resolution, and redemption
- **Frontend** in `frontend/` (Next.js + Tailwind + wagmi)
  - Wallet connection (MetaMask)
  - Market dashboard with probability bars
  - Trade interface for buy/sell actions

Note: This is currently an MVP and the markets are seeded for demo as of now. chain link functions can be made and used for real life market predictions like sports or politics.

---

## Architecture

### Factory Pattern (Why it was used)

The protocol uses a **Factory Pattern** so each real-world event has its own isolated contract instance.

Benefits:

- **Isolation of risk/state**: one market's trading or settlement state never pollutes another.
- **Scalable market creation**: factory can deploy unlimited event markets with consistent logic.
- **Cleaner indexing/UI**: frontends can discover markets through the factory registry (`allMarkets`, `marketsCount`).
- **Extensibility**: future versions can deploy upgraded market templates while preserving historical markets.

### Market Mechanics + AMM Logic (Why it was used)

Each market is binary (`YES` / `NO`) and supports:

1. **Minting paired shares**  
   Users deposit ETH into `mint()` and receive equal YES + NO share units (`1 ETH -> 1 YES + 1 NO` in wei-based units).

2. **AMM-style selling**  
   Users can sell one side (`sellYes`, `sellNo`) back to ETH using a simple constant-product style pricing relation based on reserve state.

Why AMM logic:

- avoids centralized order books and market makers
- gives deterministic on-chain price discovery from reserves
- creates continuous liquidity for exits before market close

### Oracle-based Resolution Flow

After `endTimestamp`, `resolveMarket()` reads latest Chainlink feed data and determines winner:

- `YES` if `oracleAnswer >= outcomeThreshold`
- else `NO`

On resolution:

- trading is locked
- final ETH pool is snapshotted
- winning-side holders can call `redeem()` to claim proportional payouts

---

## Security Model

### Reentrancy Protection

All ETH-moving external functions use OpenZeppelin `ReentrancyGuard`:

- `mint()`
- `sellYes()`
- `sellNo()`
- `resolveMarket()`
- `redeem()`

This prevents common recursive-call attack patterns during state mutation + value transfer.

### Trust-Minimized Oracle Resolution

Market outcome is resolved from a Chainlink feed instead of admin-controlled manual input, which improves trust assumptions by:

- using decentralized oracle infrastructure
- removing discretionary operator resolution logic
- making settlement rule deterministic and verifiable on-chain

### Additional safeguards in contract logic

- time gating (`endTimestamp`) for trading/resolution
- single-resolution guarantee (`marketResolved` guard)
- stale/incomplete oracle round checks
- payout snapshot at resolution to prevent post-resolution manipulation

---

## Project Structure

```text
.
├── contracts/
│   └── PredictionMarket.sol
├── hardhat.config.js
├── package.json
└── frontend/
    ├── app/
    ├── components/
    ├── lib/
    └── package.json
```

---

## How To Run

## Option A: Hardhat (current default setup)

### 1) Install root dependencies

```bash
npm install
```

### 2) Install frontend dependencies

```bash
cd frontend
npm install
cd ..
```

### 3) Compile contracts

```bash
npm run compile
```

### 4) Start local chain (new terminal)

```bash
npx hardhat node
```

### 5) Deploy contracts

Create a deploy script (recommended: `scripts/deploy.js`) or use your existing deployment workflow, then run:

```bash
npx hardhat run scripts/deploy-local.mjs --network localhost
```

### 6) Configure frontend env

In `frontend/.env.local` set:

```env
NEXT_PUBLIC_FACTORY_ADDRESS=<deployed_factory_address>
NEXT_PUBLIC_HARDHAT_RPC_URL=http://127.0.0.1:8545
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://rpc.sepolia.org
```

### 7) Run frontend

```bash
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and connect MetaMask.

---

## Frontend Highlights

- **Next.js App Router** + Tailwind-based polished UI
- **wagmi + viem** for wallet and contract interactions
- **Market Dashboard** reads active markets from factory
- **Probability Bar** derives implied probability from YES/NO reserve price ratio
- **Trade Panel** supports buy (mint) and sell actions with clean UX states

---

## Future Improvements

1. **Layer 2 scaling (Base / Polygon)**  
   Deploy on lower-fee chains to improve UX and enable smaller position sizes.

2. **Multi-outcome markets**  
   Extend beyond binary outcomes to categorical markets (e.g., 4-way election outcomes).

3. **Advanced liquidity design**  
   Add fees, LP incentives, or dynamic curves for deeper and more robust markets.

4. **Decentralized governance / dispute module**  
   Add fallback dispute handling for oracle edge cases.

5. **Analytics + historical charts**  
   Integrate event indexing for richer market insights.

---

## Disclaimer

This project is for educational and portfolio purposes. It has not been audited. Do not use with significant real funds without formal security review.
