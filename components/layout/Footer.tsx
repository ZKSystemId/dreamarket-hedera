import { Sparkles } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-background/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo & Tagline */}
          <div className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-purple-400" />
            <div className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">DreamMarket</span> - Where Digital Souls Come Alive
            </div>
          </div>

          {/* Hackathon Badge */}
          <div className="text-sm text-muted-foreground text-center">
            Built for{" "}
            <Link
              href="https://hellofuturehackathon.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:text-purple-300 transition-colors font-semibold"
            >
              Hedera Hello Future: Ascension Hackathon 2025
            </Link>
          </div>

          {/* Links */}
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <Link href="https://hedera.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
              Powered by Hedera
            </Link>
            <span>•</span>
            <Link href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
              GitHub
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
