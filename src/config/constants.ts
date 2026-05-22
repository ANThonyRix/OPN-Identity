export const IDENTITY_SBT_ADDRESS = process.env.NEXT_PUBLIC_SBT_CONTRACT || "0xdB8252B88f2D8914fE5Ff4e37e07365663EFc913";

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
