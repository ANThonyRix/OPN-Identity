export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidTwitter(handle: string): boolean {
  // @username or username, 1-15 chars, letters/digits/underscores
  return /^@?[A-Za-z0-9_]{1,15}$/.test(handle);
}

export function isValidDiscord(handle: string): boolean {
  // New format: username (2-32 chars, lowercase, digits, underscores, dots)
  // Legacy format: username#1234
  if (/^.{2,32}#\d{4}$/.test(handle)) return true;
  if (/^[a-z0-9_.]{2,32}$/.test(handle)) return true;
  return false;
}

export function isValidEvmAddress(address: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(address);
}

export function isValidSolanaAddress(address: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
}

export function isValidBtcAddress(address: string): boolean {
  // Legacy (P2PKH)
  if (/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address)) return true;
  // Bech32 (P2WPKH / P2WSH)
  if (/^bc1[a-z0-9]{25,62}$/.test(address)) return true;
  // Taproot (P2TR)
  if (/^bc1p[a-z0-9]{58}$/.test(address)) return true;
  return false;
}

export function validateWallets(wallets: { evm: string; solana: string; btc: string }) {
  const errors: { evm?: string; solana?: string; btc?: string } = {};

  if (wallets.evm.trim() && !isValidEvmAddress(wallets.evm.trim())) {
    errors.evm = "Invalid EVM address. Must start with 0x followed by 40 hex characters.";
  }
  if (wallets.solana.trim() && !isValidSolanaAddress(wallets.solana.trim())) {
    errors.solana = "Invalid Solana address. Must be 32-44 base58 characters.";
  }
  if (wallets.btc.trim() && !isValidBtcAddress(wallets.btc.trim())) {
    errors.btc = "Invalid Bitcoin address. Supported: P2PKH (1...), P2SH (3...), Bech32 (bc1...).";
  }

  return errors;
}
