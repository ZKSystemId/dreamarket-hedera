"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { SoulAgent } from "@/types/agent";
import { TrendingUp, Clock, Sparkles, RefreshCw } from "lucide-react";
import { getXpProgress, getNextEvolutionMilestone, EXP_CONFIG, getRarityForLevel, getXpForNextLevel } from "@/services/expService";

interface EvolutionPanelProps {
  soul: SoulAgent;
  onEvolution: () => void;
}

export function EvolutionPanel({ soul, onEvolution }: EvolutionPanelProps) {
  // Calculate XP progress correctly using cumulative XP system
  const xpProgress = getXpProgress(soul.xp, soul.level);
  const xpPercentage = xpProgress * 100;
  
  // Get next evolution milestone
  const nextMilestone = getNextEvolutionMilestone(soul.level);
  
  // Calculate XP thresholds for current and next level using expService functions
  const currentLevelThreshold = EXP_CONFIG.LEVEL_THRESHOLDS[soul.level - 1] || 0;
  const nextLevelThreshold = getXpForNextLevel(soul.level);
  
  // XP within current level (for display)
  // For level 1, XP starts at 0, so xpInCurrentLevel = soul.xp
  const xpInCurrentLevel = Math.max(0, soul.xp - currentLevelThreshold);
  const xpNeededForCurrentLevel = nextLevelThreshold - currentLevelThreshold;
  const xpNeededForNextLevel = Math.max(0, nextLevelThreshold - soul.xp);
  
  // Check expected rarity based on level (should match soul.rarity)
  const expectedRarity = getRarityForLevel(soul.level);

  // Debug logging
  console.log(`🔍 [EvolutionPanel] Soul: ${soul.name}, Level: ${soul.level}, XP: ${soul.xp}, Rarity: ${soul.rarity}`);
  console.log(`   XP Progress: ${(xpPercentage * 100).toFixed(1)}%, XP in level: ${xpInCurrentLevel}/${xpNeededForCurrentLevel}`);

  return (
    <Card className="glass-panel border-purple-500/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Sparkles className="w-5 h-5 mr-2 text-purple-400" />
            Soul Evolution
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onEvolution}
            className="text-purple-400 hover:text-purple-300"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
        <CardDescription>
          Chat with your soul to gain XP and evolve to higher rarities
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Level & XP Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <span className="font-semibold">Level {soul.level}</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {xpInCurrentLevel} / {xpNeededForCurrentLevel} XP ({(xpPercentage).toFixed(1)}%)
            </span>
          </div>
          <Progress value={xpPercentage} className="h-3" />
          <p className="text-xs text-muted-foreground mt-1">
            {xpNeededForNextLevel > 0 ? (
              <>
                Total: {soul.xp} XP • {xpNeededForNextLevel} XP needed for Level {soul.level + 1}
              </>
            ) : (
              'Max level reached!'
            )}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-yellow-400" />
              <span className="text-xs text-muted-foreground">Total XP</span>
            </div>
            <p className="text-lg font-bold">{soul.xp}</p>
          </div>

          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span className="text-xs text-muted-foreground">Training Time</span>
            </div>
            <p className="text-lg font-bold">{soul.totalTrainingTime} min</p>
          </div>
        </div>

        {/* Evolution Path */}
        <div>
          <h4 className="text-sm font-semibold mb-3">Evolution Path</h4>
          <div className="flex items-center justify-between">
            <Badge 
              variant={expectedRarity === "Common" ? "default" : "outline"} 
              className={expectedRarity === "Common" ? "bg-gray-500/20 border-gray-500/50" : "bg-gray-500/10 border-gray-500/20"}
            >
              Common (Lv 1-5)
            </Badge>
            <div className="h-px flex-1 mx-2 bg-gradient-to-r from-gray-500 to-blue-500" />
            <Badge 
              variant={expectedRarity === "Rare" ? "default" : "outline"} 
              className={expectedRarity === "Rare" ? "bg-blue-500/20 border-blue-500/50" : "bg-blue-500/10 border-blue-500/20"}
            >
              Rare (Lv 6-14)
            </Badge>
            <div className="h-px flex-1 mx-2 bg-gradient-to-r from-blue-500 to-purple-500" />
            <Badge 
              variant={expectedRarity === "Legendary" ? "default" : "outline"} 
              className={expectedRarity === "Legendary" ? "bg-purple-500/20 border-purple-500/50" : "bg-purple-500/10 border-purple-500/20"}
            >
              Legendary (Lv 15-19)
            </Badge>
            <div className="h-px flex-1 mx-2 bg-gradient-to-r from-purple-500 to-pink-500" />
            <Badge 
              variant={expectedRarity === "Mythic" ? "default" : "outline"} 
              className={expectedRarity === "Mythic" ? "bg-pink-500/20 border-pink-500/50" : "bg-pink-500/10 border-pink-500/20"}
            >
              Mythic (Lv 20+)
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Current: <span className="font-semibold text-purple-400">{soul.rarity}</span> (Level {soul.level})
          </p>
        </div>

        {/* Next Evolution */}
        {nextMilestone && (
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
            <p className="text-sm text-purple-300 mb-2">
              <strong>Next Evolution:</strong>
            </p>
            <p className="text-xs text-muted-foreground">
              Reach level {nextMilestone.level} to evolve to {nextMilestone.rarity}
              {nextMilestone.xpRequired > soul.xp && (
                <span className="block mt-1">({nextMilestone.xpRequired - soul.xp} XP needed)</span>
              )}
            </p>
          </div>
        )}

        <p className="text-xs text-center text-muted-foreground">
          💡 Chat with your soul to gain XP and level up!
        </p>
      </CardContent>
    </Card>
  );
}
