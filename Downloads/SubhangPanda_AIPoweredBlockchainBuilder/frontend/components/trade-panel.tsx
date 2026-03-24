"use client";

import { useMemo, useState } from "react";
import { parseEther } from "viem";
import { useWriteContract } from "wagmi";
import { marketAbi } from "@/lib/contracts";

type Props = {
  marketAddress: `0x${string}`;
  disabled: boolean;
  onSubmitted: () => void;
};

export function TradePanel({ marketAddress, disabled, onSubmitted }: Props) {
  const [betYesAmount, setBetYesAmount] = useState("0.05");
  const [betNoAmount, setBetNoAmount] = useState("0.05");
  const [buyAmount, setBuyAmount] = useState("0.02");
  const [sellYesAmount, setSellYesAmount] = useState("0.01");
  const [sellNoAmount, setSellNoAmount] = useState("0.01");
  const { writeContractAsync, isPending } = useWriteContract();
  const [error, setError] = useState<string | null>(null);

  const canTrade = useMemo(() => !disabled && !isPending, [disabled, isPending]);

  async function handleBetYes() {
    try {
      setError(null);
      await writeContractAsync({
        address: marketAddress,
        abi: marketAbi,
        functionName: "betYes",
        value: parseEther(betYesAmount || "0"),
      });
      onSubmitted();
    } catch {
      setError("Unable to place YES prediction.");
    }
  }

  async function handleBetNo() {
    try {
      setError(null);
      await writeContractAsync({
        address: marketAddress,
        abi: marketAbi,
        functionName: "betNo",
        value: parseEther(betNoAmount || "0"),
      });
      onSubmitted();
    } catch {
      setError("Unable to place NO prediction.");
    }
  }

  async function handleBuy() {
    try {
      setError(null);
      await writeContractAsync({
        address: marketAddress,
        abi: marketAbi,
        functionName: "mint",
        value: parseEther(buyAmount || "0"),
      });
      onSubmitted();
    } catch {
      setError("Transaction failed or was rejected.");
    }
  }

  async function handleSellYes() {
    try {
      setError(null);
      await writeContractAsync({
        address: marketAddress,
        abi: marketAbi,
        functionName: "sellYes",
        args: [parseEther(sellYesAmount || "0")],
      });
      onSubmitted();
    } catch {
      setError("Unable to sell YES shares.");
    }
  }

  async function handleSellNo() {
    try {
      setError(null);
      await writeContractAsync({
        address: marketAddress,
        abi: marketAbi,
        functionName: "sellNo",
        args: [parseEther(sellNoAmount || "0")],
      });
      onSubmitted();
    } catch {
      setError("Unable to sell NO shares.");
    }
  }

  async function handleResolve() {
    try {
      setError(null);
      await writeContractAsync({
        address: marketAddress,
        abi: marketAbi,
        functionName: "resolveMarket",
      });
      onSubmitted();
    } catch {
      setError("Resolve failed. Market may not have ended yet.");
    }
  }

  async function handleRedeem() {
    try {
      setError(null);
      await writeContractAsync({
        address: marketAddress,
        abi: marketAbi,
        functionName: "redeem",
      });
      onSubmitted();
    } catch {
      setError("Redeem failed. You may not hold winning shares yet.");
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4">
      <h4 className="text-sm font-semibold text-white">Predict & Trade</h4>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs text-zinc-400">Place YES prediction (ETH)</label>
          <div className="flex gap-2">
            <input
              value={betYesAmount}
              onChange={(e) => setBetYesAmount(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none ring-emerald-400/50 focus:ring"
              placeholder="ETH amount"
            />
            <button
              onClick={handleBetYes}
              disabled={!canTrade}
              className="rounded-lg bg-emerald-400 px-3 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-50"
            >
              Predict
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-zinc-400">Place NO prediction (ETH)</label>
          <div className="flex gap-2">
            <input
              value={betNoAmount}
              onChange={(e) => setBetNoAmount(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none ring-rose-400/50 focus:ring"
              placeholder="ETH amount"
            />
            <button
              onClick={handleBetNo}
              disabled={!canTrade}
              className="rounded-lg bg-rose-400 px-3 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-50"
            >
              Predict
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs text-zinc-400">Mint both sides (advanced)</label>
        <div className="flex gap-2">
          <input
            value={buyAmount}
            onChange={(e) => setBuyAmount(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none ring-cyan-400/50 focus:ring"
            placeholder="ETH amount"
          />
          <button
            onClick={handleBuy}
            disabled={!canTrade}
            className="rounded-lg bg-cyan-400 px-3 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-50"
          >
            Buy
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs text-zinc-400">Sell YES shares</label>
          <div className="flex gap-2">
            <input
              value={sellYesAmount}
              onChange={(e) => setSellYesAmount(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none ring-emerald-400/50 focus:ring"
              placeholder="YES amount"
            />
            <button
              onClick={handleSellYes}
              disabled={!canTrade}
              className="rounded-lg bg-emerald-400 px-3 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-50"
            >
              Sell
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-zinc-400">Sell NO shares</label>
          <div className="flex gap-2">
            <input
              value={sellNoAmount}
              onChange={(e) => setSellNoAmount(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none ring-rose-400/50 focus:ring"
              placeholder="NO amount"
            />
            <button
              onClick={handleSellNo}
              disabled={!canTrade}
              className="rounded-lg bg-rose-400 px-3 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-50"
            >
              Sell
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button
          onClick={handleResolve}
          disabled={isPending}
          className="rounded-lg bg-amber-300 px-3 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-50"
        >
          Resolve Market
        </button>
        <button
          onClick={handleRedeem}
          disabled={isPending}
          className="rounded-lg bg-indigo-300 px-3 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-50"
        >
          Redeem Winnings
        </button>
      </div>

      {disabled && (
        <p className="text-xs text-amber-300">
          Trading is locked after end time or resolution.
        </p>
      )}
      {error && <p className="text-xs text-rose-300">{error}</p>}
    </div>
  );
}
