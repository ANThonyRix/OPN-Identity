"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { signIn, signOut, useSession } from "next-auth/react";
import { useIdentity, useUpdateCredential, useSetSocial } from "@/hooks/useIdentity";
import { getCredentialData, saveCredentialData, UserCredentialData } from "@/lib/storage";
import { isValidEmail, isValidEvmAddress, isValidSolanaAddress, isValidBtcAddress } from "@/lib/validation";
import Link from "next/link";

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const { isVerified, score, credentialKeys } = useIdentity(address);
  const { updateCredential, isPending } = useUpdateCredential();
  const { setSocial, isPending: isSocialPending } = useSetSocial();
  const { data: session } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<UserCredentialData>({});
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [savedData, setSavedData] = useState<UserCredentialData>(() =>
    address ? getCredentialData(address) : {}
  );

  const isLoading = isPending || isSocialPending || isSaving;

  // Handle OAuth callback for re-linking socials
  useEffect(() => {
    if (session && address) {
      const provider = (session as { provider?: string }).provider;
      const username = (session as { username?: string }).username;

      if (provider && username && (provider === "twitter" || provider === "discord")) {
        const handle = provider === "twitter" ? username.toLowerCase() : username;
        (async () => {
          setIsSaving(true);
          try {
            await updateCredential(provider, `${address}:${provider}:${handle}`);
            await setSocial(provider, handle);
            saveCredentialData(address, { [provider]: handle });
            setSavedData((prev) => ({ ...prev, [provider]: handle }));
            signOut({ redirect: false });
          } finally {
            setIsSaving(false);
          }
        })();
      }
    }
  }, [session, address]);

  const startEditing = () => {
    const current = address ? getCredentialData(address) : {};
    setEditData(current);
    setEditErrors({});
    setIsEditing(true);
  };

  const validateEditData = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (editData.email?.trim() && !isValidEmail(editData.email.trim())) {
      errors.email = "Invalid email format.";
    }
    if (editData.evmWallet?.trim() && !isValidEvmAddress(editData.evmWallet.trim())) {
      errors.evmWallet = "Invalid EVM address.";
    }
    if (editData.solanaWallet?.trim() && !isValidSolanaAddress(editData.solanaWallet.trim())) {
      errors.solanaWallet = "Invalid Solana address.";
    }
    if (editData.btcWallet?.trim() && !isValidBtcAddress(editData.btcWallet.trim())) {
      errors.btcWallet = "Invalid Bitcoin address.";
    }
    return errors;
  };

  const saveEdits = async () => {
    const errors = validateEditData();
    setEditErrors(errors);
    if (Object.keys(errors).length > 0) return;

    if (!address) return;

    setIsSaving(true);
    try {
      const keys = credentialKeys as string[];
      for (const key of keys) {
        if (key === "wallet" || key === "twitter" || key === "discord") continue;
        const newValue = editData[key as keyof UserCredentialData]?.trim();
        const oldValue = savedData[key as keyof UserCredentialData]?.trim();
        if (newValue && newValue !== oldValue) {
          await updateCredential(key, `${address}:${key}:${newValue}`);
          if (key === "email") {
            await setSocial("email", newValue.toLowerCase());
          }
        }
      }

      saveCredentialData(address, editData);
      setSavedData({ ...savedData, ...editData });
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4">
        <div className="card max-w-md w-full text-center space-y-4">
          <h2 className="text-2xl font-bold">Connect Wallet</h2>
          <p className="text-muted">Connect your wallet to view your identity dashboard.</p>
          <ConnectButton />
        </div>
      </div>
    );
  }

  if (!isVerified) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4">
        <div className="card max-w-md w-full text-center space-y-4">
          <h2 className="text-2xl font-bold">No Identity Found</h2>
          <p className="text-muted">You haven&apos;t created your on-chain identity yet.</p>
          <Link href="/verify" className="btn-primary inline-block">
            Start Verification
          </Link>
        </div>
      </div>
    );
  }

  const credentialLabels: Record<string, string> = {
    wallet: "Wallet Ownership",
    name: "Name",
    email: "Email",
    bio: "Bio",
    twitter: "Twitter/X",
    discord: "Discord",
    evmWallet: "EVM Wallet",
    solanaWallet: "Solana Wallet",
    btcWallet: "Bitcoin Wallet",
    onchainActivity: "On-chain Activity",
  };

  const credentialPlaceholders: Record<string, string> = {
    name: "John Doe",
    email: "john@example.com",
    bio: "Web3 developer",
    twitter: "@username",
    discord: "username",
    evmWallet: "0x1234...abcd",
    solanaWallet: "ABC123...xyz",
    btcWallet: "bc1q...",
  };

  const getStoredValue = (key: string): string | undefined => {
    const val = savedData[key as keyof typeof savedData];
    if (!val || val === "verified") return undefined;
    return val;
  };

  const formatValue = (key: string): string | null => {
    const value = getStoredValue(key);
    if (!value) return null;
    if (key === "evmWallet" || key === "solanaWallet" || key === "btcWallet") {
      return `${value.slice(0, 8)}...${value.slice(-6)}`;
    }
    if (key === "email") {
      const [user, domain] = value.split("@");
      if (domain) return `${user.slice(0, 2)}***@${domain}`;
      return value;
    }
    return value;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Identity Dashboard</h1>
          <p className="text-muted text-sm mt-1 font-mono">{address}</p>
        </div>
        <Link href={`/profile/${address}`} className="text-sm text-accent hover:text-accent-hover transition-colors">
          View Public Profile
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card text-center">
          <div
            className="score-ring w-24 h-24 mx-auto flex items-center justify-center"
            style={{ "--score": score } as React.CSSProperties}
          >
            <div className="w-full h-full rounded-full bg-card flex items-center justify-center">
              <span className="text-2xl font-bold">{score}</span>
            </div>
          </div>
          <p className="text-sm text-muted mt-3">Trust Score</p>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-accent">{(credentialKeys as string[]).length}</div>
          <p className="text-sm text-muted mt-1">Credentials</p>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-green-400">Verified</div>
          <p className="text-sm text-muted mt-1">Status</p>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Credentials</h2>
          {!isEditing ? (
            <button
              onClick={startEditing}
              className="text-xs text-accent hover:text-accent-hover transition-colors flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={saveEdits}
                disabled={isLoading}
                className="text-xs text-green-400 hover:text-green-300 transition-colors disabled:opacity-50"
              >
                {isLoading ? "Signing..." : "Save (on-chain)"}
              </button>
              <button
                onClick={() => { setIsEditing(false); setEditErrors({}); }}
                className="text-xs text-muted hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
        {isEditing && (
          <p className="text-xs text-muted mb-3 -mt-2">Each changed field requires a separate on-chain transaction. You will need to confirm as many transactions as fields you edit.</p>
        )}
        <div className="space-y-3">
          {(credentialKeys as string[]).length === 0 ? (
            <p className="text-muted text-sm">No credentials added yet.</p>
          ) : (
            (credentialKeys as string[]).map((key) => (
              <div key={key} className="flex items-center justify-between py-3 border-b border-card-border last:border-0">
                <div className="flex flex-col flex-1 mr-4">
                  <span className="text-sm font-medium">{credentialLabels[key] || key}</span>
                  {isEditing && key !== "wallet" && key !== "twitter" && key !== "discord" ? (
                    <div>
                      <input
                        type="text"
                        value={editData[key as keyof UserCredentialData] || ""}
                        onChange={(e) => { setEditData({ ...editData, [key]: e.target.value }); setEditErrors({ ...editErrors, [key]: "" }); }}
                        placeholder={credentialPlaceholders[key] || "Enter value"}
                        className={`mt-1 w-full text-xs px-2 py-1.5 rounded bg-background border ${editErrors[key] ? "border-red-500" : "border-card-border"} focus:border-accent outline-none font-mono`}
                      />
                      {editErrors[key] && <p className="text-red-400 text-xs mt-0.5">{editErrors[key]}</p>}
                    </div>
                  ) : isEditing && (key === "twitter" || key === "discord") ? (
                    <button
                      onClick={() => signIn(key, { redirect: false, callbackUrl: "/dashboard" })}
                      className="mt-1 text-xs text-accent hover:text-accent-hover transition-colors text-left"
                    >
                      Re-link via {key === "twitter" ? "Twitter/X" : "Discord"} OAuth
                    </button>
                  ) : (
                    formatValue(key) && (
                      <span className="text-xs text-muted mt-0.5 font-mono">{formatValue(key)}</span>
                    )
                  )}
                </div>
                <span className="text-xs text-green-400 flex items-center gap-1 shrink-0">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                  Verified
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold mb-2">Add More Credentials</h2>
        <p className="text-sm text-muted mb-4">Increase your Trust Score by adding more verifications.</p>
        <Link href="/verify" className="btn-primary inline-block text-sm">
          Add Credentials
        </Link>
      </div>
    </div>
  );
}
