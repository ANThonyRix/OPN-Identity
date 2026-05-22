"use client";

import { useParams } from "next/navigation";
import { useIdentity } from "@/hooks/useIdentity";

export default function PublicProfilePage() {
  const params = useParams();
  const address = params.address as `0x${string}`;
  const { isVerified, score, credentialKeys } = useIdentity(address);

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

  if (!isVerified) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4">
        <div className="card max-w-md w-full text-center space-y-4">
          <h2 className="text-2xl font-bold">Identity Not Found</h2>
          <p className="text-muted">This address has not been verified on OPN Chain.</p>
          <p className="text-xs text-muted font-mono break-all">{address}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">
      <div className="card text-center space-y-4">
        <div
          className="score-ring w-28 h-28 mx-auto flex items-center justify-center"
          style={{ "--score": score } as React.CSSProperties}
        >
          <div className="w-full h-full rounded-full bg-card flex items-center justify-center">
            <span className="text-3xl font-bold">{score}</span>
          </div>
        </div>
        <h1 className="text-2xl font-bold">Verified Identity</h1>
        <p className="text-xs text-muted font-mono break-all">{address}</p>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-sm">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
          Trust Score: {score}/100
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Verified Credentials</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {(credentialKeys as string[]).map((key) => (
            <div key={key} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background border border-card-border">
              <svg className="w-4 h-4 text-green-400 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
              <span className="text-sm">{credentialLabels[key] || key}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card text-center">
        <p className="text-sm text-muted">
          This identity is stored as a Soulbound Token on OPN Chain (Testnet).
          It cannot be transferred or forged.
        </p>
      </div>
    </div>
  );
}
