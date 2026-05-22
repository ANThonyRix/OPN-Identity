"use client";

import { useState } from "react";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="border-b border-card-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="OPN" className="w-8 h-8 rounded-lg" />
          <span className="font-semibold text-foreground">OPN Identity</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
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

        {/* Mobile: wallet + hamburger */}
        <div className="flex md:hidden items-center gap-3">
          <ConnectButton accountStatus="avatar" chainStatus="icon" showBalance={false} />
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 text-muted hover:text-foreground transition-colors"
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <nav className="md:hidden border-t border-card-border bg-card/95 backdrop-blur-md px-4 py-4 space-y-3">
          <Link href="/search" onClick={() => setMenuOpen(false)} className="block text-sm text-muted hover:text-foreground transition-colors py-2">
            Search
          </Link>
          <Link href="/verify" onClick={() => setMenuOpen(false)} className="block text-sm text-muted hover:text-foreground transition-colors py-2">
            Verify
          </Link>
          <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="block text-sm text-muted hover:text-foreground transition-colors py-2">
            Dashboard
          </Link>
          <Link href="/faq" onClick={() => setMenuOpen(false)} className="block text-sm text-muted hover:text-foreground transition-colors py-2">
            FAQ
          </Link>
        </nav>
      )}
    </header>
  );
}
