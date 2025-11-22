"use client";

import { useEffect, useState, useRef } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useWallet } from "@/contexts/WalletContext";
import { getNFTsOwnedByAccount, decodeNFTMetadata, NFTInfo } from "@/lib/hederaMirrorNode";
import { MessageCircle, Wallet, Sparkles, Send, TrendingUp, Star, Trash2, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { AILanguageSelector } from "@/components/chat/AILanguageSelector";
import { Language, getLanguageFullName } from "@/lib/languageSystem";
import { calculateExpGain, getLevelForExp, getXpForNextLevel, getRarityForLevel, getXpProgress, EXP_CONFIG } from "@/services/expService";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function ChatPage() {
  const { accountId, isConnected } = useWallet();
  const [nfts, setNfts] = useState<NFTInfo[]>([]);
  const [selectedNFT, setSelectedNFT] = useState<NFTInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [exp, setExp] = useState(0);
  const [level, setLevel] = useState(1);
  const [rarity, setRarity] = useState<string>("Common");
  const [aiLanguage, setAILanguage] = useState<Language>("en");
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [clearingHistory, setClearingHistory] = useState(false);
  const [isListed, setIsListed] = useState(false);
  const [listedPrice, setListedPrice] = useState<number | null>(null);
  const [nftListedStatus, setNftListedStatus] = useState<Record<string, { listed: boolean; price?: number }>>({});
  const [soulRarityData, setSoulRarityData] = useState<Record<string, { rarity: string; level: number }>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (accountId) {
      loadNFTs();
    } else {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    // Only auto-scroll if user is near bottom (within 100px)
    const messageContainer = messagesEndRef.current?.parentElement;
    if (messageContainer) {
      const isNearBottom = messageContainer.scrollHeight - messageContainer.scrollTop - messageContainer.clientHeight < 100;
      if (isNearBottom) {
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ 
            behavior: "smooth", 
            block: "end",
            inline: "nearest" 
          });
        }, 100);
      }
    }
  }, [messages]);

  const loadNFTs = async () => {
    try {
      console.log("🔍 Loading NFTs for chat...");
      const tokenId = process.env.NEXT_PUBLIC_HEDERA_NFT_TOKEN_ID || "0.0.7242548";
      console.log("🪙 Using token ID for chat:", tokenId);
      const userNFTs = await getNFTsOwnedByAccount(accountId!, tokenId);
      
      console.log("✅ Found NFTs:", userNFTs.length);
      setNfts(userNFTs);
      
      // Check listing status and rarity for all NFTs
      const { supabase } = await import("@/lib/supabase");
      const listedStatus: Record<string, { listed: boolean; price?: number }> = {};
      const rarityData: Record<string, { rarity: string; level: number }> = {};
      
      for (const nft of userNFTs) {
        const tokenKey = `${nft.token_id}:${nft.serial_number}`;
        const { data: soul } = await supabase
          .from('souls')
          .select('is_listed, price, rarity, level')
          .eq('token_id', tokenKey)
          .eq('owner_account_id', accountId!)
          .single();
        
        listedStatus[tokenKey] = {
          listed: soul?.is_listed || false,
          price: soul?.price ? Number(soul.price) : undefined,
        };
        
        rarityData[tokenKey] = {
          rarity: soul?.rarity || 'Common',
          level: soul?.level || 1,
        };
      }
      
      setNftListedStatus(listedStatus);
      setSoulRarityData(rarityData);
      
      // Auto-select first NFT (will check if listed in selectNFT)
      if (userNFTs.length > 0) {
        selectNFT(userNFTs[0]);
      }
    } catch (error) {
      console.error("Failed to load NFTs:", error);
    } finally {
      setLoading(false);
    }
  };

  const selectNFT = async (nft: NFTInfo) => {
    setSelectedNFT(nft);
    
    // Check if NFT is listed
    const { supabase } = await import("@/lib/supabase");
    const tokenKey = `${nft.token_id}:${nft.serial_number}`;
    
    const { data: soul } = await supabase
      .from('souls')
      .select('is_listed, price')
      .eq('token_id', tokenKey)
      .eq('owner_account_id', accountId!)
      .single();
    
    const listed = soul?.is_listed || false;
    const price = listed ? (soul?.price ? Number(soul.price) : null) : null;
    setIsListed(listed);
    setListedPrice(price);
    
    // If listed, don't load chat data, just show message
    if (listed) {
      setMessages([{
        id: "listed-notice",
        role: "assistant",
        content: `⚠️ This Soul is currently listed for sale${price ? ` at ${price} HBAR` : ''} and cannot be chatted with. Please cancel the listing first to continue chatting.`,
        timestamp: new Date(),
      }]);
      setLevel(1);
      setExp(0);
      setRarity("Common");
      return;
    }
    
    // Load soul data from database to get current XP, Level, and chat history
    try {
      const soulId = `${nft.token_id}:${nft.serial_number}`;
      console.log("📊 Loading soul data for:", soulId);
      
      // Include userWallet in query to filter chat history by current owner
      const response = await fetch(`/api/souls/${soulId}/chat?userWallet=${accountId}&limit=100`, {
        method: 'GET',
      });
      
      if (response.ok) {
        const data = await response.json();
        // If soul data exists, use its XP, Level, and Rarity
        if (data.success && data.data?.soul) {
          const soul = data.data.soul;
          setLevel(soul.level || 1);
          setExp(soul.xp || 0);
          setRarity(soul.rarity || "Common");
          setIsListed(false); // Ensure isListed is false when loading chat data
          setListedPrice(null);
          console.log("✅ Loaded soul stats - Level:", soul.level, "XP:", soul.xp, "Rarity:", soul.rarity);
          
          // Load chat history from database
          if (data.data?.messages && data.data.messages.length > 0) {
            console.log("📜 Loading chat history:", data.data.messages.length, "messages");
            const historyMessages: Message[] = data.data.messages.map((msg: any) => ({
              id: msg.id,
              role: msg.role,
              content: msg.content,
              timestamp: new Date(msg.timestamp || msg.created_at),
            }));
            setMessages(historyMessages);
          } else {
            // No chat history, show welcome message
            setMessages([{
              id: "welcome",
              role: "assistant",
              content: `Hello! I'm Soul #${nft.serial_number}. I'm an AI soul living on Hedera blockchain. How can I assist you today?`,
              timestamp: new Date(),
            }]);
          }
        } else {
          // New soul, use defaults
          setLevel(1);
          setExp(0);
          setRarity("Common");
          setMessages([{
            id: "welcome",
            role: "assistant",
            content: `Hello! I'm Soul #${nft.serial_number}. I'm an AI soul living on Hedera blockchain. How can I assist you today?`,
            timestamp: new Date(),
          }]);
        }
      } else {
        // Fallback to defaults
        setLevel(1);
        setExp(0);
        setRarity("Common");
        setMessages([{
          id: "welcome",
          role: "assistant",
          content: `Hello! I'm Soul #${nft.serial_number}. I'm an AI soul living on Hedera blockchain. How can I assist you today?`,
          timestamp: new Date(),
        }]);
      }
    } catch (error) {
      console.error("Failed to load soul data:", error);
      // Fallback to defaults
      setLevel(1);
      setExp(0);
      setRarity("Common");
      setMessages([{
        id: "welcome",
        role: "assistant",
        content: `Hello! I'm Soul #${nft.serial_number}. I'm an AI soul living on Hedera blockchain. How can I assist you today?`,
        timestamp: new Date(),
      }]);
    }
  };

  // Level and XP are managed by server response
  // No need for client-side calculation

  const [requestInFlight, setRequestInFlight] = useState(false);
  const { toast } = useToast();

  const handleSend = async () => {
    if (!input.trim() || !selectedNFT || chatLoading || requestInFlight) return;

    // Check if NFT is listed before sending message
    const { supabase } = await import("@/lib/supabase");
    const tokenKey = `${selectedNFT.token_id}:${selectedNFT.serial_number}`;
    
    const { data: soul } = await supabase
      .from('souls')
      .select('is_listed')
      .eq('token_id', tokenKey)
      .eq('owner_account_id', accountId!)
      .single();
    
    if (soul?.is_listed) {
      toast({
        title: "Cannot Chat",
        description: "This Soul is currently listed for sale and cannot be chatted with. Please cancel the listing first.",
        variant: "destructive",
      });
      return;
    }

    // Prevent double requests
    setRequestInFlight(true);

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const userInput = input;
    setInput("");
    setChatLoading(true);

    // Gentle scroll to keep input visible after sending message
    setTimeout(() => {
      const messageContainer = document.getElementById('messages-container');
      if (messageContainer) {
        // Scroll to near bottom but leave some space for input visibility
        const targetScroll = Math.max(0, messageContainer.scrollHeight - messageContainer.clientHeight - 50);
        messageContainer.scrollTop = targetScroll;
      }
    }, 50);

    try {
      // Use token_id:serial format as soul ID
      const soulId = `${selectedNFT.token_id}:${selectedNFT.serial_number}`;
      
      // Generate unique interaction ID for idempotency
      const interactionId = crypto.randomUUID();
      
      console.log("🔍 Using soul ID:", soulId);
      
      const response = await fetch(`/api/souls/${soulId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userInput,
          userWallet: accountId,
          language: aiLanguage,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        if (data.rateLimited || response.status === 429) {
          throw new Error("⚠️ Rate limit reached. Please wait a few minutes and try again.");
        }
        throw new Error(data.error || data.message || `HTTP ${response.status}`);
      }
      
      if (data.success) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.data?.reply || data.response || data.message || "I'm not sure how to respond to that.",
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, assistantMessage]);
        
        // Update XP, level, and rarity from API response
        if (data.data) {
          const { expGained, totalExp, level: newLevel, rarity: newRarity, didLevelUp, contractUpdate } = data.data;
          
          // Log contract update result
          if (contractUpdate) {
            if (contractUpdate.success) {
              console.log(`✅ Contract updated! TX: ${contractUpdate.txHash}`);
              console.log(`   HashScan: https://hashscan.io/testnet/transaction/${contractUpdate.txHash}`);
            } else {
              console.warn(`⚠️ Contract update failed: ${contractUpdate.error}`);
            }
          } else {
            console.log(`ℹ️ No contract update (may not be registered or no XP gained)`);
          }
          
          // Update local state with fresh data from server
          if (totalExp !== undefined) {
            setExp(totalExp);
          }
          
          if (newLevel !== undefined) {
            setLevel(newLevel);
          }
          
          if (newRarity !== undefined) {
            setRarity(newRarity);
          }
          
          // Show level up notification
          if (didLevelUp) {
            toast({
              title: "🎉 Level Up!",
              description: `Your soul reached Level ${newLevel}! ${data.data.didEvolve ? '✨ New rarity unlocked!' : ''}`,
              variant: 'default',
              duration: 5000
            });
            
            // Don't reload NFTs - just update local state to avoid jumping to another soul
            // The level, exp, and rarity are already updated above
          }
        }
      } else {
        // Handle rate limit specifically
        if (data.rateLimited) {
          throw new Error("⚠️ Rate limit reached. Please wait a few minutes and try again.");
        }
        throw new Error(data.error || data.message || "Failed to get AI response");
      }
    } catch (error: any) {
      console.error("Chat error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: 'destructive',
        duration: 5000
      });
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "Sorry, I'm having trouble responding right now. Please try again!",
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setChatLoading(false);
      setRequestInFlight(false); // Reset flag to allow next request
      
      // Auto-focus input after response
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  if (!isConnected || !accountId) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center py-12">
          <Card className="glass-panel max-w-md">
            <CardContent className="py-12 text-center">
              <Wallet className="w-16 h-16 mx-auto mb-4 text-purple-400" />
              <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
              <p className="text-muted-foreground mb-6">
                Please connect your Hedera wallet to chat with your Souls
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
            <p className="text-muted-foreground">Loading your Souls...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="h-screen flex flex-col">
        <div className="container mx-auto px-4 max-w-7xl flex-1 flex flex-col">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 py-4">
            {/* Left Sidebar - NFT List */}
            <div className="lg:col-span-3">
              <Card className="glass-panel flex flex-col" style={{ height: 'calc(100vh - 120px)' }}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Sparkles className="h-4 w-4" />
                    Your Souls
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Select a Soul to chat
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 flex-1 overflow-y-auto px-3">
                  {nfts.map((nft) => {
                    const metadata = decodeNFTMetadata(nft.metadata);
                    const isSelected = selectedNFT?.serial_number === nft.serial_number;
                    const tokenKey = `${nft.token_id}:${nft.serial_number}`;
                    const listedInfo = nftListedStatus[tokenKey];
                    const isNftListed = listedInfo?.listed || false;
                    
                    return (
                      <Card
                        key={`${nft.token_id}-${nft.serial_number}`}
                        className={`cursor-pointer transition-all ${
                          isSelected
                            ? 'border-purple-500 bg-purple-500/10'
                            : 'hover:border-purple-500/50'
                        } ${isNftListed ? 'opacity-75' : ''}`}
                        onClick={() => selectNFT(nft)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold">Soul #{nft.serial_number}</span>
                            <div className="flex items-center gap-1">
                              {isNftListed && (
                                <Badge variant="outline" className="text-xs bg-yellow-500/20 border-yellow-500/50 text-yellow-400">
                                  Listed
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-xs">
                                On-Chain
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground truncate">
                              {metadata.raw || "AI Soul"}
                            </p>
                            {soulRarityData[tokenKey] && (
                              <Badge 
                                variant="outline" 
                                className={`text-xs py-0 px-1.5 h-5 ${
                                  soulRarityData[tokenKey].rarity === 'Mythic' ? 'bg-purple-500/20 border-purple-500/50 text-purple-400' :
                                  soulRarityData[tokenKey].rarity === 'Legendary' ? 'bg-orange-500/20 border-orange-500/50 text-orange-400' :
                                  soulRarityData[tokenKey].rarity === 'Rare' ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' :
                                  'bg-gray-500/20 border-gray-500/50 text-gray-400'
                                }`}
                              >
                                {soulRarityData[tokenKey].rarity}
                              </Badge>
                            )}
                          </div>
                          {isNftListed && listedInfo?.price && (
                            <p className="text-xs text-yellow-400 mt-1">
                              {listedInfo.price} HBAR
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                  {nfts.length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground text-sm mb-4">
                        No Souls found
                      </p>
                      <Button
                        variant="cosmic"
                        size="sm"
                        onClick={() => window.location.href = "/create"}
                      >
                        Create Soul
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Side - Chat */}
            <div className="lg:col-span-9">
              {selectedNFT ? (
                <Card className="glass-panel flex flex-col" style={{ height: 'calc(100vh - 120px)' }}>
                  {/* Chat Header */}
                  <CardHeader className="border-b border-white/10 flex-shrink-0 pb-3">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-2">
                      <div className="min-w-0">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Sparkles className="h-4 w-4 text-purple-400" />
                          Soul #{selectedNFT.serial_number}
                        </CardTitle>
                        <CardDescription className="text-sm truncate">
                          {decodeNFTMetadata(selectedNFT.metadata).raw || "AI Soul on Hedera"}
                        </CardDescription>
                      </div>
                      <div className="flex flex-wrap items-center gap-1">
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-400" />
                          Level {level}
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className={`flex items-center gap-1 ${
                            rarity === 'Mythic' ? 'border-purple-500 text-purple-400' :
                            rarity === 'Legendary' ? 'border-orange-500 text-orange-400' :
                            rarity === 'Rare' ? 'border-blue-500 text-blue-400' :
                            'border-gray-500 text-gray-400'
                          }`}
                        >
                          {rarity}
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {(() => {
                            const currentLevelThreshold = EXP_CONFIG.LEVEL_THRESHOLDS[level - 1] || 0;
                            const nextLevelThreshold = getXpForNextLevel(level);
                            const xpInLevel = Math.max(0, exp - currentLevelThreshold);
                            const xpNeeded = Math.max(0, nextLevelThreshold - currentLevelThreshold);
                            return `${xpInLevel} / ${xpNeeded} XP`;
                          })()}
                        </Badge>
                        <AILanguageSelector
                          soulLevel={level}
                          selectedLanguage={aiLanguage}
                          onLanguageChange={setAILanguage}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowClearDialog(true)}
                          className="p-2"
                          title="Clear Chat History"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  {/* Messages */}
                  <CardContent className="flex-1 overflow-y-auto p-3 space-y-3" id="messages-container">
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] lg:max-w-[75%] rounded-lg p-3 ${
                            message.role === 'user'
                              ? 'bg-purple-600 text-white'
                              : 'bg-white/10 border border-white/20'
                          }`}
                        >
                          <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                            {message.content}
                          </div>
                          <p className="text-xs opacity-70 mt-1">
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                    
                    {/* Loading indicator */}
                    {chatLoading && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-start"
                      >
                        <div className="max-w-[85%] lg:max-w-[75%] rounded-lg p-3 bg-white/10 border border-white/20">
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-purple-400 animate-pulse" />
                            <div className="flex gap-1">
                              <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                              <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                              <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                    
                    {/* Spacer to prevent input from being hidden */}
                    <div className="h-4" />
                    <div ref={messagesEndRef} />
                  </CardContent>

                  {/* Input */}
                  <CardContent className="border-t border-white/10 p-3 flex-shrink-0">
                    {isListed ? (
                      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                        <p className="text-sm text-yellow-300 mb-2">
                          ⚠️ This Soul is currently listed for sale{listedPrice ? ` at ${listedPrice} HBAR` : ''} and cannot be chatted with.
                        </p>
                        <p className="text-xs text-yellow-400/80">
                          Please cancel the listing first to continue chatting.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="flex gap-2">
                          <Input
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                            placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
                            disabled={chatLoading}
                            className="flex-1 text-sm"
                            autoFocus
                          />
                          <Button
                            onClick={handleSend}
                            disabled={chatLoading || !input.trim()}
                            variant="cosmic"
                            size="sm"
                          >
                            {chatLoading ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          💡 Earn XP with each message to level up your Soul
                        </p>
                      </>
                    )}
                  </CardContent>

                  {/* Clear Chat History Dialog */}
                  <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-yellow-500" />
                          Clear Chat History
                        </DialogTitle>
                        <DialogDescription>
                          Are you sure you want to clear all chat history for Soul #{selectedNFT?.serial_number}? 
                          This action cannot be undone. Only your messages will be deleted.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setShowClearDialog(false)}
                          disabled={clearingHistory}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={async () => {
                            if (!selectedNFT || !accountId) return;
                            
                            setClearingHistory(true);
                            try {
                              const soulId = `${selectedNFT.token_id}:${selectedNFT.serial_number}`;
                              const response = await fetch(`/api/souls/${soulId}/chat?userWallet=${accountId}`, {
                                method: 'DELETE',
                              });

                              const data = await response.json();

                              if (!response.ok || !data.success) {
                                throw new Error(data.error || "Failed to clear chat history");
                              }

                              toast({
                                title: "Chat History Cleared",
                                description: "All chat history has been cleared successfully.",
                                variant: "default",
                              });

                              setShowClearDialog(false);

                              // Reload NFT to refresh chat history from database
                              // This ensures UI is in sync with database state
                              // Wait a bit for database to update before reloading
                              setTimeout(() => {
                                selectNFT(selectedNFT);
                              }, 500);
                            } catch (error: any) {
                              console.error("Failed to clear chat history:", error);
                              toast({
                                title: "Error",
                                description: error.message || "Failed to clear chat history",
                                variant: "destructive",
                              });
                            } finally {
                              setClearingHistory(false);
                            }
                          }}
                          disabled={clearingHistory}
                        >
                          {clearingHistory ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                              Clearing...
                            </>
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Clear History
                            </>
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </Card>
              ) : (
                <Card className="glass-panel h-full flex items-center justify-center">
                  <CardContent className="text-center">
                    <MessageCircle className="w-16 h-16 mx-auto mb-4 text-purple-400" />
                    <h3 className="text-xl font-bold mb-2">Select a Soul</h3>
                    <p className="text-muted-foreground">
                      Choose a Soul from the left to start chatting
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
