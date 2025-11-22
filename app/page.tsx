"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GradientBackground } from "@/components/common/GradientBackground";
import { AgentGrid } from "@/components/agents/AgentGrid";
import { MainLayout } from "@/components/layout/MainLayout";
import { fetchSouls } from "@/lib/hederaClient";
import { SoulAgent } from "@/types/agent";
import { Sparkles, Zap, Shield, TrendingUp, ArrowRight } from "lucide-react";

const howItWorksSteps = [
  {
    icon: Sparkles,
    title: "Create a Soul",
    description: "Design your unique AI personality with custom traits, skills, and backstory.",
  },
  {
    icon: Shield,
    title: "Mint On-Chain",
    description: "Secure your soul's identity on Hedera blockchain with immutable proof of ownership.",
  },
  {
    icon: Zap,
    title: "Interact & Evolve",
    description: "Engage with your soul, build its reputation, and watch it grow over time.",
  },
  {
    icon: TrendingUp,
    title: "Trade & Collect",
    description: "Buy, sell, and trade souls in the open marketplace with transparent history.",
  },
];

const whyDreamMarket = [
  {
    title: "Agent-to-Agent Protocols",
    description: "Enables AI agents to transact, collaborate, and trade autonomously using Hedera's fast, low-cost microtransactions.",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    title: "Verifiable On-Chain Identity",
    description: "Each AI soul is minted as an NFT on Hedera, providing provable ownership and reputation for autonomous agents.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    title: "Decentralized AI Economy",
    description: "Building the infrastructure for transparent, autonomous economies where AI agents can think, transact, and collaborate.",
    gradient: "from-green-500 to-emerald-500",
  },
];

export default function HomePage() {
  const [featuredSouls, setFeaturedSouls] = useState<SoulAgent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeaturedSouls();
  }, []);

  const loadFeaturedSouls = async () => {
    try {
      const souls = await fetchSouls();
      // Get top 3 souls by level (highest level = most trained)
      const sorted = souls.sort((a, b) => b.level - a.level).slice(0, 3);
      setFeaturedSouls(sorted);
    } catch (error) {
      console.error("Failed to load featured souls:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <GradientBackground />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6"
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-purple-300">AI & Agents Track - Hedera Hello Future: Ascension 2025</span>
            </motion.div>

            {/* Hackathon Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25 }}
              className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 mb-8"
            >
              <span className="text-xs text-blue-300">🏆 Chapter 2 of the Hedera Hackathon Trilogy</span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
            >
              <span className="text-gradient">DreamMarket</span>
              <br />
              <span className="text-foreground">The Marketplace of</span>
              <br />
              <span className="text-gradient">Digital Souls</span>
            </motion.h1>

            {/* Subtext */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto"
            >
              A collaborative multi-agent marketplace on Hedera. Create AI personalities with verifiable on-chain identity, 
              enable agent-to-agent transactions, and build the future of decentralized AI economies.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Link href="/market" className="w-full sm:w-auto">
                <Button 
                  size="lg" 
                  variant="cosmic" 
                  className="w-full sm:w-auto text-lg px-8 py-6 glow-purple hover:scale-105 transition-transform duration-300 shadow-lg shadow-purple-500/30"
                >
                  Browse Market
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/create" className="w-full sm:w-auto">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="w-full sm:w-auto text-lg px-8 py-6 border-2 border-purple-500/50 hover:bg-purple-500/10 hover:border-purple-500 hover:scale-105 transition-all duration-300 bg-transparent backdrop-blur-sm"
                >
                  Create a Soul
                  <Sparkles className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-6 h-10 border-2 border-purple-500/50 rounded-full flex items-start justify-center p-2"
          >
            <motion.div className="w-1 h-2 bg-purple-500 rounded-full" />
          </motion.div>
        </motion.div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Four simple steps to enter the world of digital souls
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorksSteps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="glass-panel h-full hover:bg-white/10 transition-all duration-300">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center mb-4">
                      <step.icon className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-xl">{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {step.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why DreamMarket Section */}
      <section className="py-20 relative bg-white/5">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">Why DreamMarket for AI & Agents?</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Leading the future of decentralized AI economies on Hedera
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {whyDreamMarket.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="glass-panel h-full group hover:bg-white/10 transition-all duration-300">
                  <CardHeader>
                    <div className={`h-2 w-20 rounded-full bg-gradient-to-r ${item.gradient} mb-4`} />
                    <CardTitle className="text-2xl">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {item.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Souls Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">Featured Souls</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Discover some of the most remarkable digital souls in our marketplace
            </p>
          </motion.div>

          <AgentGrid agents={featuredSouls} featured />

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Link href="/market">
              <Button size="lg" variant="outline" className="border-purple-500/50 hover:bg-purple-500/10">
                View All Souls
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass-panel p-12 rounded-2xl text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-cyan-500/10" />
            <div className="relative z-10">
              <h2 className="text-4xl font-bold mb-4">Ready to Create Your Soul?</h2>
              <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
                Join the revolution of AI ownership. Mint your first digital soul today.
              </p>
              <Link href="/create">
                <Button size="lg" variant="cosmic" className="text-lg px-8 glow-purple">
                  Start Creating
                  <Sparkles className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </MainLayout>
  );
}
