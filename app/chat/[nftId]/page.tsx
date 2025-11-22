"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useWallet } from "@/contexts/WalletContext";
import { getNFTDetails, decodeNFTMetadata } from "@/lib/hederaMirrorNode";
import { MessageSquare, Send, Sparkles, ArrowLeft } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function ChatNFTPage() {
  const params = useParams();
  const { accountId, isConnected } = useWallet();
  const [nftData, setNftData] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (params?.nftId) {
      loadNFT();
    }
  }, [params?.nftId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadNFT = async () => {
    try {
      const nftId = params?.nftId as string;
      console.log("🔍 Raw nftId:", nftId);
      
      // Handle URL encoding - replace %3A with :
      const decodedId = decodeURIComponent(nftId);
      console.log("🔍 Decoded nftId:", decodedId);
      
      const [tokenId, serial] = decodedId.split(':');
      console.log("🔍 Loading NFT:", tokenId, serial);
      
      if (!tokenId || !serial) {
        console.error("Invalid NFT ID format");
        // Set mock data for demo
        setNftData({
          token_id: tokenId || "0.0.7232401",
          serial_number: parseInt(serial) || 1,
          metadata: { raw: "AI Soul on Hedera" }
        });
        setMessages([{
          id: "welcome",
          role: "assistant",
          content: `Hello! I'm Soul #${serial || 1}. I'm an AI soul living on Hedera blockchain. How can I assist you today?`,
          timestamp: new Date(),
        }]);
        return;
      }
      
      const nft = await getNFTDetails(tokenId, parseInt(serial));
      console.log("✅ NFT loaded:", nft);
      
      if (nft) {
        const metadata = decodeNFTMetadata(nft.metadata);
        setNftData({ ...nft, metadata });
        
        // Welcome message
        setMessages([{
          id: "welcome",
          role: "assistant",
          content: `Hello! I'm Soul #${nft.serial_number}. ${metadata.raw || "I'm an AI soul living on Hedera blockchain."}. How can I assist you today?`,
          timestamp: new Date(),
        }]);
      } else {
        // Fallback if NFT not found
        console.warn("NFT not found, using fallback data");
        setNftData({
          token_id: tokenId,
          serial_number: parseInt(serial),
          metadata: { raw: "AI Soul on Hedera" }
        });
        setMessages([{
          id: "welcome",
          role: "assistant",
          content: `Hello! I'm Soul #${serial}. I'm an AI soul living on Hedera blockchain. How can I assist you today?`,
          timestamp: new Date(),
        }]);
      }
    } catch (error) {
      console.error("Failed to load NFT:", error);
      // Set fallback data
      setNftData({
        token_id: "0.0.7232401",
        serial_number: 1,
        metadata: { raw: "AI Soul on Hedera" }
      });
      setMessages([{
        id: "welcome",
        role: "assistant",
        content: "Hello! I'm an AI soul living on Hedera blockchain. How can I assist you today?",
        timestamp: new Date(),
      }]);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !nftData) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const userInput = input;
    setInput("");
    setLoading(true);

    try {
      // Call AI API with full system
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userInput,
          nftId: `${nftData.token_id}:${nftData.serial_number}`,
          personality: nftData.metadata.raw || "Helpful AI assistant",
          language: "en", // Can be enhanced with language selector
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to get response");
      }

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.response || "I'm here to help!",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Show level up notification
      if (data.leveledUp) {
        const levelUpMessage: Message = {
          id: `system-${Date.now()}`,
          role: "assistant",
          content: `🎉 **LEVEL UP!** Reached Level ${data.level}! (+${data.expGained} XP)${data.evolutionTriggered ? `\n\n✨ **EVOLUTION!** Evolved to ${data.rarity} rarity! New abilities unlocked!` : ''}`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, levelUpMessage]);
      } else if (data.expGained > 0) {
        // Show XP gain subtly
        console.log(`📊 +${data.expGained} XP | Level ${data.level} (${data.rarity})`);
      }

    } catch (error) {
      console.error("Chat error:", error);
      
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "Sorry, I'm having trouble responding right now. Please try again!",
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Card className="glass-panel max-w-md">
            <CardContent className="py-12 text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-purple-400" />
              <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
              <p className="text-muted-foreground">
                Please connect your wallet to chat with your Soul
              </p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  if (!nftData) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading Soul...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen py-6">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => window.location.href = "/profile"}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Profile
            </Button>
            
            <Card className="glass-panel">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-purple-400" />
                      Soul #{nftData.serial_number}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {nftData.metadata.raw || "AI Soul on Hedera"}
                    </p>
                  </div>
                  <Badge variant="outline">On-Chain</Badge>
                </div>
              </CardHeader>
            </Card>
          </div>

          {/* Chat Messages */}
          <Card className="glass-panel mb-6">
            <CardContent className="p-6">
              <div className="space-y-4 max-h-[500px] overflow-y-auto">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-4 ${
                        message.role === 'user'
                          ? 'bg-purple-600 text-white'
                          : 'bg-white/10 border border-white/20'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs opacity-70 mt-2">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </motion.div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </CardContent>
          </Card>

          {/* Input */}
          <Card className="glass-panel">
            <CardContent className="p-4">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type your message..."
                  disabled={loading}
                  className="flex-1"
                />
                <Button
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  variant="cosmic"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                💡 Chatting with Soul #{nftData.serial_number} on Hedera blockchain
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
