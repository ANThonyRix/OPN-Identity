import { defineChain } from "viem";

export const opnTestnet = defineChain({
  id: 984,
  name: "OPN Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "OPN",
    symbol: "OPN",
  },
  rpcUrls: {
    default: { http: ["https://testnet-rpc.iopn.tech"] },
  },
  blockExplorers: {
    default: { name: "OPN Explorer", url: "https://testnet.iopn.tech" },
  },
  testnet: true,
});
