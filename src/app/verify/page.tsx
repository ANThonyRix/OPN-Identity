"use client";

import { useState, useEffect } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { signIn, signOut, useSession } from "next-auth/react";
import { useIdentity, useCreateIdentity, useAddCredential, useSetSocial } from "@/hooks/useIdentity";
import { VERIFICATION_SCORES } from "@/config/constants";
import { saveCredentialData } from "@/lib/storage";
import { validateWallets, isValidEmail } from "@/lib/validation";

type Step = "wallet" | "personal" | "social" | "wallets" | "complete";

export default function VerifyPage() {
  const { address, isConnected } = useAccount();
  const { isVerified, score, refetch: refetchIdentity } = useIdentity(address);
  const { create, isPending: isCreating, isConfirming: isCreatingConfirm } = useCreateIdentity();
  const { addCredential, isPending: isAdding, isConfirming: isAddingConfirm } = useAddCredential();
  const { setSocial, isPending: isSettingSocial, isConfirming: isSocialConfirm } = useSetSocial();
  const { signMessageAsync } = useSignMessage();
  const { data: session } = useSession();

  const [step, setStep] = useState<Step>("wallet");
  const [walletSigned, setWalletSigned] = useState(false);
  const [personalData, setPersonalData] = useState({ name: "", email: "", bio: "" });
  const [extraWallets, setExtraWallets] = useState({ evm: "", solana: "", btc: "" });
  const [walletErrors, setWalletErrors] = useState<{ evm?: string; solana?: string; btc?: string }>({});
  const [personalErrors, setPersonalErrors] = useState<{ email?: string }>({});
  const [linkedSocials, setLinkedSocials] = useState<{ twitter?: string; discord?: string }>({});

  const isLoading = isCreating || isCreatingConfirm || isAdding || isAddingConfirm || isSettingSocial || isSocialConfirm;

  useEffect(() => {
    if (session && step === "social") {
      const provider = (session as { provider?: string }).provider;
      const username = (session as { username?: string }).username;

      if (provider && username && !linkedSocials[provider as "twitter" | "discord"]) {
        const handle = provider === "twitter" ? username.toLowerCase() : username;
        addCredential(provider, `${address}:${provider}:${handle}`);
        setSocial(provider, handle);
        if (address) {
          saveCredentialData(address, { [provider]: handle });
        }
        setLinkedSocials((prev) => ({ ...prev, [provider]: handle }));
        signOut({ redirect: false });
      }
    }
  }, [session, step]);

  const handleSignWallet = async () => {
    try {
      await signMessageAsync({ message: `OPN Identity Verification: ${address}` });
      setWalletSigned(true);
      if (!isVerified) {
        create(address || "");
      }
      addCredential("wallet", `${address}:wallet:verified`);
    } catch {}
  };

  const handlePersonalSubmit = () => {
    if (personalData.email.trim() && !isValidEmail(personalData.email.trim())) {
      setPersonalErrors({ email: "Invalid email format. Example: user@example.com" });
      return;
    }
    setPersonalErrors({});

    const fields = Object.entries(personalData).filter(([, v]) => v.trim());
    fields.forEach(([key, value]) => {
      addCredential(key, `${address}:${key}:${value}`);
    });
    if (personalData.email.trim()) {
      setSocial("email", personalData.email.trim().toLowerCase());
    }
    if (address) {
      saveCredentialData(address, personalData);
    }
    setStep("social");
  };

  const handleOAuthLink = (provider: "twitter" | "discord") => {
    signIn(provider, { redirect: false, callbackUrl: "/verify" });
  };

  const handleExtraWallets = () => {
    const errors = validateWallets(extraWallets);
    setWalletErrors(errors);

    if (Object.keys(errors).length > 0) return;

    if (extraWallets.evm.trim()) {
      addCredential("evmWallet", `${address}:evm:${extraWallets.evm}`);
    }
    if (extraWallets.solana.trim()) {
      addCredential("solanaWallet", `${address}:solana:${extraWallets.solana}`);
    }
    if (extraWallets.btc.trim()) {
      addCredential("btcWallet", `${address}:btc:${extraWallets.btc}`);
    }
    if (address) {
      saveCredentialData(address, {
        evmWallet: extraWallets.evm || undefined,
        solanaWallet: extraWallets.solana || undefined,
        btcWallet: extraWallets.btc || undefined,
      });
    }
    refetchIdentity();
    setStep("complete");
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4">
        <div className="card max-w-md w-full text-center space-y-4">
          <h2 className="text-2xl font-bold">Connect Wallet</h2>
          <p className="text-muted">Connect your wallet to start the verification process.</p>
          <ConnectButton />
        </div>
      </div>
    );
  }

  if (isVerified && !walletSigned) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4">
        <div className="card max-w-md w-full text-center space-y-4">
          <h2 className="text-2xl font-bold">Already Verified</h2>
          <p className="text-muted">This wallet already has an on-chain identity. You can edit your credentials from the Dashboard.</p>
          <a href="/dashboard" className="btn-primary inline-block">Go to Dashboard</a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Identity Verification</h1>
        <p className="text-muted">Complete steps to build your Trust Score. Each step is optional.</p>
        <div className="flex justify-center gap-2 pt-4">
          {(["wallet", "personal", "social", "wallets", "complete"] as Step[]).map((s, i) => (
            <div
              key={s}
              className={`h-2 w-12 rounded-full transition-colors ${
                (["wallet", "personal", "social", "wallets", "complete"] as Step[]).indexOf(step) >= i
                  ? "bg-accent"
                  : "bg-card-border"
              }`}
            />
          ))}
        </div>
      </div>

      {step === "wallet" && (
        <div className="card space-y-4">
          <h2 className="text-xl font-semibold">Step 1: Prove Wallet Ownership</h2>
          <p className="text-muted text-sm">Sign a message to prove you own this wallet. This creates your on-chain identity. You will need to confirm 2-3 transactions in your wallet.</p>
          {walletSigned ? (
            <div className="flex items-center gap-2 text-green-400">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
              <span>Wallet verified! +{VERIFICATION_SCORES.wallet} points</span>
            </div>
          ) : (
            <button onClick={handleSignWallet} disabled={isLoading} className="btn-primary disabled:opacity-50">
              {isLoading ? "Processing..." : "Sign Message"}
            </button>
          )}
          {walletSigned && (
            <button onClick={() => setStep("personal")} className="btn-primary w-full">
              Next Step
            </button>
          )}
        </div>
      )}

      {step === "personal" && (
        <div className="card space-y-4">
          <h2 className="text-xl font-semibold">Step 2: Personal Information</h2>
          <p className="text-muted text-sm">Add personal details. Only hashes are stored on-chain - your data stays private. Each field requires a separate transaction.</p>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Name (optional)"
              value={personalData.name}
              onChange={(e) => setPersonalData({ ...personalData, name: e.target.value })}
              className="w-full px-4 py-3 rounded-lg bg-background border border-card-border focus:border-accent outline-none"
            />
            <div>
              <input
                type="email"
                placeholder="Email (optional)"
                value={personalData.email}
                onChange={(e) => { setPersonalData({ ...personalData, email: e.target.value }); setPersonalErrors({}); }}
                className={`w-full px-4 py-3 rounded-lg bg-background border ${personalErrors.email ? "border-red-500" : "border-card-border"} focus:border-accent outline-none`}
              />
              {personalErrors.email && <p className="text-red-400 text-xs mt-1">{personalErrors.email}</p>}
            </div>
            <textarea
              placeholder="Bio (optional)"
              value={personalData.bio}
              onChange={(e) => setPersonalData({ ...personalData, bio: e.target.value })}
              className="w-full px-4 py-3 rounded-lg bg-background border border-card-border focus:border-accent outline-none resize-none h-24"
            />
          </div>
          <div className="flex gap-3">
            <button onClick={handlePersonalSubmit} disabled={isLoading} className="btn-primary flex-1 disabled:opacity-50">
              {isLoading ? "Saving..." : "Save & Continue"}
            </button>
            <button onClick={() => setStep("social")} className="px-4 py-3 rounded-lg border border-card-border text-muted hover:text-foreground transition-colors">
              Skip
            </button>
          </div>
        </div>
      )}

      {step === "social" && (
        <div className="card space-y-4">
          <h2 className="text-xl font-semibold">Step 3: Link Social Accounts</h2>
          <p className="text-muted text-sm">Sign in with your social accounts to verify ownership. Each account requires 2 transactions to confirm.</p>
          <div className="space-y-3">
            {linkedSocials.twitter ? (
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-green-500/30 bg-green-500/5">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                <span className="text-sm text-green-400">Twitter/X verified: @{linkedSocials.twitter}</span>
                <svg className="w-4 h-4 text-green-400 ml-auto" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
              </div>
            ) : (
              <button
                onClick={() => handleOAuthLink("twitter")}
                disabled={isLoading}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-card-border hover:border-accent transition-colors disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                <span>Sign in with Twitter/X (+{VERIFICATION_SCORES.twitter} pts)</span>
              </button>
            )}
            {linkedSocials.discord ? (
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-green-500/30 bg-green-500/5">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z"/></svg>
                <span className="text-sm text-green-400">Discord verified: {linkedSocials.discord}</span>
                <svg className="w-4 h-4 text-green-400 ml-auto" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
              </div>
            ) : (
              <button
                onClick={() => handleOAuthLink("discord")}
                disabled={isLoading}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-card-border hover:border-accent transition-colors disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z"/></svg>
                <span>Sign in with Discord (+{VERIFICATION_SCORES.discord} pts)</span>
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep("wallets")} className="btn-primary flex-1">
              Next Step
            </button>
            <button onClick={() => setStep("wallets")} className="px-4 py-3 rounded-lg border border-card-border text-muted hover:text-foreground transition-colors">
              Skip
            </button>
          </div>
        </div>
      )}

      {step === "wallets" && (
        <div className="card space-y-4">
          <h2 className="text-xl font-semibold">Step 4: Link Other Wallets</h2>
          <p className="text-muted text-sm">Add wallets from other chains to prove cross-chain presence. Each wallet requires a separate transaction.</p>
          <div className="space-y-3">
            <div>
              <input
                type="text"
                placeholder="EVM wallet address (0x...)"
                value={extraWallets.evm}
                onChange={(e) => { setExtraWallets({ ...extraWallets, evm: e.target.value }); setWalletErrors({ ...walletErrors, evm: undefined }); }}
                className={`w-full px-4 py-3 rounded-lg bg-background border ${walletErrors.evm ? "border-red-500" : "border-card-border"} focus:border-accent outline-none font-mono text-sm`}
              />
              {walletErrors.evm && <p className="text-red-400 text-xs mt-1">{walletErrors.evm}</p>}
            </div>
            <div>
              <input
                type="text"
                placeholder="Solana wallet address"
                value={extraWallets.solana}
                onChange={(e) => { setExtraWallets({ ...extraWallets, solana: e.target.value }); setWalletErrors({ ...walletErrors, solana: undefined }); }}
                className={`w-full px-4 py-3 rounded-lg bg-background border ${walletErrors.solana ? "border-red-500" : "border-card-border"} focus:border-accent outline-none font-mono text-sm`}
              />
              {walletErrors.solana && <p className="text-red-400 text-xs mt-1">{walletErrors.solana}</p>}
            </div>
            <div>
              <input
                type="text"
                placeholder="Bitcoin wallet address"
                value={extraWallets.btc}
                onChange={(e) => { setExtraWallets({ ...extraWallets, btc: e.target.value }); setWalletErrors({ ...walletErrors, btc: undefined }); }}
                className={`w-full px-4 py-3 rounded-lg bg-background border ${walletErrors.btc ? "border-red-500" : "border-card-border"} focus:border-accent outline-none font-mono text-sm`}
              />
              {walletErrors.btc && <p className="text-red-400 text-xs mt-1">{walletErrors.btc}</p>}
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleExtraWallets} disabled={isLoading} className="btn-primary flex-1 disabled:opacity-50">
              {isLoading ? "Saving..." : "Save & Finish"}
            </button>
            <button onClick={() => { refetchIdentity(); setStep("complete"); }} className="px-4 py-3 rounded-lg border border-card-border text-muted hover:text-foreground transition-colors">
              Skip
            </button>
          </div>
        </div>
      )}

      {step === "complete" && (
        <div className="card text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
          </div>
          <h2 className="text-2xl font-bold">Verification Complete!</h2>
          <p className="text-muted">Your Trust Score: <span className="text-accent font-bold text-xl">{score}/100</span></p>
          <p className="text-sm text-muted">You can always add more credentials later from your Dashboard.</p>
          <a href="/dashboard" className="btn-primary inline-block">
            Go to Dashboard
          </a>
        </div>
      )}
    </div>
  );
}
