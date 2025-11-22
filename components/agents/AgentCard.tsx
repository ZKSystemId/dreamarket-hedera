"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { SoulAgent } from "@/types/agent";
import { Card, CardContent } from "@/components/ui/card";
import { BadgeRarity } from "@/components/common/BadgeRarity";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAvatarGradient, getInitials, formatAddress, getRarityBorderColor } from "@/lib/utils";
import { Sparkles, TrendingUp, Coins, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface AgentCardProps {
  agent: SoulAgent;
  featured?: boolean;
}

// Calculate reputation based on level and XP
function calculateReputation(agent: SoulAgent): number {
  // Base reputation from level (max 60 points)
  const levelReputation = Math.min(60, (agent.level || 1) * 3);
  
  // Additional reputation from XP (max 40 points)
  // Scale XP to 0-40 range (assuming max XP around 20000)
  const xpReputation = Math.min(40, Math.floor((agent.xp || 0) / 500));
  
  // Total reputation (0-100)
  return Math.min(100, levelReputation + xpReputation);
}

export function AgentCard({ agent, featured = false }: AgentCardProps) {
  const displayReputation = calculateReputation(agent);
  const displayLevel = agent.level || 1;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      className="h-full"
    >
      <Link href={`/agents/${agent.id}`}>
        <Card
          className={cn(
            "h-full glass-panel-hover overflow-hidden group cursor-pointer border-2 transition-all duration-300",
            getRarityBorderColor(agent.rarity),
            featured && "ring-2 ring-purple-500/50"
          )}
        >
          <CardContent className="p-0">
            {/* Avatar Section */}
            <div className="relative h-48 overflow-hidden">
              {agent.avatarUrl ? (
                /* Custom Avatar */
                <img
                  src={agent.avatarUrl}
                  alt={agent.name}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              ) : (
                <>
                  {/* Gradient Background */}
                  <div
                    className={cn(
                      "absolute inset-0 bg-gradient-to-br opacity-80 group-hover:opacity-100 transition-opacity",
                      getAvatarGradient(agent.avatarSeed || agent.name)
                    )}
                  />
                  
                  {/* Initials */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-6xl font-bold text-white/90">
                      {getInitials(agent.name)}
                    </span>
                  </div>
                </>
              )}

              {/* Rarity Badge */}
              <div className="absolute top-3 right-3">
                <BadgeRarity rarity={agent.rarity} />
              </div>

              {/* Featured Badge */}
              {featured && (
                <div className="absolute top-3 left-3">
                  <Badge className="bg-purple-500/90 text-white border-0">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Featured
                  </Badge>
                </div>
              )}
            </div>

            {/* Content Section */}
            <div className="p-5 space-y-4">
              {/* Name & Tagline */}
              <div>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-foreground group-hover:text-purple-400 transition-colors truncate">
                      {agent.name}
                    </h3>
                  </div>
                  {/* Level Badge */}
                  <Badge variant="outline" className="bg-blue-500/20 border-blue-500/50 text-blue-400 shrink-0">
                    <Zap className="w-3 h-3 mr-1" />
                    Lv {displayLevel}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                  {agent.tagline}
                </p>
              </div>

              {/* Stats Row: Level, XP, Reputation */}
              <div className="grid grid-cols-2 gap-3">
                {/* Level & XP */}
                <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                  <div className="flex items-center gap-1 mb-1">
                    <Zap className="w-3 h-3 text-yellow-400" />
                    <span className="text-xs text-muted-foreground">Level</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold">{displayLevel}</span>
                    <span className="text-xs text-muted-foreground">({agent.xp || 0} XP)</span>
                  </div>
                </div>

                {/* Reputation */}
                <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                  <div className="flex items-center gap-1 mb-1">
                    <TrendingUp className="w-3 h-3 text-green-400" />
                    <span className="text-xs text-muted-foreground">Reputation</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold">{displayReputation}</span>
                    <span className="text-xs text-muted-foreground">/100</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mt-1">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all"
                      style={{ width: `${displayReputation}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div className="flex flex-wrap gap-1.5">
                {agent.skills.slice(0, 3).map((skill) => (
                  <Badge
                    key={skill}
                    variant="outline"
                    className="text-xs bg-white/5 border-white/10 text-muted-foreground"
                  >
                    {skill}
                  </Badge>
                ))}
                {agent.skills.length > 3 && (
                  <Badge
                    variant="outline"
                    className="text-xs bg-white/5 border-white/10 text-muted-foreground"
                  >
                    +{agent.skills.length - 3}
                  </Badge>
                )}
              </div>

              {/* Owner & Price */}
              <div className="pt-3 border-t border-white/10 space-y-2">
                {/* Owner */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Owner</span>
                  <span className="font-mono text-foreground">
                    {formatAddress(agent.owner)}
                  </span>
                </div>
                
                {/* Price Display */}
                {agent.isListed && agent.price !== undefined && (
                  <div className="flex items-center justify-between bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-lg px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <Coins className="w-4 h-4 text-purple-400" />
                      <span className="text-sm text-muted-foreground">Price</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xl font-bold text-purple-400">
                        {agent.price.toLocaleString()}
                      </span>
                      <span className="text-sm text-muted-foreground">HBAR</span>
                    </div>
                  </div>
                )}
              </div>

              {/* CTA Button */}
              <Button
                variant="cosmic"
                className="w-full group-hover:shadow-lg group-hover:shadow-purple-500/30 transition-all"
              >
                {agent.isListed ? 'Buy Now' : 'View Soul'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
