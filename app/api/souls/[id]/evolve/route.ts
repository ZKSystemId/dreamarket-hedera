/**
 * Soul Evolution API Endpoint
 * POST /api/souls/:id/evolve
 * 
 * Triggers AI-powered personality evolution for a soul
 */

import { NextRequest, NextResponse } from "next/server";
import { 
  evolveSoulPersonality, 
  shouldSoulEvolve, 
  getNextRarity,
  extractUserInsights 
} from "@/services/aiPersonalityService";
import { fetchSoulByIdFromDB, updateSoulEvolution } from "@/lib/supabaseClient";
import { EvolutionParams } from "@/types/agent";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const soulId = params.id;

    // Fetch soul from database
    const soul = await fetchSoulByIdFromDB(soulId);
    if (!soul) {
      return NextResponse.json(
        { error: "Soul not found" },
        { status: 404 }
      );
    }

    // Check if evolution is allowed
    if (!shouldSoulEvolve(soul)) {
      return NextResponse.json(
        { 
          error: "Soul is not ready to evolve",
          currentLevel: soul.level,
          currentRarity: soul.rarity,
          message: "Soul needs to reach the next evolution milestone"
        },
        { status: 400 }
      );
    }

    // Get next rarity
    const nextRarity = getNextRarity(soul.rarity);
    if (!nextRarity) {
      return NextResponse.json(
        { error: "Soul is already at maximum rarity" },
        { status: 400 }
      );
    }

    // Parse request body for optional parameters
    const body = await request.json().catch(() => ({}));
    const { reason, userInsights: providedInsights } = body;

    // Extract insights from chat history if not provided
    // TODO: Fetch actual chat messages from database
    const chatMessages: any[] = []; // Placeholder
    const userInsights = providedInsights || extractUserInsights(chatMessages);

    // Build evolution parameters
    const evolutionParams: EvolutionParams = {
      previousLevel: soul.level,
      newLevel: soul.level, // Level stays same, only rarity changes
      previousRarity: soul.rarity,
      newRarity: nextRarity,
      reason: reason || `Reached level ${soul.level} milestone, ready for ${nextRarity} evolution`,
      userInsights
    };

    console.log(`🧬 Starting evolution for ${soul.name}:`, evolutionParams);

    // Call AI evolution service
    const evolutionResult = await evolveSoulPersonality(soul, evolutionParams);

    // Update soul in database
    const updatedSoul = await updateSoulEvolution(soulId, {
      rarity: nextRarity,
      personality: evolutionResult.updatedPersonality,
      tagline: evolutionResult.updatedTagline || soul.tagline,
      skills: evolutionResult.updatedSkills || soul.skills,
      evolutionSummary: evolutionResult.evolutionSummary
    });

    console.log(`✅ Evolution complete for ${soul.name}`);

    // Return success response
    return NextResponse.json({
      success: true,
      soul: updatedSoul,
      evolution: {
        from: soul.rarity,
        to: nextRarity,
        summary: evolutionResult.evolutionSummary,
        changes: {
          personality: evolutionResult.updatedPersonality !== soul.personality,
          tagline: evolutionResult.updatedTagline !== soul.tagline,
          skills: JSON.stringify(evolutionResult.updatedSkills) !== JSON.stringify(soul.skills)
        }
      }
    });

  } catch (error) {
    console.error("❌ Evolution API error:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to evolve soul",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check evolution eligibility
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const soulId = params.id;

    // Fetch soul from database
    const soul = await fetchSoulByIdFromDB(soulId);
    if (!soul) {
      return NextResponse.json(
        { error: "Soul not found" },
        { status: 404 }
      );
    }

    // Check evolution eligibility
    const canEvolve = shouldSoulEvolve(soul);
    const nextRarity = getNextRarity(soul.rarity);

    return NextResponse.json({
      canEvolve,
      currentRarity: soul.rarity,
      currentLevel: soul.level,
      nextRarity,
      message: canEvolve 
        ? `Soul is ready to evolve to ${nextRarity}!`
        : `Soul needs more experience to evolve`
    });

  } catch (error) {
    console.error("❌ Evolution check error:", error);
    
    return NextResponse.json(
      { error: "Failed to check evolution status" },
      { status: 500 }
    );
  }
}
