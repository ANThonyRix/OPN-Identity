"use client";

import Link from "next/link";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function Home() {
  const { isConnected } = useAccount();

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4">
      <div className="max-w-3xl text-center space-y-8">
        <h1 className="text-5xl sm:text-6xl font-bold leading-tight">
          Build Your <span className="gradient-text">On-Chain Identity</span>
        </h1>
        <p className="text-lg text-muted max-w-xl mx-auto">
          Sovereign identity verification on OPN Chain.
          Verify social accounts via OAuth, link wallets, prove ownership - earn a Trust Score
          that any dApp can verify. Your data stays private.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {isConnected ? (
            <Link href="/verify" className="btn-primary text-center">
              Start Verification
            </Link>
          ) : (
            <ConnectButton />
          )}
          <Link
            href="/search"
            className="px-6 py-3 rounded-xl border border-card-border text-foreground font-semibold hover:bg-card transition-colors text-center"
          >
            Search Identity
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8">
          <div className="card text-center">
            <div className="text-2xl font-bold text-accent">Soulbound</div>
            <p className="text-sm text-muted mt-1">Non-transferable token tied to your wallet</p>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-accent">Private</div>
            <p className="text-sm text-muted mt-1">Only hashes on-chain - your data stays sovereign</p>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-accent">Verified</div>
            <p className="text-sm text-muted mt-1">OAuth for socials, signatures for wallets</p>
          </div>
        </div>
      </div>
    </div>
  );
}
