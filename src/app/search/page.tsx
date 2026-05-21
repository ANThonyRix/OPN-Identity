"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { isValidEvmAddress, isValidEmail } from "@/lib/validation";
import { useAddressByHandle } from "@/hooks/useIdentity";

type SearchType = "address" | "twitter" | "discord" | "email";

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState<SearchType>("address");
  const [error, setError] = useState<string | undefined>(undefined);
  const [socialQuery, setSocialQuery] = useState<{ platform: string; handle: string } | null>(null);

  const resolvedAddress = useAddressByHandle(
    socialQuery?.platform,
    socialQuery?.handle
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();

    if (!trimmed) {
      setError("Enter a value to search.");
      return;
    }

    setError(undefined);
    setSocialQuery(null);

    if (searchType === "address") {
      if (!isValidEvmAddress(trimmed)) {
        setError("Invalid EVM address. Must start with 0x followed by 40 hex characters.");
        return;
      }
      router.push(`/profile/${trimmed}`);
    } else if (searchType === "email") {
      if (!isValidEmail(trimmed)) {
        setError("Invalid email format. Example: user@example.com");
        return;
      }
      setSocialQuery({ platform: "email", handle: trimmed.toLowerCase() });
    } else {
      const raw = trimmed.startsWith("@") ? trimmed.slice(1) : trimmed;
      const handle = searchType === "twitter" ? raw.toLowerCase() : raw;
      setSocialQuery({ platform: searchType, handle });
    }
  };

  const handleGoToProfile = () => {
    if (resolvedAddress && resolvedAddress !== "0x0000000000000000000000000000000000000000") {
      router.push(`/profile/${resolvedAddress}`);
    }
  };

  const platformLabel = (platform: string) => {
    if (platform === "twitter") return "Twitter/X";
    if (platform === "discord") return "Discord";
    return "email";
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4">
      <div className="max-w-lg w-full space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Search Identity</h1>
          <p className="text-muted">Look up any verified identity by wallet address, social account, or email.</p>
        </div>

        <div className="flex gap-2 justify-center flex-wrap">
          {(["address", "twitter", "discord", "email"] as SearchType[]).map((type) => (
            <button
              key={type}
              onClick={() => { setSearchType(type); setError(undefined); setSocialQuery(null); setQuery(""); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                searchType === type
                  ? "bg-accent text-white"
                  : "bg-card border border-card-border text-muted hover:text-foreground"
              }`}
            >
              {type === "address" ? "Wallet" : type === "twitter" ? "Twitter/X" : type === "discord" ? "Discord" : "Email"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder={
                searchType === "address"
                  ? "0x... wallet address"
                  : searchType === "twitter"
                  ? "@username"
                  : searchType === "discord"
                  ? "discord username"
                  : "user@example.com"
              }
              value={query}
              onChange={(e) => { setQuery(e.target.value); setError(undefined); setSocialQuery(null); }}
              className={`w-full px-4 py-3 rounded-lg bg-background border ${error ? "border-red-500" : "border-card-border"} focus:border-accent outline-none ${searchType === "address" ? "font-mono" : ""} text-sm`}
            />
            {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
          </div>
          <button type="submit" className="btn-primary w-full">
            Search
          </button>
        </form>

        {socialQuery && (
          <div className="card text-center space-y-3">
            {resolvedAddress && resolvedAddress !== "0x0000000000000000000000000000000000000000" ? (
              <>
                <p className="text-sm text-green-400">Identity found!</p>
                <p className="text-xs text-muted font-mono break-all">{resolvedAddress}</p>
                <button onClick={handleGoToProfile} className="btn-primary">
                  View Profile
                </button>
              </>
            ) : (
              <p className="text-sm text-muted">
                No identity found for this {platformLabel(socialQuery.platform)} handle.
              </p>
            )}
          </div>
        )}

        <div className="card text-center">
          <p className="text-sm text-muted">
            Search by wallet address for direct lookup, or by Twitter/Discord/Email
            to find linked on-chain identities.
          </p>
        </div>
      </div>
    </div>
  );
}
