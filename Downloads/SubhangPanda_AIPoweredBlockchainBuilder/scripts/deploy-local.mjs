import { readFileSync, writeFileSync } from "node:fs";
import { ethers } from "ethers";

function loadArtifact(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

/** Mock oracle reports $2000 (8 decimals). Contract: YES wins if oracle >= threshold. */
const ORACLE_USD = 2000n;

function guaranteedWinner(thresholdUsd) {
  return ORACLE_USD >= thresholdUsd ? "YES" : "NO";
}

async function main() {
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  const wallet = new ethers.Wallet(
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
    provider
  );
  const signer = new ethers.NonceManager(wallet);

  console.log("Deploying with:", wallet.address);

  const mockArtifact = loadArtifact(
    "artifacts/contracts/MockDataFeed.sol/MockDataFeed.json"
  );
  const factoryArtifact = loadArtifact(
    "artifacts/contracts/PredictionMarket.sol/PredictionMarketFactory.json"
  );

  const mockFactory = new ethers.ContractFactory(
    mockArtifact.abi,
    mockArtifact.bytecode,
    signer
  );
  const mockFeed = await mockFactory.deploy(8, ORACLE_USD * 10n ** 8n);
  await mockFeed.waitForDeployment();
  const mockFeedAddress = await mockFeed.getAddress();
  console.log("MockDataFeed (fixed $%s answer):", ORACLE_USD.toString(), mockFeedAddress);

  const factoryFactory = new ethers.ContractFactory(
    factoryArtifact.abi,
    factoryArtifact.bytecode,
    signer
  );
  const factory = await factoryFactory.deploy();
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("PredictionMarketFactory:", factoryAddress);

  const now = Math.floor(Date.now() / 1000);
  const marketsToCreate = [
    {
      question: "Demo #1: Will ETH be at least $1,800? (resolves in ~2 min)",
      endTime: now + 120,
      thresholdUsd: 1800n,
    },
    {
      question: "Demo #2: Will ETH be at least $1,900? (resolves in ~3 min)",
      endTime: now + 180,
      thresholdUsd: 1900n,
    },
    {
      question: "Demo #3: Will ETH be at least $1,999? (resolves in ~4 min)",
      endTime: now + 240,
      thresholdUsd: 1999n,
    },
    {
      question: "Demo #4: Will ETH be at least $2,000? (tie edge — same as oracle) (~5 min)",
      endTime: now + 300,
      thresholdUsd: 2000n,
    },
    {
      question: "Demo #5: Will ETH be at least $2,001? (resolves in ~6 min)",
      endTime: now + 360,
      thresholdUsd: 2001n,
    },
    {
      question: "Demo #6: Will ETH be at least $2,200? (resolves in ~7 min)",
      endTime: now + 420,
      thresholdUsd: 2200n,
    },
    {
      question: "Demo #7: Will ETH be at least $2,500? (resolves in ~8 min)",
      endTime: now + 480,
      thresholdUsd: 2500n,
    },
  ];

  console.log("\n--- Guaranteed winners (local mock oracle = $%s) ---", ORACLE_USD.toString());
  marketsToCreate.forEach((m, i) => {
    const t = m.thresholdUsd;
    const win = guaranteedWinner(t);
    console.log(
      `  Market ${i + 1}: threshold $${t} → ${win} wins  (bet ${win} to test redeem)`,
    );
  });
  console.log("---\n");

  for (const market of marketsToCreate) {
    const tx = await factory.createMarket(
      market.question,
      market.endTime,
      mockFeedAddress,
      market.thresholdUsd * 10n ** 8n,
    );
    await tx.wait();
  }

  const markets = await factory.allMarkets();
  console.log("Seeded markets:", markets.length);
  console.log("First market:", markets[0]);

  const envOutput = `NEXT_PUBLIC_FACTORY_ADDRESS=${factoryAddress}
NEXT_PUBLIC_HARDHAT_RPC_URL=http://127.0.0.1:8545
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://rpc.sepolia.org
`;
  writeFileSync("frontend/.env.local", envOutput, "utf8");
  console.log("Wrote frontend/.env.local");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
