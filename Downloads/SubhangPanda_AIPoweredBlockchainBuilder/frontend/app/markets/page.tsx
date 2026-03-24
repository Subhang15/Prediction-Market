"use client";

import { useMemo, useState } from "react";
import { type Address, isAddress, zeroAddress } from "viem";
import { useAccount, useReadContract, useReadContracts } from "wagmi";
import Link from "next/link";
import { Header } from "@/components/header";
import { MarketCard } from "@/components/market-card";
import { FACTORY_ADDRESS, factoryAbi, marketAbi } from "@/lib/contracts";

type MarketData = {
  address: Address;
  question: string;
  endTimestamp: bigint;
  resolved: boolean;
  winningOutcome: number;
  yesReserve: bigint;
  noReserve: bigint;
  ethReserve: bigint;
  yesShares: bigint;
  noShares: bigint;
};

export default function MarketsPage() {
  const { address: userAddress, isConnected } = useAccount();
  const [view, setView] = useState<"current" | "history">("current");

  const { data: marketAddressData } = useReadContract({
    abi: factoryAbi,
    address: FACTORY_ADDRESS,
    functionName: "allMarkets",
    query: { enabled: Boolean(FACTORY_ADDRESS), refetchInterval: 10000 },
  });

  const marketAddresses = useMemo(
    () => (marketAddressData ?? []).filter((value): value is Address => isAddress(value)),
    [marketAddressData],
  );

  const lookupAddress = userAddress ?? zeroAddress;

  const marketMetaContracts = useMemo(() => {
    return marketAddresses.flatMap((marketAddress) => [
      { abi: marketAbi, address: marketAddress, functionName: "question" as const },
      { abi: marketAbi, address: marketAddress, functionName: "endTimestamp" as const },
      { abi: marketAbi, address: marketAddress, functionName: "marketResolved" as const },
      { abi: marketAbi, address: marketAddress, functionName: "winningOutcome" as const },
      { abi: marketAbi, address: marketAddress, functionName: "getPoolState" as const },
      {
        abi: marketAbi,
        address: marketAddress,
        functionName: "yesShares" as const,
        args: [lookupAddress],
      },
      {
        abi: marketAbi,
        address: marketAddress,
        functionName: "noShares" as const,
        args: [lookupAddress],
      },
    ]);
  }, [lookupAddress, marketAddresses]);

  const { data: marketMetaResults } = useReadContracts({
    contracts: marketMetaContracts,
    query: {
      enabled: marketMetaContracts.length > 0,
      refetchInterval: 10000,
    },
  });

  const markets = useMemo<MarketData[]>(() => {
    if (!marketMetaResults) return [];

    const rows: MarketData[] = [];
    for (let i = 0; i < marketAddresses.length; i += 1) {
      const base = i * 7;
      const question = (marketMetaResults[base]?.result as string) ?? "";
      const endTimestamp =
        (marketMetaResults[base + 1]?.result as bigint) ?? BigInt(0);
      const resolved = (marketMetaResults[base + 2]?.result as boolean) ?? false;
      const winningOutcome = Number(
        (marketMetaResults[base + 3]?.result as bigint) ?? BigInt(0),
      );
      const pool = (marketMetaResults[base + 4]?.result as [bigint, bigint, bigint]) ?? [
        BigInt(0),
        BigInt(0),
        BigInt(0),
      ];
      const yesShares =
        (marketMetaResults[base + 5]?.result as bigint) ?? BigInt(0);
      const noShares =
        (marketMetaResults[base + 6]?.result as bigint) ?? BigInt(0);

      rows.push({
        address: marketAddresses[i],
        question,
        endTimestamp,
        resolved,
        winningOutcome,
        yesReserve: pool[0],
        noReserve: pool[1],
        ethReserve: pool[2],
        yesShares,
        noShares,
      });
    }

    return rows;
  }, [marketAddresses, marketMetaResults]);

  const activeMarkets = useMemo(() => {
    const now = Math.floor(Date.now() / 1000);
    return markets.filter(
      (market) => !market.resolved && Number(market.endTimestamp) > now,
    );
  }, [markets]);

  const marketHistory = useMemo(() => {
    const now = Math.floor(Date.now() / 1000);
    return markets
      .filter((market) => market.resolved || Number(market.endTimestamp) <= now)
      .sort((a, b) => Number(b.endTimestamp - a.endTimestamp));
  }, [markets]);

  const totalPoolEth = useMemo(() => {
    const totalWei = markets.reduce((acc, m) => acc + m.ethReserve, BigInt(0));
    return Number(totalWei) / 1e18;
  }, [markets]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#0f172a_0%,#020617_60%)]">
      <Header />
      <main className="mx-auto w-full max-w-7xl px-6 py-8">
        <p className="mb-6">
          <Link
            href="/"
            className="text-sm font-medium text-cyan-300 transition hover:text-cyan-200"
          >
            ← Back to Prophet Zero
          </Link>
        </p>

        <section className="mb-8 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-cyan-950/30">
          <div className="max-w-3xl">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
              Prophet Zero · Markets
            </p>
            <h2 className="text-4xl font-semibold tracking-tight text-white">
              Predict real-world outcomes. Settle transparently on-chain.
            </h2>
            <p className="mt-3 text-zinc-300">
              Place ETH predictions on active markets, monitor implied probabilities,
              and verify winning outcomes from oracle-based resolution.
            </p>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-zinc-900/70 p-3">
              <p className="text-xs text-zinc-400">Total Markets</p>
              <p className="mt-1 text-xl font-semibold text-white">{markets.length}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-zinc-900/70 p-3">
              <p className="text-xs text-zinc-400">Current Markets</p>
              <p className="mt-1 text-xl font-semibold text-cyan-300">{activeMarkets.length}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-zinc-900/70 p-3">
              <p className="text-xs text-zinc-400">History Markets</p>
              <p className="mt-1 text-xl font-semibold text-amber-300">{marketHistory.length}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-zinc-900/70 p-3">
              <p className="text-xs text-zinc-400">Total ETH in Pools</p>
              <p className="mt-1 text-xl font-semibold text-emerald-300">
                {totalPoolEth.toFixed(3)}
              </p>
            </div>
          </div>
        </section>

        <div className="mb-6 inline-flex rounded-xl border border-white/10 bg-zinc-900/70 p-1">
          <button
            onClick={() => setView("current")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              view === "current"
                ? "bg-cyan-400 text-zinc-950"
                : "text-zinc-300 hover:bg-white/10"
            }`}
          >
            Current Markets
          </button>
          <button
            onClick={() => setView("history")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              view === "history"
                ? "bg-cyan-400 text-zinc-950"
                : "text-zinc-300 hover:bg-white/10"
            }`}
          >
            Market History
          </button>
        </div>

        {!FACTORY_ADDRESS ? (
          <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-5 text-amber-100">
            Set <code>NEXT_PUBLIC_FACTORY_ADDRESS</code> in{" "}
            <code>frontend/.env.local</code> to load markets.
          </div>
        ) : view === "current" && activeMarkets.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-zinc-200">
            No active markets found for this factory.
          </div>
        ) : view === "history" && marketHistory.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-zinc-200">
            No market history yet. Resolve a market first to see winners here.
          </div>
        ) : (
          <section className="space-y-4">
            {!isConnected && (
              <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-5 text-cyan-100">
                Connect MetaMask to enable trading and personal balances.
              </div>
            )}
            {view === "current" ? (
              <div className="grid gap-6 md:grid-cols-2">
                {activeMarkets.map((market) => (
                  <MarketCard
                    key={market.address}
                    {...market}
                    walletConnected={isConnected}
                    onRefresh={() => undefined}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {marketHistory.map((market) => {
                  const winner =
                    market.winningOutcome === 1
                      ? "YES"
                      : market.winningOutcome === 2
                        ? "NO"
                        : "Pending Resolution";
                  const userStatus =
                    market.winningOutcome === 1
                      ? market.yesShares > BigInt(0)
                        ? "You hold winner shares"
                        : "No winner shares"
                      : market.winningOutcome === 2
                        ? market.noShares > BigInt(0)
                          ? "You hold winner shares"
                          : "No winner shares"
                        : "Awaiting winner";

                  return (
                    <div
                      key={market.address}
                      className="rounded-2xl border border-white/10 bg-white/5 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">{market.question}</p>
                          <p className="mt-1 text-xs text-zinc-400">
                            {market.address.slice(0, 8)}...{market.address.slice(-6)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-zinc-400">Winner</p>
                          <p className="text-sm font-semibold text-emerald-300">{winner}</p>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center justify-between text-xs text-zinc-300">
                        <span>Ended: {new Date(Number(market.endTimestamp) * 1000).toLocaleString()}</span>
                        <span>{userStatus}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
