export const IDENTITY_SBT_ADDRESS = process.env.NEXT_PUBLIC_SBT_CONTRACT || "0x0000000000000000000000000000000000000000";

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
  onchainActivity: 20,
};

export const MAX_SCORE = Object.values(VERIFICATION_SCORES).reduce((a, b) => a + b, 0);
