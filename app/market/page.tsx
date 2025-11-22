"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { AgentFilters } from "@/components/agents/AgentFilters";
import { AgentGrid } from "@/components/agents/AgentGrid";
import { fetchSouls } from "@/lib/hederaClient";
import { FilterOptions, SoulAgent } from "@/types/agent";
import { AlertCircle } from "lucide-react";

export default function MarketPage() {
  const [allSouls, setAllSouls] = useState<SoulAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const [filters, setFilters] = useState<FilterOptions>({
    search: "",
    rarity: "all",
    skills: [],
    sortBy: "newest",
  });

  // Load souls from Supabase
  useEffect(() => {
    loadSouls();
  }, []);

  async function loadSouls() {
    setLoading(true);
    try {
      // Force fresh fetch
      const timestamp = Date.now();
      console.log(`🔄 Loading souls at ${timestamp}`);
      
      const souls = await fetchSouls();
      console.log('📦 All souls fetched:', souls.length);
      
      // ONLY show listed souls in market
      const listedSouls = souls.filter((soul: any) => {
        return soul.isListed === true && soul.price !== undefined && soul.price > 0;
      });
      
      // Handle duplicates: for each token_id, keep only the one with highest XP
      const soulMap = new Map<string, SoulAgent>();
      for (const soul of listedSouls) {
        if (!soul.tokenId) continue;
        
        const existing = soulMap.get(soul.tokenId);
        if (!existing || (soul.xp || 0) > (existing.xp || 0)) {
          soulMap.set(soul.tokenId, soul);
        }
      }
      
      const uniqueListedSouls = Array.from(soulMap.values());
      console.log('🏪 Listed souls for market:', uniqueListedSouls.length);
      console.log('📊 Market souls:', uniqueListedSouls.map(s => ({ 
        name: s.name, 
        level: s.level, 
        xp: s.xp, 
        price: s.price,
        tokenId: s.tokenId 
      })));
      
      setAllSouls(uniqueListedSouls);
      setRefreshKey(prev => prev + 1); // Force re-render
    } catch (error) {
      console.error('Failed to load souls:', error);
      setAllSouls([]);
    } finally {
      setLoading(false);
    }
  }

  // Filter and sort souls based on current filters
  const filteredSouls = useMemo(() => {
    let result = [...allSouls];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (soul) =>
          soul.name.toLowerCase().includes(searchLower) ||
          soul.tagline.toLowerCase().includes(searchLower)
      );
    }

    // Rarity filter
    if (filters.rarity !== "all") {
      result = result.filter((soul) => soul.rarity === filters.rarity);
    }

    // Skills filter
    if (filters.skills.length > 0) {
      result = result.filter((soul) =>
        filters.skills.some((skill) => soul.skills.includes(skill))
      );
    }

    // Sort
    switch (filters.sortBy) {
      case "newest":
        result.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case "reputation":
        result.sort((a, b) => b.reputation - a.reputation);
        break;
      case "price-low":
        result.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case "price-high":
        result.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case "traded":
        // Mock: just shuffle for now
        result.sort(() => Math.random() - 0.5);
        break;
    }

    console.log('🔍 Filtered result:', result.length, 'from', allSouls.length);
    return result;
  }, [allSouls, filters]);

  return (
    <MainLayout>
      <div className="min-h-screen py-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Soul <span className="text-gradient">Marketplace</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Buy, sell, and trade evolving AI souls on Hedera blockchain
            </p>
          </motion.div>

          {/* Important Notice */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-500 mb-1">Important Notice</h3>
                <p className="text-sm text-muted-foreground">
                  Please create at least <span className="font-semibold text-foreground">1 Soul NFT</span> before purchasing from the marketplace, 
                  or you will not receive the NFT. This is required for token association with your wallet.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <AgentFilters filters={filters} onFiltersChange={setFilters} />
          </motion.div>

          {/* Results Count & Refresh */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-6 flex items-center justify-between"
          >
            {loading ? (
              <p className="text-muted-foreground">Loading souls...</p>
            ) : (
              <p className="text-muted-foreground">
                Found <span className="text-foreground font-semibold">{filteredSouls.length}</span> souls listed for sale
              </p>
            )}
            <button
              onClick={() => loadSouls()}
              disabled={loading}
              className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Refreshing...' : '🔄 Refresh Market'}
            </button>
          </motion.div>

          {/* Grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
                <p className="text-muted-foreground mt-4">Loading marketplace...</p>
              </div>
            ) : filteredSouls.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">No souls listed for sale yet.</p>
                <p className="text-sm text-muted-foreground mt-2">Create and list your soul to be the first!</p>
              </div>
            ) : (
              <AgentGrid key={refreshKey} agents={filteredSouls} />
            )}
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
}
