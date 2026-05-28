export const IDENTITY_SBT_ADDRESS = process.env.NEXT_PUBLIC_SBT_CONTRACT || "0x77F38e4e8D4C45a1C1AD0780b273b35AFE084666";

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
