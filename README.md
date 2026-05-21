# OPN Identity Verification

Decentralized identity verification on OPN Chain. Build your Trust Score with progressive verification.

## Features

- **Wallet Verification** — prove ownership via message signing
- **Personal Data** — name, email, bio (hashed on-chain)
- **Social Links** — Twitter/X, Discord via OAuth
- **Multi-chain Wallets** — link EVM, Solana, Bitcoin addresses
- **Trust Score** — 0-100 progressive score
- **Soulbound Token** — non-transferable on-chain identity
- **Public Profiles** — verifiable by any dApp

## Tech Stack

- Next.js 16 + TypeScript + Tailwind CSS
- RainbowKit + wagmi + viem (wallet connection)
- Solidity 0.8.30 (SBT smart contract)
- NextAuth (social OAuth)
- OPN Chain Testnet (Chain ID: 984)

## Quick Start

```bash
# Install dependencies
npm install

# Copy env and fill in values
cp .env.example .env.local

# Run dev server
npm run dev
```

Open http://localhost:3000

## Deploy Contract (via Remix)

1. Open https://remix.ethereum.org
2. Create file `OPNIdentitySBT.sol` and paste code from `contracts/OPNIdentitySBT.sol`
3. Compile (Solidity 0.8.30)
4. Switch MetaMask to OPN Testnet (Chain ID: 984)
5. Get test OPN: https://faucet.iopn.tech
6. Deploy & Run → Environment: "Injected Provider - MetaMask"
7. Click Deploy
8. Copy the contract address to `NEXT_PUBLIC_SBT_CONTRACT` in `.env.local`

## Deploy to Vercel

1. Push to GitHub
2. Import project on vercel.com
3. Add environment variables:
   - `NEXT_PUBLIC_WC_PROJECT_ID` — from cloud.walletconnect.com
   - `NEXT_PUBLIC_SBT_CONTRACT` — deployed contract address
   - `NEXTAUTH_URL` — your Vercel domain
   - `NEXTAUTH_SECRET` — random secret (`openssl rand -base64 32`)
   - `TWITTER_CLIENT_ID` / `TWITTER_CLIENT_SECRET` — from developer.twitter.com
   - `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET` — from discord.com/developers
4. Deploy

## Contract API (for dApp developers)

```solidity
// Check if address is verified
function isVerified(address account) → bool

// Get Trust Score (0-100)
function getScore(address account) → uint8

// Get all credential types
function getCredentialKeys(address account) → string[]
```

## Network Info

| Parameter | Value |
|-----------|-------|
| Chain ID | 984 |
| RPC | https://testnet-rpc.iopn.tech |
| Explorer | https://testnet.iopn.tech |
| Faucet | https://faucet.iopn.tech |
| Symbol | OPN |
