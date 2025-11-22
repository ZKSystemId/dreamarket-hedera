"use client";

import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useWallet } from "@/contexts/WalletContext";
import { getNFTsOwnedByAccount, getTotalNFTCount, decodeNFTMetadata, NFTInfo } from "@/lib/hederaMirrorNode";
import { Wallet, Copy, Check, Store, Sparkles, TrendingUp, Activity, X, Flame } from "lucide-react";
import { WalletNotice } from "@/components/WalletNotice";
import { CancelListDialog } from "@/components/marketplace/CancelListDialog";
import { motion } from "framer-motion";

export default function ProfilePage() {
  const { toast } = useToast();
  const { accountId, isConnected } = useWallet();
  const [nfts, setNfts] = useState<NFTInfo[]>([]);
  const [balance, setBalance] = useState({ hbar: 0, tokens: 0 });
  const [totalNFTs, setTotalNFTs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [soulStats, setSoulStats] = useState<Record<string, { level: number; rarity: string; xp: number; isListed?: boolean; price?: number }>>({});
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedNFTForCancel, setSelectedNFTForCancel] = useState<{ nft: NFTInfo; price: number } | null>(null);
  const [operatorId, setOperatorId] = useState<string | null>(null);
  const [operatorNFTs, setOperatorNFTs] = useState<Array<{ token_id: string; serial_number: number; name: string; rarity: string; level: number; xp: number }>>([]);
  const [burning, setBurning] = useState<string | null>(null);

  // Debug: Track state changes (disabled for testing)
  // useEffect(() => {
  //   console.log("🔍 State changed:", {
  //     cancelDialogOpen,
  //     selectedNFTForCancel: selectedNFTForCancel ? `${selectedNFTForCancel.nft.token_id}:${selectedNFTForCancel.nft.serial_number}` : null,
  //   });
  // }, [cancelDialogOpen, selectedNFTForCancel]);

  // Format address helper
  const formatAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 7)}...${address.slice(-4)}`;
  };

  // Load profile function (extracted so we can call it again)
  const loadProfile = async () => {
      if (!accountId) {
        setLoading(false);
        return;
      }

      try {
        console.log("🔍 Fetching NFTs from blockchain for:", accountId);
        
        // Get token ID from environment variable
        const tokenId = process.env.NEXT_PUBLIC_HEDERA_NFT_TOKEN_ID || "0.0.7234567";
        console.log("🪙 Using token ID:", tokenId);
        
        let userNFTs, totalCount;
        try {
          [userNFTs, totalCount] = await Promise.all([
            getNFTsOwnedByAccount(accountId, tokenId),
            getTotalNFTCount(accountId)
          ]);
        } catch (fetchError) {
          console.error("❌ Failed to fetch NFT data:", fetchError);
          setNfts([]);
          setBalance({ hbar: 0, tokens: 0 });
          setTotalNFTs(0);
          setSoulStats({});
          return;
        }
        
        // Check if userNFTs is valid
        if (!userNFTs || !Array.isArray(userNFTs)) {
          console.error("❌ Failed to fetch NFTs - invalid response:", userNFTs);
          setNfts([]);
          setBalance({ hbar: 0, tokens: 0 });
          setTotalNFTs(0);
          setSoulStats({});
          return;
        }
        
        // Get HBAR balance from Hedera
        const { getAccountBalance } = await import("@/lib/hederaClient");
        let accountBalance = { hbar: 0, tokens: 0 };
        try {
          accountBalance = await getAccountBalance(accountId);
        } catch (balanceError) {
          console.warn("⚠️ Failed to fetch HBAR balance:", balanceError);
          // Use default values if balance fetch fails
        }
        
        console.log("✅ Found NFTs on blockchain:", userNFTs?.length || 0);
        console.log("✅ Total NFTs in wallet:", totalCount || 0);
        console.log("💰 Account balance:", accountBalance);
        
        setNfts(userNFTs || []);
        setBalance(accountBalance);
        setTotalNFTs(totalCount || 0);
        
        // Load soul stats from database only if we have NFTs
        const stats: Record<string, { level: number; rarity: string; xp: number; isListed?: boolean; price?: number }> = {};
        
        if (userNFTs && Array.isArray(userNFTs) && userNFTs.length > 0) {
          // Query database for each soul (get the one with highest XP)
          const { supabase } = await import("@/lib/supabase");
          
          console.log(`🔍 Checking ${userNFTs.length} NFTs for soul stats...`);
          
          console.log("🔍 Checking NFTs from blockchain:", userNFTs.map(n => ({ 
          token_id: n.token_id, 
          serial: n.serial_number,
          full_key: `${n.token_id}:${n.serial_number}`
        })));
        
        for (const nft of userNFTs) {
          const tokenKey = `${nft.token_id}:${nft.serial_number}`;
          console.log(`🔍 Checking soul stats for: ${tokenKey}`);
          
          // Query for this specific token_id, get the one with highest XP
          // Also try URL-encoded version in case of encoding issues
          let { data: soulsData, error: soulError } = await supabase
            .from('souls')
            .select('token_id, level, xp, rarity, is_listed, price')
            .eq('token_id', tokenKey)
            .order('xp', { ascending: false })
            .order('level', { ascending: false })
            .order('created_at', { ascending: true })
            .limit(1);
          
          // If not found, try URL-encoded version
          if ((!soulsData || soulsData.length === 0) && tokenKey.includes(':')) {
            const encodedKey = tokenKey.replace(':', '%3A');
            console.log(`🔄 Trying URL-encoded version: ${encodedKey}`);
            const { data: encodedData } = await supabase
              .from('souls')
              .select('token_id, level, xp, rarity, is_listed, price')
              .eq('token_id', encodedKey)
              .order('xp', { ascending: false })
              .order('level', { ascending: false })
              .order('created_at', { ascending: true })
              .limit(1);
            
            if (encodedData && encodedData.length > 0) {
              soulsData = encodedData;
              soulError = null;
            }
          }
          
          console.log(`📊 Query result for ${tokenKey}:`, { 
            data: soulsData, 
            error: soulError,
            found: soulsData && soulsData.length > 0,
            isListed: soulsData && soulsData.length > 0 ? soulsData[0].is_listed : null,
            price: soulsData && soulsData.length > 0 ? soulsData[0].price : null,
          });
          
          const soulData = soulsData && soulsData.length > 0 ? soulsData[0] : null;
          
          if (soulData && !soulError) {
            // Use data from database - ensure boolean conversion
            const isListedValue = soulData.is_listed === true || soulData.is_listed === 'true' || soulData.is_listed === 1;
            const priceValue = soulData.price ? parseFloat(soulData.price.toString()) : 0;
            
            stats[tokenKey] = {
              level: soulData.level || 1,
              rarity: soulData.rarity || "Common",
              xp: soulData.xp || 0,
              isListed: isListedValue,
              price: priceValue,
            };
            console.log(`✅ ${tokenKey}: Level=${soulData.level}, XP=${soulData.xp}, Listed=${isListedValue}, Price=${priceValue}`);
          } else {
            // Use defaults if not in database
            stats[tokenKey] = {
              level: 1,
              rarity: "Common",
              xp: 0,
              isListed: false,
              price: 0,
            };
            console.log(`⚠️ ${tokenKey}: Not in database, using defaults`);
          }
        }
          
          console.log("📊 Final stats object:", stats);
        }
        
        setSoulStats(stats);
        console.log("✅ Soul stats loaded for", userNFTs?.length || 0, "NFTs");
      } catch (error) {
        console.error("Error loading profile:", error);
        toast({
          title: "Error",
          description: "Failed to load NFTs from blockchain",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
  };

  useEffect(() => {
    loadProfile();
  }, [accountId]);

  // Get operator ID and load operator NFTs
  useEffect(() => {
    const fetchOperatorData = async () => {
      try {
        // Get operator ID
        const operatorResponse = await fetch('/api/check-operator');
        if (operatorResponse.ok) {
          const operatorData = await operatorResponse.json();
          if (operatorData.success && operatorData.operatorId) {
            setOperatorId(operatorData.operatorId);
            
            // If current user is operator, load NFTs in operator account
            if (accountId === operatorData.operatorId) {
              await loadOperatorNFTs(operatorData.operatorId);
            }
          }
        }
      } catch (error) {
        console.warn("Failed to fetch operator data:", error);
      }
    };
    
    if (accountId) {
      fetchOperatorData();
    }
  }, [accountId]);

  const loadOperatorNFTs = async (operatorAccountId: string) => {
    try {
      console.log("🔍 Loading NFTs in operator account...");
      
      // Get token ID from environment variable
      const tokenId = process.env.NEXT_PUBLIC_HEDERA_NFT_TOKEN_ID || "0.0.7234567";
      
      // Get NFTs from blockchain
      const operatorNFTsFromChain = await getNFTsOwnedByAccount(operatorAccountId, tokenId);
      
      console.log("✅ Found NFTs in operator account:", operatorNFTsFromChain?.length || 0);
      
      if (!operatorNFTsFromChain || operatorNFTsFromChain.length === 0) {
        setOperatorNFTs([]);
        return;
      }
      
      // Query database for soul data
      const { supabase } = await import("@/lib/supabase");
      const operatorNFTsWithData: Array<{ token_id: string; serial_number: number; name: string; rarity: string; level: number; xp: number }> = [];
      
      for (const nft of operatorNFTsFromChain) {
        const tokenKey = `${nft.token_id}:${nft.serial_number}`;
        
        // Query database for this NFT
        const { data: soulsData } = await supabase
          .from('souls')
          .select('name, rarity, level, xp, owner_account_id')
          .eq('token_id', tokenKey)
          .eq('owner_account_id', operatorAccountId)
          .order('xp', { ascending: false })
          .limit(1);
        
        const soulData = soulsData && soulsData.length > 0 ? soulsData[0] : null;
        
        if (soulData) {
          operatorNFTsWithData.push({
            token_id: nft.token_id,
            serial_number: nft.serial_number,
            name: soulData.name || `Soul #${nft.serial_number}`,
            rarity: soulData.rarity || "Common",
            level: soulData.level || 1,
            xp: soulData.xp || 0,
          });
        } else {
          // NFT exists on-chain but not in database (shouldn't happen, but handle it)
          operatorNFTsWithData.push({
            token_id: nft.token_id,
            serial_number: nft.serial_number,
            name: `Soul #${nft.serial_number}`,
            rarity: "Common",
            level: 1,
            xp: 0,
          });
        }
      }
      
      setOperatorNFTs(operatorNFTsWithData);
    } catch (error) {
      console.error("Error loading operator NFTs:", error);
      setOperatorNFTs([]);
    }
  };

  const handleBurn = async (tokenId: string, serialNumber: number) => {
    // Confirm burn
    if (!confirm(`Are you sure you want to BURN this NFT?\n\nToken: ${tokenId}\nSerial: ${serialNumber}\n\nThis action cannot be undone!`)) {
      return;
    }

    const burnKey = `${tokenId}:${serialNumber}`;
    setBurning(burnKey);

    try {
      const response = await fetch('/api/burn-nft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenId,
          serialNumber,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to burn NFT");
      }

      toast({
        title: "NFT Burned Successfully! 🔥",
        description: `NFT ${tokenId}:${serialNumber} has been burned.`,
      });

      // Reload operator NFTs
      if (operatorId) {
        await loadOperatorNFTs(operatorId);
      }
    } catch (error: any) {
      console.error("❌ Burn error:", error);
      toast({
        title: "Burn Failed",
        description: error.message || "Failed to burn NFT",
        variant: "destructive",
      });
    } finally {
      setBurning(null);
    }
  };

  const copyAddress = () => {
    if (!accountId) return;
    navigator.clipboard.writeText(accountId);
    setCopied(true);
    toast({
      title: "Address Copied",
      description: "Wallet address copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isConnected || !accountId) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Card className="glass-panel max-w-md">
            <CardContent className="py-12 text-center">
              <Wallet className="w-16 h-16 mx-auto mb-4 text-purple-400" />
              <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
              <p className="text-muted-foreground mb-6">
                Please connect your Hedera wallet to view your profile
              </p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading NFTs from blockchain...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Your <span className="text-gradient">Profile</span>
            </h1>
            <div className="flex items-center gap-2">
              <p className="text-muted-foreground font-mono">{formatAddress(accountId)}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyAddress}
                className="h-8 w-8 p-0"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="glass-panel">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">HBAR Balance</CardTitle>
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{balance.hbar}</div>
                  <p className="text-xs text-muted-foreground mt-2">
                    HBAR on testnet
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="glass-panel">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Soul NFTs</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{nfts.length}</div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Soul NFTs owned
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="glass-panel">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total NFTs</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalNFTs}</div>
                  <p className="text-xs text-muted-foreground mt-2">
                    All NFT types
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Your Soul NFTs (On-Chain)
                </CardTitle>
                <CardDescription>
                  NFTs owned in your wallet - fetched directly from Hedera blockchain
                </CardDescription>
              </CardHeader>
              <CardContent>
                {nfts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {nfts.map((nft) => {
                      const metadata = decodeNFTMetadata(nft.metadata);
                      const nftKey = `${nft.token_id}:${nft.serial_number}`;
                      const stats = soulStats[nftKey];
                      const rarity = stats?.rarity || "Common";
                      const level = stats?.level || 1;
                      const isListed = stats?.isListed || false;
                      const price = stats?.price || 0;
                      
                      // Rarity colors
                      const rarityColors = {
                        Common: "border-gray-500 text-gray-400 bg-gray-500/10",
                        Rare: "border-blue-500 text-blue-400 bg-blue-500/10",
                        Legendary: "border-orange-500 text-orange-400 bg-orange-500/10",
                        Mythic: "border-purple-500 text-purple-400 bg-purple-500/10",
                      };
                      
                      return (
                        <Card 
                          key={nftKey} 
                          className={`glass-panel hover:border-purple-500/50 transition-colors cursor-pointer ${isListed ? 'border-green-500/30' : ''}`}
                          onClick={async () => {
                            // Find soul by token_id in database
                            const tokenId = `${nft.token_id}:${nft.serial_number}`;
                            console.log('🔍 Looking for soul with token_id:', tokenId);
                            
                            try {
                              // Query database to get soul_id with consistent ordering
                              const { supabase } = await import("@/lib/supabase");
                              
                              // DEBUG: Check all records first
                              const { data: allSouls } = await supabase
                                .from('souls')
                                .select('soul_id, level, xp, created_at')
                                .eq('token_id', tokenId);
                              
                              console.log('🔍 All souls found for token_id:', tokenId, allSouls);
                              
                              // Get the best soul with consistent ordering
                              const { data: souls } = await supabase
                                .from('souls')
                                .select('soul_id, level, xp')
                                .eq('token_id', tokenId)
                                .order('level', { ascending: false })
                                .order('xp', { ascending: false })
                                .order('created_at', { ascending: true })
                                .limit(1);
                              
                              if (souls && souls.length > 0) {
                                const soulId = souls[0].soul_id;
                                console.log('✅ Selected soul_id:', soulId, 'Level:', souls[0].level, 'XP:', souls[0].xp);
                                window.location.href = `/agents/${soulId}`;
                              } else {
                                console.warn('⚠️ Soul not found in DB, using fallback');
                                // Fallback: use token_id format (consistent)
                                window.location.href = `/agents/${tokenId}`;
                              }
                            } catch (error) {
                              console.error('❌ Error finding soul:', error);
                              // Fallback: use token_id format (consistent)
                              window.location.href = `/agents/${tokenId}`;
                            }
                          }}
                        >
                          <CardHeader>
                            <div className="flex items-center justify-between mb-2">
                              <CardTitle className="text-lg">
                                Soul #{nft.serial_number}
                              </CardTitle>
                              <div className="flex gap-2 flex-wrap">
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${rarityColors[rarity as keyof typeof rarityColors]}`}
                                >
                                  {rarity}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  Lv {level}
                                </Badge>
                                {isListed && (
                                  <Badge className="text-xs bg-green-600 hover:bg-green-700">
                                    🏪 Listed {price} HBAR
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <CardDescription className="font-mono text-xs">
                              {metadata.raw || "Soul NFT"}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Token ID:</span>
                                <span className="font-mono">{nft.token_id}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Serial:</span>
                                <span className="font-mono">#{nft.serial_number}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Minted:</span>
                                <span className="text-xs">
                                  {new Date(parseInt(nft.created_timestamp) * 1000).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              {isListed ? (
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="w-full bg-red-600 hover:bg-red-700"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedNFTForCancel({ nft, price });
                                    setCancelDialogOpen(true);
                                  }}
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Cancel Listing
                                </Button>
                              ) : (
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="w-full bg-blue-600 hover:bg-blue-700"
                                  disabled={loading}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    console.log("👁️ View NFT button clicked!");
                                    console.log("   NFT:", JSON.stringify(nft, null, 2));
                                    
                                    // Redirect to detail page using the same logic as card click
                                    const tokenId = `${nft.token_id}:${nft.serial_number}`;
                                    console.log('🔍 Redirecting to detail page for token_id:', tokenId);
                                    
                                    // Use the same consistent soul lookup logic
                                    (async () => {
                                      try {
                                        const { supabase } = await import("@/lib/supabase");
                                        
                                        // Check all records first
                                        const { data: allSouls } = await supabase
                                          .from('souls')
                                          .select('soul_id, level, xp, created_at')
                                          .eq('token_id', tokenId);
                                        
                                        console.log('🔍 All souls found for view:', tokenId, allSouls);
                                        
                                        // Get the best soul with consistent ordering
                                        const { data: souls } = await supabase
                                          .from('souls')
                                          .select('soul_id, level, xp')
                                          .eq('token_id', tokenId)
                                          .order('level', { ascending: false })
                                          .order('xp', { ascending: false })
                                          .order('created_at', { ascending: true })
                                          .limit(1);
                                        
                                        if (souls && souls.length > 0) {
                                          const soulId = souls[0].soul_id;
                                          console.log('✅ Redirecting to soul_id:', soulId, 'Level:', souls[0].level, 'XP:', souls[0].xp);
                                          window.location.href = `/agents/${soulId}`;
                                        } else {
                                          console.warn('⚠️ Soul not found in DB, using fallback');
                                          window.location.href = `/agents/${tokenId}`;
                                        }
                                      } catch (error) {
                                        console.error('❌ Error finding soul for view:', error);
                                        window.location.href = `/agents/${tokenId}`;
                                      }
                                    })();
                                  }}
                                >
                                  <Store className="w-4 h-4 mr-1" />
                                  View NFT
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <p className="text-muted-foreground mb-4">
                      No Soul NFTs found in your wallet
                    </p>
                    <Button variant="cosmic" onClick={() => window.location.href = "/create"}>
                      Mint Your First Soul NFT
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Operator NFTs Section - Only visible if user is operator */}
          {operatorId && accountId === operatorId && operatorNFTs.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-8"
            >
              <Card className="glass-panel border-orange-500/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Flame className="h-5 w-5 text-orange-500" />
                    Failed Transfer NFTs (Operator Account)
                  </CardTitle>
                  <CardDescription>
                    NFTs that failed to transfer to users - can be burned to clean up
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {operatorNFTs.map((nft) => {
                      const burnKey = `${nft.token_id}:${nft.serial_number}`;
                      const isBurning = burning === burnKey;
                      
                      // Rarity colors
                      const rarityColors = {
                        Common: "border-gray-500 text-gray-400 bg-gray-500/10",
                        Rare: "border-blue-500 text-blue-400 bg-blue-500/10",
                        Legendary: "border-orange-500 text-orange-400 bg-orange-500/10",
                        Mythic: "border-purple-500 text-purple-400 bg-purple-500/10",
                      };
                      
                      return (
                        <Card 
                          key={burnKey} 
                          className="glass-panel border-orange-500/30 hover:border-orange-500/50 transition-colors"
                        >
                          <CardHeader>
                            <div className="flex items-center justify-between mb-2">
                              <CardTitle className="text-lg">
                                {nft.name}
                              </CardTitle>
                              <div className="flex gap-2 flex-wrap">
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${rarityColors[nft.rarity as keyof typeof rarityColors]}`}
                                >
                                  {nft.rarity}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  Lv {nft.level}
                                </Badge>
                              </div>
                            </div>
                            <CardDescription className="font-mono text-xs">
                              Token: {nft.token_id}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Serial:</span>
                                <span className="font-mono">#{nft.serial_number}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">XP:</span>
                                <span>{nft.xp}</span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Button
                                variant="destructive"
                                size="sm"
                                className="w-full"
                                onClick={() => handleBurn(nft.token_id, nft.serial_number)}
                                disabled={isBurning}
                              >
                                <Flame className="h-4 w-4 mr-2" />
                                {isBurning ? "Burning..." : "Burn NFT"}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>

      {/* Cancel List Dialog */}
      {selectedNFTForCancel && (
        <CancelListDialog
          open={cancelDialogOpen}
          onOpenChange={setCancelDialogOpen}
          nft={selectedNFTForCancel.nft}
          price={selectedNFTForCancel.price}
          accountId={accountId || ""}
          onSuccess={() => {
            console.log("🔄 Cancel listing success - reloading profile");
            loadProfile();
          }}
        />
      )}
    </MainLayout>
  );
}
