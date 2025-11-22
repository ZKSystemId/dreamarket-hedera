/**
 * Soul Service
 * Orchestrates business logic for soul operations
 * Coordinates between database, Hedera, and AI services
 */

import { PrismaClient, Rarity, SoulEventType } from '@prisma/client';
import prisma from '@/lib/prisma';
import { hederaService } from './hederaService';
import { aiService } from './aiService';
import {
  Soul,
  SoulSummary,
  SoulDetailResponse,
  CreateSoulRequest,
  CreateSoulResponse,
  UpdateSoulRequest,
  CreateInteractionRequest,
  CreateInteractionResponse,
  UpdateReputationRequest,
  FuseSoulsRequest,
  FusionResponse,
  GetSoulsQuery,
  PaginatedResponse,
  GetInteractionsQuery,
  SoulInteraction,
  TransferSoulRequest,
} from '../types';


export class SoulService {
  /**
   * Get paginated list of souls with filtering and sorting
   */
  async getSouls(query: GetSoulsQuery): Promise<PaginatedResponse<SoulSummary>> {
    const {
      search,
      rarity,
      skills,
      sort = 'newest',
      limit = 20,
      offset = 0,
      isListed,
      owner,
    } = query;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { tagline: { contains: search, mode: 'insensitive' } },
        { personality: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (rarity) {
      where.rarity = rarity;
    }

    if (skills) {
      const skillArray = skills.split(',').map((s) => s.trim());
      where.skills = { hasSome: skillArray };
    }

    if (isListed !== undefined) {
      where.isListed = isListed;
    }

    if (owner) {
      where.owner = { walletAddress: owner };
    }

    // Build orderBy clause
    let orderBy: any = {};
    switch (sort) {
      case 'reputation':
        orderBy = { reputation: 'desc' };
        break;
      case 'mostTraded':
        orderBy = { totalOwners: 'desc' };
        break;
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' };
        break;
    }

    // Execute query
    const [souls, total] = await Promise.all([
      prisma.soul.findMany({
        where,
        orderBy,
        take: limit,
        skip: offset,
        include: {
          owner: {
            select: {
              walletAddress: true,
              displayName: true,
            },
          },
        },
      }),
      prisma.soul.count({ where }),
    ]);

    // Map to SoulSummary
    const data: SoulSummary[] = souls.map((soul) => ({
      id: soul.id,
      name: soul.name,
      tagline: soul.tagline,
      rarity: soul.rarity as Rarity,
      avatarSeed: soul.avatarSeed || undefined,
      reputation: soul.reputation,
      owner: soul.owner.walletAddress,
      tokenId: soul.tokenId || undefined,
      skills: soul.skills,
      isListed: soul.isListed,
      listingPrice: soul.listingPrice || undefined,
      createdAt: soul.createdAt.toISOString(),
    }));

    return {
      data,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  }

  /**
   * Get detailed soul information by ID
   */
  async getSoulById(id: string): Promise<SoulDetailResponse> {
    const soul = await prisma.soul.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            walletAddress: true,
            displayName: true,
          },
        },
        events: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!soul) {
      throw new Error('Soul not found');
    }

    // Map to Soul type
    const soulData: Soul = {
      id: soul.id,
      name: soul.name,
      tagline: soul.tagline,
      rarity: soul.rarity as Rarity,
      avatarSeed: soul.avatarSeed || undefined,
      personality: soul.personality,
      skills: soul.skills,
      creationStory: soul.creationStory,
      reputation: soul.reputation,
      owner: soul.owner.walletAddress,
      tokenId: soul.tokenId || undefined,
      creationTxHash: soul.creationTxHash || undefined,
      lastUpdateTxHash: soul.lastUpdateTxHash || undefined,
      createdAt: soul.createdAt.toISOString(),
      updatedAt: soul.updatedAt.toISOString(),
    };

    return {
      soul: soulData,
      events: soul.events.map((e) => ({
        id: e.id,
        type: e.type as SoulEventType,
        description: e.description,
        timestamp: e.createdAt.toISOString(),
        txHash: e.txHash || undefined,
        metadata: e.metadata as Record<string, any> | undefined,
      })),
      stats: {
        totalInteractions: soul.totalInteractions,
        totalOwners: soul.totalOwners,
        lastActiveAt: soul.lastActiveAt.toISOString(),
      },
    };
  }

  /**
   * Create (mint) a new soul
   */
  async createSoul(request: CreateSoulRequest): Promise<CreateSoulResponse> {
    // 1. Find or create user
    let user = await prisma.user.findUnique({
      where: { walletAddress: request.ownerWallet },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          walletAddress: request.ownerWallet,
        },
      });
    }

    // 2. Generate personality if needed
    let personality = request.personality || '';
    let creationStory = request.creationStory || '';
    let skills = request.skills || [];

    if (request.autoGeneratePersonality || request.inspirationPrompt) {
      const prompt = request.inspirationPrompt || `A ${request.rarity} soul named ${request.name}`;
      const aiResult = await aiService.generatePersonalityFromPrompt({
        prompt,
        rarity: request.rarity,
        skills: request.skills,
      });

      personality = aiResult.personality;
      creationStory = aiResult.creationStory;
      skills = aiResult.suggestedSkills;
    }

    // 3. Mint NFT on Hedera
    const hederaResult = await hederaService.mintSoulIdentity({
      name: request.name,
      ownerWallet: request.ownerWallet,
      rarity: request.rarity,
      metadata: {
        tagline: request.tagline,
        personality,
        skills,
      },
    });

    // 4. Create soul in database
    const soul = await prisma.soul.create({
      data: {
        name: request.name,
        tagline: request.tagline,
        rarity: request.rarity,
        personality,
        skills,
        creationStory,
        ownerId: user.id,
        tokenId: hederaResult.tokenId,
        creationTxHash: hederaResult.txHash,
        avatarSeed: this.generateAvatarSeed(),
      },
      include: {
        owner: {
          select: {
            walletAddress: true,
          },
        },
      },
    });

    // 5. Create MINTED event
    await prisma.soulEvent.create({
      data: {
        soulId: soul.id,
        type: 'MINTED',
        description: `Soul "${soul.name}" was minted as a ${soul.rarity} entity`,
        txHash: hederaResult.txHash,
      },
    });

    // 6. Map and return
    const soulData: Soul = {
      id: soul.id,
      name: soul.name,
      tagline: soul.tagline,
      rarity: soul.rarity as Rarity,
      avatarSeed: soul.avatarSeed || undefined,
      personality: soul.personality,
      skills: soul.skills,
      creationStory: soul.creationStory,
      reputation: soul.reputation,
      owner: soul.owner.walletAddress,
      tokenId: soul.tokenId || undefined,
      creationTxHash: soul.creationTxHash || undefined,
      lastUpdateTxHash: soul.lastUpdateTxHash || undefined,
      createdAt: soul.createdAt.toISOString(),
      updatedAt: soul.updatedAt.toISOString(),
    };

    return {
      soul: soulData,
      hedera: {
        tokenId: hederaResult.tokenId,
        creationTxHash: hederaResult.txHash,
      },
    };
  }

  /**
   * Update soul information
   */
  async updateSoul(id: string, request: UpdateSoulRequest): Promise<Soul> {
    const soul = await prisma.soul.update({
      where: { id },
      data: {
        ...request,
        updatedAt: new Date(),
      },
      include: {
        owner: {
          select: {
            walletAddress: true,
          },
        },
      },
    });

    // Create update event
    await prisma.soulEvent.create({
      data: {
        soulId: soul.id,
        type: 'OTHER',
        description: 'Soul information updated',
      },
    });

    return this.mapSoulToType(soul);
  }

  /**
   * Record interactions with a soul
   */
  async createInteraction(
    soulId: string,
    request: CreateInteractionRequest
  ): Promise<CreateInteractionResponse> {
    // Find user if wallet provided
    let userId: string | undefined;
    if (request.userWallet) {
      let user = await prisma.user.findUnique({
        where: { walletAddress: request.userWallet },
      });

      if (!user) {
        user = await prisma.user.create({
          data: { walletAddress: request.userWallet },
        });
      }

      userId = user.id;
    }

    // Save interactions
    const interactions = await Promise.all(
      request.messages.map((msg) =>
        prisma.soulInteraction.create({
          data: {
            soulId,
            userId,
            role: msg.role === 'user' ? 'USER' : 'SOUL',
            content: msg.content,
          },
        })
      )
    );

    // Update soul stats
    await prisma.soul.update({
      where: { id: soulId },
      data: {
        totalInteractions: { increment: interactions.length },
        lastActiveAt: new Date(),
      },
    });

    // Log to HCS if requested
    let onChainReference: string | undefined;
    if (request.persistOnChain) {
      const hash = this.generateInteractionHash(interactions);
      const hcsResult = await hederaService.logInteractionHash({
        soulId,
        hash,
      });
      onChainReference = hcsResult.messageId;

      // Update interactions with HCS reference
      await Promise.all(
        interactions.map((interaction) =>
          prisma.soulInteraction.update({
            where: { id: interaction.id },
            data: {
              hashOnChain: hcsResult.messageId,
              topicId: hcsResult.topicId,
            },
          })
        )
      );
    }

    const totalInteractions = await prisma.soulInteraction.count({
      where: { soulId },
    });

    return {
      success: true,
      interactionCount: totalInteractions,
      onChainReference,
    };
  }

  /**
   * Get interactions for a soul
   */
  async getInteractions(
    soulId: string,
    query: GetInteractionsQuery
  ): Promise<PaginatedResponse<SoulInteraction>> {
    const { limit = 50, offset = 0, role } = query;

    const where: any = { soulId };
    if (role) {
      where.role = role;
    }

    const [interactions, total] = await Promise.all([
      prisma.soulInteraction.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        take: limit,
        skip: offset,
      }),
      prisma.soulInteraction.count({ where }),
    ]);

    const data: SoulInteraction[] = interactions.map((i) => ({
      id: i.id,
      role: i.role,
      content: i.content,
      timestamp: i.createdAt.toISOString(),
      hashOnChain: i.hashOnChain || undefined,
    }));

    return {
      data,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  }

  /**
   * Update soul reputation
   */
  async updateReputation(id: string, request: UpdateReputationRequest): Promise<Soul> {
    const soul = await prisma.soul.findUnique({ where: { id } });
    if (!soul) {
      throw new Error('Soul not found');
    }

    let newScore = soul.reputation;

    if (request.newScore !== undefined) {
      newScore = Math.max(0, Math.min(100, request.newScore));
    } else if (request.delta !== undefined) {
      newScore = Math.max(0, Math.min(100, soul.reputation + request.delta));
    }

    const updatedSoul = await prisma.soul.update({
      where: { id },
      data: { reputation: newScore },
      include: {
        owner: {
          select: {
            walletAddress: true,
          },
        },
      },
    });

    // Create reputation event
    await prisma.soulEvent.create({
      data: {
        soulId: id,
        type: 'REPUTATION_UPDATED',
        description: request.reason || `Reputation updated from ${soul.reputation} to ${newScore}`,
        metadata: {
          oldScore: soul.reputation,
          newScore,
          delta: newScore - soul.reputation,
        },
      },
    });

    return this.mapSoulToType(updatedSoul);
  }

  /**
   * Fuse two souls into a new one
   */
  async fuseSouls(request: FuseSoulsRequest): Promise<FusionResponse> {
    // Get parent souls
    const [parentA, parentB] = await Promise.all([
      prisma.soul.findUnique({ where: { id: request.parentAId } }),
      prisma.soul.findUnique({ where: { id: request.parentBId } }),
    ]);

    if (!parentA || !parentB) {
      throw new Error('Parent soul(s) not found');
    }

    // Generate fusion traits using AI
    const fusionTraits = await aiService.suggestFusionTraits(
      this.mapSoulToType(parentA as any),
      this.mapSoulToType(parentB as any)
    );

    // Determine child rarity (higher of parents or upgrade)
    const childRarity = this.determineFusionRarity(parentA.rarity as Rarity, parentB.rarity as Rarity);

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { walletAddress: request.ownerWallet },
    });

    if (!user) {
      user = await prisma.user.create({
        data: { walletAddress: request.ownerWallet },
      });
    }

    // Mint child soul NFT
    const hederaResult = await hederaService.mintSoulIdentity({
      name: `${parentA.name} × ${parentB.name}`,
      ownerWallet: request.ownerWallet,
      rarity: childRarity,
      metadata: {
        fusion: true,
        parents: [parentA.id, parentB.id],
      },
    });

    // Create child soul
    const childSoul = await prisma.soul.create({
      data: {
        name: `${parentA.name} × ${parentB.name}`,
        tagline: `Fusion of ${parentA.rarity} and ${parentB.rarity} souls`,
        rarity: childRarity,
        personality: fusionTraits.personality,
        skills: fusionTraits.skills,
        creationStory: fusionTraits.creationStory,
        ownerId: user.id,
        tokenId: hederaResult.tokenId,
        creationTxHash: hederaResult.txHash,
        avatarSeed: this.generateAvatarSeed(),
        reputation: Math.floor((parentA.reputation + parentB.reputation) / 2),
      },
      include: {
        owner: {
          select: {
            walletAddress: true,
          },
        },
      },
    });

    // Create fusion record
    const fusion = await prisma.fusion.create({
      data: {
        childSoulId: childSoul.id,
        parentSoulAId: parentA.id,
        parentSoulBId: parentB.id,
        creatorId: user.id,
        fusionTxHash: hederaResult.txHash,
        fusionFormula: request.fusionFormula,
        inheritedTraits: {
          fromParentA: parentA.skills.slice(0, 2),
          fromParentB: parentB.skills.slice(0, 2),
        },
      },
    });

    // Create events
    await Promise.all([
      prisma.soulEvent.create({
        data: {
          soulId: childSoul.id,
          type: 'FUSED',
          description: `Born from fusion of ${parentA.name} and ${parentB.name}`,
          txHash: hederaResult.txHash,
        },
      }),
      prisma.soulEvent.create({
        data: {
          soulId: parentA.id,
          type: 'FUSED',
          description: `Fused with ${parentB.name} to create ${childSoul.name}`,
        },
      }),
      prisma.soulEvent.create({
        data: {
          soulId: parentB.id,
          type: 'FUSED',
          description: `Fused with ${parentA.name} to create ${childSoul.name}`,
        },
      }),
    ]);

    return {
      childSoul: this.mapSoulToType(childSoul),
      fusion: {
        id: fusion.id,
        parentAId: parentA.id,
        parentBId: parentB.id,
        fusionTxHash: hederaResult.txHash,
        inheritedTraits: fusion.inheritedTraits as Record<string, any>,
      },
    };
  }

  /**
   * Transfer soul to another wallet
   */
  async transferSoul(id: string, request: TransferSoulRequest): Promise<Soul> {
    const soul = await prisma.soul.findUnique({ where: { id } });
    if (!soul || !soul.tokenId) {
      throw new Error('Soul not found or not minted');
    }

    // Transfer on Hedera
    const hederaResult = await hederaService.transferSoul({
      soulId: id,
      tokenId: soul.tokenId,
      fromWallet: request.fromWallet,
      toWallet: request.toWallet,
    });

    // Find or create new owner
    let newOwner = await prisma.user.findUnique({
      where: { walletAddress: request.toWallet },
    });

    if (!newOwner) {
      newOwner = await prisma.user.create({
        data: { walletAddress: request.toWallet },
      });
    }

    // Update soul
    const updatedSoul = await prisma.soul.update({
      where: { id },
      data: {
        ownerId: newOwner.id,
        totalOwners: { increment: 1 },
        lastUpdateTxHash: hederaResult.txHash,
      },
      include: {
        owner: {
          select: {
            walletAddress: true,
          },
        },
      },
    });

    // Create transfer event
    await prisma.soulEvent.create({
      data: {
        soulId: id,
        type: 'TRANSFERRED',
        description: `Transferred from ${request.fromWallet} to ${request.toWallet}`,
        txHash: hederaResult.txHash,
      },
    });

    return this.mapSoulToType(updatedSoul);
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private mapSoulToType(soul: any): Soul {
    return {
      id: soul.id,
      name: soul.name,
      tagline: soul.tagline,
      rarity: soul.rarity as Rarity,
      avatarSeed: soul.avatarSeed || undefined,
      personality: soul.personality,
      skills: soul.skills,
      creationStory: soul.creationStory,
      reputation: soul.reputation,
      owner: soul.owner.walletAddress,
      tokenId: soul.tokenId || undefined,
      creationTxHash: soul.creationTxHash || undefined,
      lastUpdateTxHash: soul.lastUpdateTxHash || undefined,
      createdAt: soul.createdAt.toISOString(),
      updatedAt: soul.updatedAt.toISOString(),
    };
  }

  private generateAvatarSeed(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  private generateInteractionHash(interactions: any[]): string {
    const content = interactions.map((i) => i.content).join('|');
    return Buffer.from(content).toString('base64').substring(0, 32);
  }

  private determineFusionRarity(rarityA: Rarity, rarityB: Rarity): Rarity {
    const rarityOrder: Rarity[] = ['Common', 'Rare', 'Legendary', 'Mythic'];
    const indexA = rarityOrder.indexOf(rarityA);
    const indexB = rarityOrder.indexOf(rarityB);
    const maxIndex = Math.max(indexA, indexB);

    // Chance to upgrade rarity
    if (Math.random() > 0.7 && maxIndex < rarityOrder.length - 1) {
      return rarityOrder[maxIndex + 1];
    }

    return rarityOrder[maxIndex];
  }
}

/**
 * Singleton instance
 */
export const soulService = new SoulService();
