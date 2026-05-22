"use client";

import { useState, useEffect } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { signIn, signOut, useSession } from "next-auth/react";
import { useIdentity, useCreateIdentity, useAddCredential, useAddCredentials, useSetSocial } from "@/hooks/useIdentity";
import { VERIFICATION_SCORES } from "@/config/constants";
import { saveCredentialData } from "@/lib/storage";
import { validateWallets, isValidEmail } from "@/lib/validation";

type Step = "wallet" | "personal" | "social" | "wallets" | "complete";

const STEPS: Step[] = ["wallet", "personal", "social", "wallets", "complete"];

function getStoredStep(address: string | undefined): Step | null {
  if (!address || typeof window === "undefined") return null;
  const stored = sessionStorage.getItem(`opn-verify-step-${address}`);
  if (stored && STEPS.includes(stored as Step)) return stored as Step;
  return null;
}

function storeStep(address: string | undefined, step: Step) {
  if (!address || typeof window === "undefined") return;
  sessionStorage.setItem(`opn-verify-step-${address}`, step);
}

export default function VerifyPage() {
  const { address, isConnected } = useAccount();
  const { isVerified, score, refetch: refetchIdentity } = useIdentity(address);
  const { create, isPending: isCreating } = useCreateIdentity();
  const { addCredential, isPending: isAdding } = useAddCredential();
  const { addCredentials, isPending: isBatchAdding } = useAddCredentials();
  const { setSocial, isPending: isSettingSocial } = useSetSocial();
  const { signMessageAsync } = useSignMessage();
  const { data: session } = useSession();

  const [step, setStepRaw] = useState<Step>("wallet");
  const [walletSigned, setWalletSigned] = useState(false);

  const setStep = (s: Step) => {
    setStepRaw(s);
    storeStep(address, s);
  };

  useEffect(() => {
    const restored = getStoredStep(address);
    if (restored && !isVerified) {
      // Only restore step from session if not yet verified on-chain
      setStepRaw(restored);
      if (restored !== "wallet") setWalletSigned(true);
    }
  }, [address, isVerified]);
  const [personalData, setPersonalData] = useState({ name: "", email: "", bio: "" });
  const [extraWallets, setExtraWallets] = useState({ evm: "", solana: "", btc: "" });
  const [walletErrors, setWalletErrors] = useState<{ evm?: string; solana?: string; btc?: string }>({});
  const [personalErrors, setPersonalErrors] = useState<{ email?: string }>({});
  const [linkedSocials, setLinkedSocials] = useState<{ twitter?: string; discord?: string }>({});

  // Re-read linkedSocials from sessionStorage when address becomes available
  useEffect(() => {
    if (!address || typeof window === "undefined") return;
    try {
      const stored = sessionStorage.getItem(`opn-verify-socials-${address}`);
      if (stored) setLinkedSocials(JSON.parse(stored));
    } catch {}
  }, [address]);
  const [txStatus, setTxStatus] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const isLoading = isCreating || isAdding || isBatchAdding || isSettingSocial || isProcessing;

  useEffect(() => {
    if (session && step === "social") {
      const provider = (session as { provider?: string }).provider;
      const username = (session as { username?: string }).username;

      if (provider && username && !linkedSocials[provider as "twitter" | "discord"]) {
        const handle = provider === "twitter" ? username.toLowerCase() : username;
        handleSocialLink(provider, handle);
      }
    }
  }, [session, step]);

  const handleSocialLink = async (provider: string, handle: string) => {
    setIsProcessing(true);
    try {
      setTxStatus(`Adding ${provider} credential...`);
      await addCredential(provider, `${address}:${provider}:${handle}`);
      setTxStatus(`Linking ${provider} handle on-chain...`);
      await setSocial(provider, handle);
      if (address) {
        saveCredentialData(address, { [provider]: handle });
      }
      // Read current socials from sessionStorage to avoid stale closure
      let current: { twitter?: string; discord?: string } = {};
      if (address) {
        try {
          const stored = sessionStorage.getItem(`opn-verify-socials-${address}`);
          if (stored) current = JSON.parse(stored);
        } catch {}
      }
      const updated = { ...current, [provider]: handle };
      setLinkedSocials(updated);
      if (address) sessionStorage.setItem(`opn-verify-socials-${address}`, JSON.stringify(updated));
      signOut({ redirect: false });
      setTxStatus("");
    } catch (e: any) {
      const detail = e?.shortMessage || e?.message || "Unknown error";
      setTxStatus(`Error: ${detail}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSignWallet = async () => {
    setIsProcessing(true);
    try {
      setTxStatus("Signing message...");
      await signMessageAsync({ message: `OPN Identity Verification: ${address}` });

      if (!isVerified) {
        setTxStatus("Creating on-chain identity (confirm in wallet)...");
        try {
          await create(address || "");
        } catch (e: any) {
          const msg = e?.shortMessage || e?.message || "";
          if (!msg.toLowerCase().includes("already") && !msg.toLowerCase().includes("exists")) {
            throw e;
          }
        }
      }

      setTxStatus("Adding wallet credential (confirm in wallet)...");
      await addCredential("wallet", `${address}:wallet:verified`);

      setWalletSigned(true);
      storeStep(address, "personal");
      setTxStatus("");
    } catch (e: any) {
      const detail = e?.shortMessage || e?.message || "Unknown error";
      setTxStatus(`Error: ${detail}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePersonalSubmit = async () => {
    if (personalData.email.trim() && !isValidEmail(personalData.email.trim())) {
      setPersonalErrors({ email: "Invalid email format. Example: user@example.com" });
      return;
    }
    setPersonalErrors({});
    setIsProcessing(true);

    try {
      const fields = Object.entries(personalData).filter(([, v]) => v.trim());
      if (fields.length > 0) {
        setTxStatus(`Saving ${fields.length} credential(s) in one transaction...`);
        const items = fields.map(([key, value]) => ({
          type: key,
          data: `${address}:${key}:${value}`,
        }));
        if (items.length === 1) {
          await addCredential(items[0].type, items[0].data);
        } else {
          await addCredentials(items);
        }
      }
      if (personalData.email.trim()) {
        setTxStatus("Linking email on-chain (confirm in wallet)...");
        await setSocial("email", personalData.email.trim().toLowerCase());
      }
      if (address) {
        saveCredentialData(address, personalData);
      }
      setTxStatus("");
      setStep("social");
    } catch (e: any) {
      const detail = e?.shortMessage || e?.message || "Unknown error";
      setTxStatus(`Error: ${detail}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOAuthLink = (provider: "twitter" | "discord") => {
    storeStep(address, "social");
    signIn(provider, { callbackUrl: "/verify" });
  };

  const handleExtraWallets = async () => {
    const errors = validateWallets(extraWallets);
    setWalletErrors(errors);

    if (Object.keys(errors).length > 0) return;

    setIsProcessing(true);
    try {
      const items: { type: string; data: string }[] = [];
      if (extraWallets.evm.trim()) {
        items.push({ type: "evmWallet", data: `${address}:evm:${extraWallets.evm}` });
      }
      if (extraWallets.solana.trim()) {
        items.push({ type: "solanaWallet", data: `${address}:solana:${extraWallets.solana}` });
      }
      if (extraWallets.btc.trim()) {
        items.push({ type: "btcWallet", data: `${address}:btc:${extraWallets.btc}` });
      }

      if (items.length > 0) {
        setTxStatus(`Adding ${items.length} wallet(s) in one transaction...`);
        if (items.length === 1) {
          await addCredential(items[0].type, items[0].data);
        } else {
          await addCredentials(items);
        }
      }

      if (address) {
        saveCredentialData(address, {
          evmWallet: extraWallets.evm || undefined,
          solanaWallet: extraWallets.solana || undefined,
          btcWallet: extraWallets.btc || undefined,
        });
      }
      setTxStatus("");
      refetchIdentity();
      setStep("complete");
    } catch (e: any) {
      const detail = e?.shortMessage || e?.message || "Unknown error";
      setTxStatus(`Error: ${detail}`);
    } finally {
      setIsProcessing(false);
    }
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
          <p className="text-muted">This wallet already has an on-chain identity. You can add more credentials below or edit from the Dashboard.</p>
          <div className="flex flex-col gap-3">
            <button onClick={() => { setWalletSigned(true); setStep("personal"); }} className="btn-primary inline-block">
              Add More Credentials
            </button>
            <a href="/dashboard" className="px-4 py-3 rounded-lg border border-card-border text-muted hover:text-foreground transition-colors inline-block">
              Go to Dashboard
            </a>
          </div>
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

      {txStatus && (
        <div className="text-center py-2 px-4 rounded-lg bg-accent/10 border border-accent/30 text-accent text-sm animate-pulse">
          {txStatus}
        </div>
      )}

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
          <p className="text-muted text-sm">Add personal details. Only hashes are stored on-chain - your data stays private. All fields are saved in a single transaction.</p>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Name (optional)"
              value={personalData.name}
              onChange={(e) => setPersonalData({ ...personalData, name: e.target.value })}
              className="w-full px-4 py-3 rounded-lg bg-background border border-card-border focus:border-accent outline-none"
              disabled={isLoading}
            />
            <div>
              <input
                type="email"
                placeholder="Email (optional)"
                value={personalData.email}
                onChange={(e) => { setPersonalData({ ...personalData, email: e.target.value }); setPersonalErrors({}); }}
                className={`w-full px-4 py-3 rounded-lg bg-background border ${personalErrors.email ? "border-red-500" : "border-card-border"} focus:border-accent outline-none`}
                disabled={isLoading}
              />
              {personalErrors.email && <p className="text-red-400 text-xs mt-1">{personalErrors.email}</p>}
            </div>
            <textarea
              placeholder="Bio (optional)"
              value={personalData.bio}
              onChange={(e) => setPersonalData({ ...personalData, bio: e.target.value })}
              className="w-full px-4 py-3 rounded-lg bg-background border border-card-border focus:border-accent outline-none resize-none h-24"
              disabled={isLoading}
            />
          </div>
          <div className="flex gap-3">
            <button onClick={handlePersonalSubmit} disabled={isLoading} className="btn-primary flex-1 disabled:opacity-50">
              {isLoading ? "Saving..." : "Save & Continue"}
            </button>
            <button onClick={() => setStep("social")} disabled={isLoading} className="px-4 py-3 rounded-lg border border-card-border text-muted hover:text-foreground transition-colors">
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
            <button onClick={() => setStep("wallets")} disabled={isLoading} className="btn-primary flex-1">
              Next Step
            </button>
            <button onClick={() => setStep("wallets")} disabled={isLoading} className="px-4 py-3 rounded-lg border border-card-border text-muted hover:text-foreground transition-colors">
              Skip
            </button>
          </div>
        </div>
      )}

      {step === "wallets" && (
        <div className="card space-y-4">
          <h2 className="text-xl font-semibold">Step 4: Link Other Wallets</h2>
          <p className="text-muted text-sm">Add wallets from other chains to prove cross-chain presence. All wallets are saved in a single transaction.</p>
          <div className="space-y-3">
            <div>
              <input
                type="text"
                placeholder="EVM wallet address (0x...)"
                value={extraWallets.evm}
                onChange={(e) => { setExtraWallets({ ...extraWallets, evm: e.target.value }); setWalletErrors({ ...walletErrors, evm: undefined }); }}
                className={`w-full px-4 py-3 rounded-lg bg-background border ${walletErrors.evm ? "border-red-500" : "border-card-border"} focus:border-accent outline-none font-mono text-sm`}
                disabled={isLoading}
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
                disabled={isLoading}
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
                disabled={isLoading}
              />
              {walletErrors.btc && <p className="text-red-400 text-xs mt-1">{walletErrors.btc}</p>}
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleExtraWallets} disabled={isLoading} className="btn-primary flex-1 disabled:opacity-50">
              {isLoading ? "Saving..." : "Save & Finish"}
            </button>
            <button onClick={() => { refetchIdentity(); setStep("complete"); }} disabled={isLoading} className="px-4 py-3 rounded-lg border border-card-border text-muted hover:text-foreground transition-colors">
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
