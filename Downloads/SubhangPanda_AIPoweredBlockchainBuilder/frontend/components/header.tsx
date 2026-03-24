"use client";

import Link from "next/link";
import { Wallet } from "lucide-react";
import { useAccount, useConnect, useDisconnect } from "wagmi";

function shortAddress(address?: string) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function Header() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  const injectedConnector = connectors[0];

  return (
    <header className="border-b border-white/10 bg-zinc-950/70 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-5">
        <div>
          <Link href="/" className="block hover:opacity-90">
            <h1 className="text-xl font-semibold tracking-tight text-white">
              Prophet Zero
            </h1>
            <p className="text-sm text-zinc-400">
              Trade binary outcomes with on-chain liquidity
            </p>
          </Link>
        </div>

        {isConnected ? (
          <button
            onClick={() => disconnect()}
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
          >
            {shortAddress(address)}
          </button>
        ) : (
          <button
            onClick={() => connect({ connector: injectedConnector })}
            disabled={isPending || !injectedConnector}
            className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-cyan-400 to-emerald-400 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Wallet size={16} />
            Connect Wallet
          </button>
        )}
      </div>
    </header>
  );
}
