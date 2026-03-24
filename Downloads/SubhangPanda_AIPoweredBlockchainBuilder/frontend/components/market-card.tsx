"use client";

import { formatEther } from "viem";
import { ProbabilityBar } from "./probability-bar";
import { TradePanel } from "./trade-panel";

type Props = {
  address: `0x${string}`;
  question: string;
  endTimestamp: bigint;
  resolved: boolean;
  winningOutcome: number;
  yesReserve: bigint;
  noReserve: bigint;
  ethReserve: bigint;
  yesShares: bigint;
  noShares: bigint;
  walletConnected: boolean;
  onRefresh: () => void;
};

export function MarketCard(props: Props) {
  const now = Math.floor(Date.now() / 1000);
  const isEnded = Number(props.endTimestamp) <= now;
  const tradingLocked = props.resolved || isEnded;

  const totalShares = props.yesReserve + props.noReserve;
  const yesProbability =
    totalShares > BigInt(0)
      ? (Number(props.yesReserve) / Number(totalShares)) * 100
      : 50;

  const outcomeLabel =
    props.winningOutcome === 1
      ? "YES"
      : props.winningOutcome === 2
        ? "NO"
        : "Unresolved";

  return (
    <article className="rounded-3xl border border-white/10 bg-linear-to-b from-zinc-900 to-zinc-950 p-5 shadow-2xl shadow-cyan-950/20">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">{props.question}</h3>
          <p className="mt-1 text-xs text-zinc-400">
            {props.address.slice(0, 8)}...{props.address.slice(-6)}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            props.resolved
              ? "bg-emerald-500/20 text-emerald-300"
              : tradingLocked
                ? "bg-amber-500/20 text-amber-300"
                : "bg-cyan-500/20 text-cyan-300"
          }`}
        >
          {props.resolved ? `Resolved: ${outcomeLabel}` : tradingLocked ? "Ended" : "Active"}
        </span>
      </div>

      <ProbabilityBar yesProbability={yesProbability} />

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-zinc-400">ETH Pool</p>
          <p className="mt-1 font-semibold text-white">
            {Number(formatEther(props.ethReserve)).toFixed(4)} ETH
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-zinc-400">Ends</p>
          <p className="mt-1 font-semibold text-white">
            {new Date(Number(props.endTimestamp) * 1000).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-zinc-300">
        <div className="rounded-xl border border-white/10 bg-zinc-900/70 p-3">
          <p>Your YES</p>
          <p className="mt-1 text-sm font-semibold text-emerald-300">
            {Number(formatEther(props.yesShares)).toFixed(4)}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-zinc-900/70 p-3">
          <p>Your NO</p>
          <p className="mt-1 text-sm font-semibold text-rose-300">
            {Number(formatEther(props.noShares)).toFixed(4)}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <TradePanel
          marketAddress={props.address}
          disabled={tradingLocked || !props.walletConnected}
          onSubmitted={props.onRefresh}
        />
      </div>
    </article>
  );
}
