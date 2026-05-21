"use client";

import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export function Header() {
  return (
    <header className="border-b border-card-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="OPN" className="w-8 h-8 rounded-lg" />
          <span className="font-semibold text-foreground">OPN Identity</span>
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/search" className="text-sm text-muted hover:text-foreground transition-colors">
            Search
          </Link>
          <Link href="/verify" className="text-sm text-muted hover:text-foreground transition-colors">
            Verify
          </Link>
          <Link href="/dashboard" className="text-sm text-muted hover:text-foreground transition-colors">
            Dashboard
          </Link>
          <Link href="/faq" className="text-sm text-muted hover:text-foreground transition-colors">
            FAQ
          </Link>
          <ConnectButton accountStatus="avatar" chainStatus="icon" showBalance={false} />
        </nav>
      </div>
    </header>
  );
}
