"use client";

const STORAGE_KEY = "opn-identity-data";

export interface UserCredentialData {
  name?: string;
  email?: string;
  bio?: string;
  twitter?: string;
  discord?: string;
  evmWallet?: string;
  solanaWallet?: string;
  btcWallet?: string;
}

export function saveCredentialData(address: string, data: Partial<UserCredentialData>) {
  if (typeof window === "undefined") return;
  const existing = getCredentialData(address);
  const updated = { ...existing, ...data };
  localStorage.setItem(`${STORAGE_KEY}-${address.toLowerCase()}`, JSON.stringify(updated));
}

export function getCredentialData(address: string): UserCredentialData {
  if (typeof window === "undefined") return {};
  const raw = localStorage.getItem(`${STORAGE_KEY}-${address.toLowerCase()}`);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
