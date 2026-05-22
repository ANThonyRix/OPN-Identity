export const IDENTITY_SBT_ADDRESS = process.env.NEXT_PUBLIC_SBT_CONTRACT || "0x5e61fec0E2193e2e57D822c940ffC2Ce79b8F2f3";

export const VERIFICATION_SCORES: Record<string, number> = {
  wallet: 10,
  name: 10,
  email: 10,
  bio: 10,
  twitter: 15,
  discord: 15,
  evmWallet: 10,
  solanaWallet: 10,
  btcWallet: 10,
};

export const MAX_SCORE = 100;
