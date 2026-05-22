"use client";

import { useState } from "react";

const faqItems = [
  {
    question: "What is OPN Identity Verification?",
    answer:
      "A decentralized identity verification system on OPN Chain, built on the principle of sovereign identity. You create an on-chain identity by verifying ownership of your wallet, social accounts, and other credentials. The more you verify, the higher your Trust Score. Your data remains private - only cryptographic proofs are stored on-chain.",
  },
  {
    question: "Why do I need verification and what does Trust Score give me?",
    answer:
      "Trust Score is a numeric indicator from 0 to 100 that reflects how well your identity is verified. A high Score allows other users and dApps to trust you more. For example, a dApp may require a minimum Score to access certain features, airdrops, or governance votes.",
  },
  {
    question: "How does social account verification work?",
    answer:
      "We use OAuth - you sign in directly through Twitter/X or Discord. This proves you actually own the account. No manual input of usernames - the platform confirms your identity for us. After verification, only a hash of your handle is stored on-chain, not the handle itself.",
  },
  {
    question: "Can other people see my personal data?",
    answer:
      "No. OPN Identity follows the 'sovereign by default' principle. Only you control what gets shared. On-chain, others can only see:\n• Your wallet address\n• Your Trust Score\n• Which types of credentials you've verified (e.g. 'Twitter verified')\n\nThey cannot see your actual username, email, or any personal details.",
  },
  {
    question: "How do I connect my wallet to OPN Testnet?",
    answer:
      "1. Install MetaMask (or another EVM wallet)\n2. Click 'Connect Wallet' on the site\n3. The app will automatically prompt you to add OPN Testnet\n4. Confirm the network addition in your wallet\n\nNetwork parameters:\n• Chain ID: 984\n• RPC: https://testnet-rpc.iopn.tech\n• Symbol: OPN\n• Explorer: https://testnet.iopn.tech",
  },
  {
    question: "Where can I get test OPN tokens?",
    answer:
      "Go to faucet.iopn.tech, enter your wallet address, and receive free test OPN tokens. They are needed to pay gas fees when creating your identity and adding credentials.",
  },
  {
    question: "What data can I verify?",
    answer:
      "• Wallet ownership (message signature) - +10 points\n• Name - +10 points\n• Email - +10 points\n• Bio - +10 points\n• Twitter/X (OAuth) - +15 points\n• Discord (OAuth) - +15 points\n• Additional EVM wallet - +10 points\n• Solana wallet - +10 points\n• Bitcoin wallet - +10 points\n\nAll steps are optional. You decide what to verify.",
  },
  {
    question: "How does the search work?",
    answer:
      "You can look up any verified identity by wallet address, Twitter handle, Discord username, or email. The search works by hashing your query and checking it against on-chain records - this means you can only find someone if you already know their exact handle. Mass scanning of identities is impossible.",
  },
  {
    question: "What is an SBT and why can't it be transferred?",
    answer:
      "SBT (Soulbound Token) is a special type of NFT that is permanently bound to your wallet. It cannot be sold, transferred, or stolen. This guarantees that the verification belongs to you and cannot be forged.",
  },
  {
    question: "How do other dApps verify my identity?",
    answer:
      "Any dApp on OPN Chain can check your Trust Score with a single contract call. All read functions are free (no gas required).\n\nAvailable functions:\n\n• isVerified(address) → bool — check if address has an identity\n• getScore(address) → uint8 — get Trust Score (0-100)\n• getIdentity(address) → (score, issuedAt, updatedAt, dataHash) — full identity info\n• getCredentialKeys(address) → string[] — list of verified credential types\n• getCredential(address, type) → bytes32 — hash of a specific credential\n• getSocialHash(address, platformHash) → bytes32 — hash of linked social handle\n• getAddressByHandle(platformHash, handleHash) → address — reverse lookup by social handle\n\nSolidity integration example:\n\ninterface IOPNIdentity {\n    function isVerified(address) external view returns (bool);\n    function getScore(address) external view returns (uint8);\n}\n\ncontract MyDApp {\n    IOPNIdentity identity = IOPNIdentity(0x5e61fec0E2193e2e57D822c940ffC2Ce79b8F2f3);\n\n    function claimAirdrop() external {\n        require(identity.isVerified(msg.sender), \"Not verified\");\n        require(identity.getScore(msg.sender) >= 50, \"Score too low\");\n        // ... distribute tokens\n    }\n}\n\nFrontend integration (viem/wagmi):\n\nconst score = await publicClient.readContract({\n  address: '0x5e61fec0E2193e2e57D822c940ffC2Ce79b8F2f3',\n  abi: identityAbi,\n  functionName: 'getScore',\n  args: [userAddress],\n});\n\nUse cases:\n• Airdrops — distribute only to verified users (anti-sybil)\n• Governance — voting weight based on Trust Score\n• DeFi — loan limits tied to score\n• Marketplace — 'Verified' badge for sellers\n• Gated access — features unlocked at score >= N",
  },
  {
    question: "Is my personal data stored on the blockchain?",
    answer:
      "No. Only cryptographic hashes (keccak256) of your data are stored on-chain. The actual data (name, email, social handles) stays only in your browser's local storage. No one can recover the original data from a hash - it is mathematically impossible. Even social account lookups work through hashes, not plaintext.",
  },
  {
    question: "What happens when mainnet launches?",
    answer:
      "Currently the app runs on testnet. When mainnet launches, migration of verified identities is planned. Follow updates on official iOPN channels.",
  },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">FAQ</h1>
        <p className="text-muted">Everything you need to know about OPN Identity Verification</p>
      </div>

      <div className="space-y-3">
        {faqItems.map((item, index) => (
          <div key={index} className="card cursor-pointer" onClick={() => setOpenIndex(openIndex === index ? null : index)}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm sm:text-base pr-4">{item.question}</h3>
              <svg
                className={`w-5 h-5 shrink-0 text-muted transition-transform ${openIndex === index ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            {openIndex === index && (
              <p className="mt-3 text-sm text-muted whitespace-pre-line leading-relaxed">{item.answer}</p>
            )}
          </div>
        ))}
      </div>

      <div className="card text-center space-y-2">
        <h3 className="text-sm text-muted">Smart Contract Address</h3>
        <a
          href="https://testnet.iopn.tech/address/0x5e61fec0E2193e2e57D822c940ffC2Ce79b8F2f3"
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:text-accent-hover font-mono text-sm sm:text-base break-all"
        >
          0x5e61fec0E2193e2e57D822c940ffC2Ce79b8F2f3
        </a>
        <p className="text-xs text-muted">OPN Chain Testnet (Chain ID: 984)</p>
      </div>
    </div>
  );
}
