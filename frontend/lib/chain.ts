import { defineChain } from "viem";

export const qdayAevum = defineChain({
  id: 44005,
  name: "QDay Aevum",
  nativeCurrency: { name: "tQDAY", symbol: "tQDAY", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc-test.qday.info"] } },
  blockExplorers: {
    default: { name: "QDay Explorer", url: "https://explorer-test.qday.info" }
  },
  testnet: true
});

export const TUSD8_ADDRESS = (
  process.env.NEXT_PUBLIC_TUSD8_ADDRESS ||
  "0x456569838f1d43009A91ebA4263147Afd7233483"
) as `0x${string}`;

export const AEVUMPAY_ADDRESS = (
  process.env.NEXT_PUBLIC_AEVUMPAY_ADDRESS || ""
) as `0x${string}`;
