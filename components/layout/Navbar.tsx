"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, Wallet, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useWallet } from "@/contexts/WalletContext";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/market", label: "Market" },
  { href: "/chat", label: "Chat" },
  { href: "/create", label: "Create" },
  { href: "/profile", label: "Profile" },
  { href: "/about", label: "About" },
];

export function Navbar() {
  const pathname = usePathname();
  const { accountId, isConnected, connecting, connect, disconnect } = useWallet();

  const formatAccountId = (id: string) => {
    return `${id.substring(0, 7)}...${id.substring(id.length - 4)}`;
  };

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-white/10 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="relative">
              <Sparkles className="h-6 w-6 text-purple-400 group-hover:text-purple-300 transition-colors" />
              <div className="absolute inset-0 bg-purple-400/20 blur-xl group-hover:bg-purple-400/30 transition-all" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              DreamMarket
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "text-sm font-medium transition-colors",
                    pathname === item.href
                      ? "text-purple-400 bg-purple-400/10"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {item.label}
                </Button>
              </Link>
            ))}
          </div>

          {/* Connect Wallet */}
          <div className="hidden md:flex items-center gap-2">
            {isConnected && accountId ? (
              <>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-sm font-mono text-purple-300">
                    {formatAccountId(accountId)}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={disconnect}
                  className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button
                variant="cosmic"
                size="sm"
                onClick={connect}
                disabled={connecting}
              >
                <Wallet className="h-4 w-4 mr-2" />
                {connecting ? "Connecting..." : "Connect Wallet"}
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button variant="ghost" size="sm" className="md:hidden">
            Menu
          </Button>
        </div>
      </div>
    </nav>
  );
}
