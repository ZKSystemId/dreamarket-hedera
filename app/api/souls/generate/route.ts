/**
 * Soul Blueprint Generation API
 * POST /api/souls/generate
 * 
 * Generates coherent soul personality from inspiration prompt
 */

import { NextRequest, NextResponse } from "next/server";
import { 
  generateSoulBlueprint,
  blueprintToSoulInput,
  EXAMPLE_BLUEPRINTS 
} from "@/services/soulBlueprintService";
import { SoulCreationRequest } from "@/types/agent";

export async function POST(request: NextRequest) {
  try {
    const body: SoulCreationRequest = await request.json();
    
    const {
      inspirationPrompt,
      language = "English",
      autoGenerate = true,
      constraints = {}
    } = body;

    if (!inspirationPrompt || inspirationPrompt.trim().length === 0) {
      return NextResponse.json(
        { error: "Inspiration prompt is required" },
        { status: 400 }
      );
    }

    console.log(`🎨 Generating soul from prompt: "${inspirationPrompt}"`);

    // Generate blueprint using AI
    const blueprint = await generateSoulBlueprint({
      inspirationPrompt,
      language,
      autoGenerate,
      constraints
    });

    // Convert to soul input format
    const soulInput = blueprintToSoulInput(blueprint);

    return NextResponse.json({
      success: true,
      data: {
        blueprint,
        soulInput,
        message: "Soul blueprint generated successfully"
      }
    });

  } catch (error) {
    console.error("❌ Blueprint generation error:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: "GENERATION_ERROR",
        message: error instanceof Error ? error.message : "Failed to generate soul blueprint"
      },
      { status: 500 }
    );
  }
}

// GET endpoint to get example prompts
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    data: {
      examples: EXAMPLE_BLUEPRINTS,
      domains: [
        "Writer",
        "Mentor",
        "Hacker",
        "Philosopher",
        "Artist",
        "Scientist"
      ],
      languages: [
        "English",
        "Indonesian",
        "Spanish",
        "French",
        "Japanese"
      ]
    }
  });
}
