"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { useParams } from "next/navigation";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BadgeRarity } from "@/components/common/BadgeRarity";
import { EvolutionPanel } from "@/components/souls/EvolutionPanel";
import { TradingDialog } from "@/components/souls/TradingDialog";
import { fetchSoulById, fetchSoulHistory } from "@/lib/hederaClient";
import { SoulAgent, AgentHistoryEvent } from "@/types/agent";
import { getAvatarGradient, getInitials, formatAddress, formatDate, getRarityBorderColor } from "@/lib/utils";
import { ArrowLeft, ExternalLink, TrendingUp, Clock, Shield, MessageSquare, Send, User, Sparkles } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import { useWallet } from "@/contexts/WalletContext";
import { AILanguageSelector } from "@/components/chat/AILanguageSelector";
import { Language } from "@/lib/languageSystem";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function AgentDetailPage() {
  const params = useParams();
  const { toast } = useToast();
  const { accountId, isConnected } = useWallet();
  const [soul, setSoul] = useState<SoulAgent | null>(null);
  const [history, setHistory] = useState<AgentHistoryEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [tradingOpen, setTradingOpen] = useState(false);
  
  // Chat states
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [aiLanguage, setAILanguage] = useState<Language>("en");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadSoul = async () => {
      try {
        let id = params.id as string;
        console.log('🔍 [AgentDetailPage] Loading soul with ID:', id);
        
        // Add debug query to see all souls that match this pattern
        if (id.includes('165188')) {
          try {
            const { supabase } = await import("@/lib/supabase");
            
            console.log('🔍 [DEBUG] Searching for all Soul #2 records...');
            
            // Search for all souls with name "Soul #2"
            const { data: allMatches, error: matchError } = await supabase
              .from('souls')
              .select('soul_id, name, level, xp, rarity, token_id')
              .eq('name', 'Soul #2')
              .order('level', { ascending: false })
              .order('xp', { ascending: false });
            
            if (matchError) {
              console.error('❌ [DEBUG] Query error:', matchError);
            } else {
              console.log('🔍 [DEBUG] All Soul #2 records found:', allMatches);
              
              // If we find a higher level soul, use that ID instead
              if (allMatches && allMatches.length > 0 && allMatches[0].level > 1) {
                const bestSoul = allMatches[0];
                console.log('🔄 [DEBUG] Using higher level soul:', bestSoul.soul_id, 'Level:', bestSoul.level);
                // Override the ID to use the better soul
                id = bestSoul.soul_id;
              }
            }
          } catch (debugError) {
            console.log('Debug query failed:', debugError);
          }
        }
        
        const soulData = await fetchSoulById(id);
        
        if (!soulData) {
          console.error('❌ [AgentDetailPage] Soul not found:', id);
          toast({
            title: "Soul Not Found",
            description: `Soul with ID "${id}" doesn't exist in our database.`,
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        
        console.log('✅ [AgentDetailPage] Soul loaded:', soulData.name, 'Level:', soulData.level, 'XP:', soulData.xp);
        
        // Use the actual soul ID for fetching history, not the URL parameter
        const historyData = await fetchSoulHistory(soulData.id);
        
        setSoul(soulData);
        setHistory(historyData);
        
        // Initialize welcome message for chat
        setMessages([{
          id: "welcome",
          role: "assistant",
          content: `Hello! I'm ${soulData.name}, ${soulData.tagline}. ${soulData.personality.slice(0, 150)}... How can I assist you today?`,
          timestamp: new Date(),
        }]);
      } catch (error) {
        console.error('❌ [AgentDetailPage] Error loading soul:', error);
        toast({
          title: "Error",
          description: "Failed to load soul details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadSoul();
  }, [params.id, toast]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Force refresh soul data every 30 seconds to ensure sync
  useEffect(() => {
    if (!soul) return;
    
    const interval = setInterval(async () => {
      try {
        const id = params.id as string;
        const freshSoul = await fetchSoulById(id);
        if (freshSoul && (freshSoul.xp !== soul.xp || freshSoul.level !== soul.level)) {
          console.log('🔄 Auto-refreshing soul data - Level changed from', soul.level, 'to', freshSoul.level);
          setSoul(freshSoul);
        }
      } catch (error) {
        console.error('❌ Failed to refresh soul data:', error);
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [soul, params.id]);

  const handleEvolution = async () => {
    // Reload soul data after evolution
    const id = params.id as string;
    console.log('🔄 [handleEvolution] Reloading soul data for:', id);
    
    // Debug: Show all matching souls before reloading
    try {
      const { supabase } = await import("@/lib/supabase");
      const { data: allMatches } = await supabase
        .from('souls')
        .select('soul_id, name, level, xp, rarity, token_id')
        .ilike('soul_id', `%${id}%`)
        .order('level', { ascending: false })
        .order('xp', { ascending: false });
      
      console.log('🔍 [handleEvolution] All souls matching pattern before reload:', allMatches);
    } catch (debugError) {
      console.log('Debug query failed:', debugError);
    }
    
    const soulData = await fetchSoulById(id);
    if (soulData) {
      console.log('✅ [handleEvolution] Soul reloaded:', soulData.name, 'Level:', soulData.level, 'XP:', soulData.xp);
      setSoul(soulData);
    }
  };

  // Calculate reputation based on level and XP
  const calculateReputation = (soul: SoulAgent): number => {
    // Base reputation from level (max 60 points)
    const levelReputation = Math.min(60, soul.level * 3);
    
    // Additional reputation from XP (max 40 points)
    // Scale XP to 0-40 range (assuming max XP around 20000)
    const xpReputation = Math.min(40, Math.floor(soul.xp / 500));
    
    // Total reputation (0-100)
    return Math.min(100, levelReputation + xpReputation);
  };

  const displayReputation = soul ? calculateReputation(soul) : 50;

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !soul || !accountId) {
      if (!isConnected) {
        toast({
          title: "Wallet Not Connected",
          description: "Please connect your wallet to chat with this soul",
          variant: "destructive",
        });
      }
      return;
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: chatInput,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const userInput = chatInput;
    setChatInput("");
    setChatLoading(true);

    try {
      console.log(`🤖 Calling AI API for soul ${soul.id}...`);
      console.log(`🌍 AI Language: ${aiLanguage}`);
      
      const response = await fetch(`/api/souls/${soul.id}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userInput,
          userWallet: accountId,
          language: aiLanguage,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      console.log(`✅ AI response received:`, result);

      const replyContent = result.data?.reply || result.reply || "No response";
      
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: replyContent,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
      
      const chatData = result.data || result;
      
      // Always update soul data with fresh data from API
      if (chatData.soul) {
        console.log('🔄 Updating soul data with fresh data from API');
        console.log('   Old soul - Level:', soul.level, 'XP:', soul.xp);
        console.log('   New soul - Level:', chatData.soul.level, 'XP:', chatData.soul.xp);
        setSoul(chatData.soul);
      } else if (chatData.level !== undefined && chatData.totalExp !== undefined) {
        // Fallback: update soul with individual fields if full soul object not provided
        console.log('🔄 Updating soul with individual fields');
        const updatedSoul = {
          ...soul,
          level: chatData.level,
          xp: chatData.totalExp,
          rarity: chatData.rarity || soul.rarity
        };
        console.log('   Updated soul - Level:', updatedSoul.level, 'XP:', updatedSoul.xp);
        setSoul(updatedSoul);
      }
      
      if (chatData.didLevelUp) {
        if (chatData.didRarityChange) {
          setMessages(prev => [...prev, {
            id: `system-${Date.now()}`,
            role: "assistant",
            content: `🎉 EVOLUTION! ${soul.name} has evolved to ${chatData.rarity} at level ${chatData.level}! New abilities unlocked!`,
            timestamp: new Date(),
          }]);
        } else {
          setMessages(prev => [...prev, {
            id: `system-${Date.now()}`,
            role: "assistant",
            content: `⬆️ Level Up! ${soul.name} reached level ${chatData.level}! (+${chatData.expGained} XP)`,
            timestamp: new Date(),
          }]);
        }
      } else if (chatData.expGained > 0) {
        // Show XP gain even if no level up
        setMessages(prev => [...prev, {
          id: `system-${Date.now()}`,
          role: "assistant",
          content: `💫 ${soul.name} gained ${chatData.expGained} XP! (Total: ${chatData.totalExp} XP)`,
          timestamp: new Date(),
        }]);
      }

      setChatLoading(false);
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: "Chat Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
      setChatLoading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading soul...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!soul) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Soul Not Found</h2>
            <p className="text-muted-foreground mb-6">This soul doesn't exist in our marketplace.</p>
            <Link href="/market">
              <Button variant="cosmic">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Market
              </Button>
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen py-12">
        <div className="container mx-auto px-4">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6"
          >
            <Link href="/market">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Market
              </Button>
            </Link>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Soul Profile Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-1"
            >
              <Card className={`glass-panel border-2 ${getRarityBorderColor(soul.rarity)} sticky top-24`}>
                <CardContent className="p-0">
                  {/* Avatar */}
                  <div className="relative h-64 overflow-hidden rounded-t-lg">
                    {soul.avatarUrl ? (
                      <img
                        src={soul.avatarUrl}
                        alt={soul.name}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <>
                        <div
                          className={`absolute inset-0 bg-gradient-to-br ${getAvatarGradient(soul.avatarSeed || soul.name)}`}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-8xl font-bold text-white/90">
                            {getInitials(soul.name)}
                          </span>
                        </div>
                      </>
                    )}
                    <div className="absolute top-4 right-4">
                      <BadgeRarity rarity={soul.rarity} />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-6 space-y-4">
                    <div>
                      <h1 className="text-3xl font-bold mb-2">{soul.name}</h1>
                      <p className="text-muted-foreground">{soul.tagline}</p>
                    </div>

                    {/* Reputation */}
                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-muted-foreground flex items-center">
                          <TrendingUp className="w-4 h-4 mr-1" />
                          Reputation
                        </span>
                        <span className="font-semibold">{displayReputation}/100</span>
                      </div>
                      <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                          style={{ width: `${displayReputation}%` }}
                        />
                      </div>
                    </div>

                    {/* Owner */}
                    <div className="pt-4 border-t border-white/10 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Owner</span>
                        <span className="font-mono">{formatAddress(soul.owner)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Token ID</span>
                        <span className="font-mono">{soul.tokenId}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Created</span>
                        <span>{formatDate(soul.createdAt)}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-4 space-y-2">
                      <Button 
                        variant="cosmic" 
                        className="w-full"
                        onClick={() => setTradingOpen(true)}
                      >
                        Trade Soul
                      </Button>

                      <a 
                        href={
                          soul.tokenId?.includes(':') 
                            ? `https://hashscan.io/testnet/token/${soul.tokenId.split(':')[0]}/${soul.tokenId.split(':')[1]}` 
                            : soul.tokenId?.includes('/')
                            ? `https://hashscan.io/testnet/token/${soul.tokenId.split('/')[0]}/${soul.tokenId.split('/')[1]}`
                            : `https://hashscan.io/testnet/token/${soul.tokenId}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full"
                      >
                        <Button variant="outline" className="w-full">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View NFT on HashScan
                        </Button>
                      </a>

                      {soul.creationTxHash && (
                        <a 
                          href={`https://hashscan.io/testnet/transaction/${soul.creationTxHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full"
                        >
                          <Button variant="ghost" size="sm" className="w-full text-xs">
                            <ExternalLink className="mr-2 h-3 w-3" />
                            View Mint Transaction
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Right Column - Tabs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-2"
            >
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-6">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="evolution">Evolution</TabsTrigger>
                  <TabsTrigger value="onchain">On-Chain</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                  <Card className="glass-panel">
                    <CardHeader>
                      <CardTitle>Personality</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground leading-relaxed">
                        {soul.personality}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="glass-panel">
                    <CardHeader>
                      <CardTitle>Skills & Abilities</CardTitle>
                      <CardDescription>
                        Unique capabilities and expertise areas
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {soul.skills && soul.skills.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {soul.skills.map((skill) => (
                            <Badge
                              key={skill}
                              variant="secondary"
                              className="bg-purple-500/20 text-purple-300 border-purple-500/50 hover:bg-purple-500/30 transition-colors"
                            >
                              ✨ {skill}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className="text-4xl mb-2">🎯</div>
                          <p className="text-muted-foreground text-sm">
                            This Soul is still developing its skills through interactions
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            Chat with this Soul to help it learn and grow!
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="glass-panel">
                    <CardHeader>
                      <CardTitle>Creation Story</CardTitle>
                      <CardDescription>
                        The origin and purpose of this Soul
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {soul.creationStory ? (
                        <p className="text-muted-foreground leading-relaxed">
                          {soul.creationStory}
                        </p>
                      ) : (
                        <div className="text-center py-8">
                          <div className="text-4xl mb-2">📖</div>
                          <p className="text-muted-foreground text-sm mb-4">
                            Every Soul has a story waiting to be written...
                          </p>
                          <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-left">
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              <strong className="text-white">Born on Hedera:</strong> This Soul was minted on {new Date(soul.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} as a unique digital entity on the Hedera network.
                            </p>
                            <p className="text-sm text-muted-foreground leading-relaxed mt-3">
                              <strong className="text-white">Living AI:</strong> Unlike static NFTs, this Soul is a dynamic AI agent that learns and evolves through every interaction. Each conversation shapes its personality and expands its knowledge.
                            </p>
                            <p className="text-sm text-muted-foreground leading-relaxed mt-3">
                              <strong className="text-white">Your Journey:</strong> As you chat and interact with this Soul, you'll help write its story. Every message contributes to its growth and evolution on the blockchain.
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Evolution Tab */}
                <TabsContent value="evolution">
                  <EvolutionPanel soul={soul} onEvolution={handleEvolution} />
                </TabsContent>

                {/* On-Chain Tab */}
                <TabsContent value="onchain" className="space-y-6">
                  {/* Blockchain Data */}
                  <Card className="glass-panel">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Shield className="w-5 h-5 mr-2 text-green-400" />
                        On-Chain Data
                      </CardTitle>
                      <CardDescription>
                        Immutable blockchain records for this soul
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="font-mono text-sm space-y-3 bg-black/20 p-4 rounded-lg">
                          <div className="flex justify-between items-center border-b border-white/10 pb-2">
                            <span className="text-muted-foreground">Token ID:</span>
                            <div className="flex items-center gap-2">
                              <span className="text-purple-400">{soul.tokenId}</span>
                              {soul.tokenId && (
                                <a
                                  href={
                                    soul.tokenId?.includes(':') 
                                      ? `https://hashscan.io/testnet/token/${soul.tokenId.split(':')[0]}/${soul.tokenId.split(':')[1]}`
                                      : soul.tokenId?.includes('/')
                                      ? `https://hashscan.io/testnet/token/${soul.tokenId.split('/')[0]}/${soul.tokenId.split('/')[1]}`
                                      : `https://hashscan.io/testnet/token/${soul.tokenId}`
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-400 hover:text-blue-300"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          </div>
                          <div className="flex justify-between items-center border-b border-white/10 pb-2">
                            <span className="text-muted-foreground">Serial Number:</span>
                            <span className="text-purple-400">
                              #{soul.tokenId?.split(':')[1] || 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center border-b border-white/10 pb-2">
                            <span className="text-muted-foreground">Owner:</span>
                            <div className="flex items-center gap-2">
                              <span className="text-purple-400 font-mono text-xs">
                                {formatAddress(soul.owner)}
                              </span>
                              <a
                                href={`https://hashscan.io/testnet/account/${soul.owner}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                          <div className="flex justify-between items-center border-b border-white/10 pb-2">
                            <span className="text-muted-foreground">Network:</span>
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                              Hedera Testnet
                            </Badge>
                          </div>
                        </div>

                        <div className="font-mono text-sm space-y-3 bg-black/20 p-4 rounded-lg">
                          <div className="flex justify-between items-center border-b border-white/10 pb-2">
                            <span className="text-muted-foreground">Level:</span>
                            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">
                              Level {soul.level || 1}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center border-b border-white/10 pb-2">
                            <span className="text-muted-foreground">XP:</span>
                            <span className="text-purple-400">{soul.xp || 0} XP</span>
                          </div>
                          <div className="flex justify-between items-center border-b border-white/10 pb-2">
                            <span className="text-muted-foreground">Rarity:</span>
                            <BadgeRarity rarity={soul.rarity} />
                          </div>
                          <div className="flex justify-between items-center border-b border-white/10 pb-2">
                            <span className="text-muted-foreground">Listed:</span>
                            <span className={soul.isListed ? "text-green-400" : "text-muted-foreground"}>
                              {soul.isListed ? `Yes (${soul.price} HBAR)` : "No"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Transaction Hashes */}
                      <div className="font-mono text-sm space-y-3 bg-black/20 p-4 rounded-lg">
                        <div className="flex justify-between items-center border-b border-white/10 pb-2">
                          <span className="text-muted-foreground">Creation Transaction:</span>
                          <div className="flex items-center gap-2">
                            {soul.creationTxHash ? (
                              <>
                                <span className="text-purple-400 truncate max-w-[200px]">
                                  {soul.creationTxHash}
                                </span>
                                <a
                                  href={`https://hashscan.io/testnet/transaction/${soul.creationTxHash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-400 hover:text-blue-300 shrink-0"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </>
                            ) : (
                              <span className="text-muted-foreground text-xs">Not available</span>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Last Update Transaction:</span>
                          <div className="flex items-center gap-2">
                            {soul.lastUpdateTxHash ? (
                              <>
                                <span className="text-purple-400 truncate max-w-[200px]">
                                  {soul.lastUpdateTxHash}
                                </span>
                                <a
                                  href={`https://hashscan.io/testnet/transaction/${soul.lastUpdateTxHash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-400 hover:text-blue-300 shrink-0"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </>
                            ) : (
                              <span className="text-muted-foreground text-xs">No updates yet</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-sm text-muted-foreground bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                        <p className="mb-2 font-semibold text-purple-300">
                          🔒 Secured by Hedera Hashgraph
                        </p>
                        <p className="mb-2">
                          This soul is secured by Hedera's hashgraph consensus, ensuring:
                        </p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                          <li>Immutable ownership records</li>
                          <li>Transparent transaction history</li>
                          <li>Fast finality (3-5 seconds)</li>
                          <li>Low transaction costs (~$0.0001)</li>
                          <li>Energy efficient (proof-of-stake)</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* History Tab */}
                <TabsContent value="history">
                  <Card className="glass-panel">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Clock className="w-5 h-5 mr-2 text-cyan-400" />
                        Activity History
                      </CardTitle>
                      <CardDescription>
                        All events and transactions for this soul
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {history.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="text-4xl mb-4">📜</div>
                          <p className="text-muted-foreground text-lg mb-2">
                            No activity yet
                          </p>
                          <p className="text-sm text-muted-foreground">
                            This soul's history will appear here as events occur
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {history.map((event, index) => {
                            // Get icon and color based on event type
                            let icon = Clock;
                            let iconColor = "text-cyan-400";
                            let bgColor = "bg-cyan-500/20";
                            
                            if (event.type === "minted") {
                              icon = Sparkles;
                              iconColor = "text-green-400";
                              bgColor = "bg-green-500/20";
                            } else if (event.type === "transferred" || event.type === "sale") {
                              icon = User;
                              iconColor = "text-blue-400";
                              bgColor = "bg-blue-500/20";
                            } else if (event.type === "listed") {
                              icon = TrendingUp;
                              iconColor = "text-purple-400";
                              bgColor = "bg-purple-500/20";
                            } else if (event.type === "delisted" || event.type === "cancel") {
                              icon = Clock;
                              iconColor = "text-orange-400";
                              bgColor = "bg-orange-500/20";
                            } else if (event.type === "level_up") {
                              icon = TrendingUp;
                              iconColor = "text-yellow-400";
                              bgColor = "bg-yellow-500/20";
                            }

                            const IconComponent = icon;

                            return (
                              <div
                                key={event.id}
                                className="flex items-start space-x-4 pb-4 border-b border-white/10 last:border-0 group hover:bg-white/5 rounded-lg p-3 -m-3 transition-colors"
                              >
                                <div className={`flex-shrink-0 w-10 h-10 rounded-full ${bgColor} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                  <IconComponent className={`w-5 h-5 ${iconColor}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-foreground">
                                    {event.description}
                                  </p>
                                  <div className="flex items-center gap-3 mt-2">
                                    <p className="text-xs text-muted-foreground">
                                      {formatDate(event.timestamp)}
                                    </p>
                                    {event.txHash && (
                                      <>
                                        <span className="text-xs text-muted-foreground">•</span>
                                        <a
                                          href={`https://hashscan.io/testnet/transaction/${event.txHash}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-xs font-mono text-purple-400 hover:text-purple-300 flex items-center gap-1"
                                        >
                                          View Tx
                                          <ExternalLink className="w-3 h-3" />
                                        </a>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Trading Dialog */}
      {soul && (
        <TradingDialog
          soul={soul}
          open={tradingOpen}
          onOpenChange={setTradingOpen}
          onSuccess={handleEvolution}
        />
      )}
    </MainLayout>
  );
}
