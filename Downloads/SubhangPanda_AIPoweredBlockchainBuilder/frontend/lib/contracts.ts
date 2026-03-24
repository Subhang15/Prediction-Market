import { getAddress } from "viem";

export const FACTORY_ADDRESS =
  process.env.NEXT_PUBLIC_FACTORY_ADDRESS &&
  process.env.NEXT_PUBLIC_FACTORY_ADDRESS.length > 0
    ? getAddress(process.env.NEXT_PUBLIC_FACTORY_ADDRESS)
    : undefined;

export const factoryAbi = [
  {
    inputs: [],
    name: "marketsCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "allMarkets",
    outputs: [{ internalType: "address[]", name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const marketAbi = [
  {
    inputs: [],
    name: "question",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "endTimestamp",
    outputs: [{ internalType: "uint64", name: "", type: "uint64" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "marketResolved",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "winningOutcome",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getPoolState",
    outputs: [
      { internalType: "uint256", name: "yesPool", type: "uint256" },
      { internalType: "uint256", name: "noPool", type: "uint256" },
      { internalType: "uint256", name: "ethPool", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "yesShares",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "noShares",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "mint",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "betYes",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "betNo",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "amountYes", type: "uint256" }],
    name: "sellYes",
    outputs: [{ internalType: "uint256", name: "ethOut", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "amountNo", type: "uint256" }],
    name: "sellNo",
    outputs: [{ internalType: "uint256", name: "ethOut", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "resolveMarket",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "redeem",
    outputs: [{ internalType: "uint256", name: "ethOut", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;
