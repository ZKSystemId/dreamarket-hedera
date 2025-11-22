"use client";

import { Sparkles, Shield, Zap } from "lucide-react";
import { Card } from "./ui/card";

export function WalletNotice() {
  return (
    <Card className="glass-panel border-purple-500/30 bg-gradient-to-r from-purple-500/10 to-blue-500/10 p-6 mb-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-purple-300">
            Hedera-Powered NFT Minting
          </h3>
        </div>
        
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-start gap-2">
            <Zap className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-yellow-300 font-medium">Instant Minting</p>
              <p className="text-muted-foreground text-xs">
                No gas fees, smooth onboarding
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-green-300 font-medium">100% On-Chain</p>
              <p className="text-muted-foreground text-xs">
                Real NFTs on Hedera Testnet (HTS)
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-blue-300 font-medium">Verifiable</p>
              <p className="text-muted-foreground text-xs">
                View your NFT on HashScan explorer
              </p>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-white/10">
          <p className="text-xs text-muted-foreground">
            <span className="text-purple-400 font-medium">Demo Mode:</span> This hackathon demo uses custodial backend minting for optimal UX. 
            All NFTs are minted on real Hedera Testnet and fully verifiable. Production will integrate HashPack for full user custody.
          </p>
        </div>
      </div>
    </Card>
  );
}
