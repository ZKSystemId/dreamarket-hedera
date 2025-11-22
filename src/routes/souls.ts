/**
 * Soul Routes
 * API endpoints for soul operations
 */

import { Router, Request, Response, NextFunction } from 'express';
import { soulService } from '../services/soulService';
import {
  GetSoulsQuery,
  CreateSoulRequest,
  UpdateSoulRequest,
  CreateInteractionRequest,
  UpdateReputationRequest,
  FuseSoulsRequest,
  TransferSoulRequest,
  GetInteractionsQuery,
  ApiResponse,
  Rarity,
} from '../types';

const router = Router();

// ============================================================================
// GET /api/souls - Get paginated list of souls
// ============================================================================

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query: GetSoulsQuery = {
      search: req.query.search as string,
      rarity: req.query.rarity as Rarity,
      skills: req.query.skills as string,
      sort: req.query.sort as 'newest' | 'reputation' | 'mostTraded',
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
      isListed: req.query.isListed ? req.query.isListed === 'true' : undefined,
      owner: req.query.owner as string,
    };

    const result = await soulService.getSouls(query);

    const response: ApiResponse = {
      success: true,
      data: result,
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// GET /api/souls/:id - Get soul details
// ============================================================================

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await soulService.getSoulById(id);

    const response: ApiResponse = {
      success: true,
      data: result,
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// POST /api/souls - Create (mint) a new soul
// ============================================================================

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const createRequest: CreateSoulRequest = {
      name: req.body.name,
      tagline: req.body.tagline,
      rarity: req.body.rarity,
      personality: req.body.personality,
      skills: req.body.skills,
      creationStory: req.body.creationStory,
      inspirationPrompt: req.body.inspirationPrompt,
      ownerWallet: req.body.ownerWallet,
      autoGeneratePersonality: req.body.autoGeneratePersonality,
    };

    // Basic validation
    if (!createRequest.name || !createRequest.tagline || !createRequest.ownerWallet) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields: name, tagline, ownerWallet',
        },
      });
    }

    const result = await soulService.createSoul(createRequest);

    const response: ApiResponse = {
      success: true,
      data: result,
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// PATCH /api/souls/:id - Update soul information
// ============================================================================

router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updateRequest: UpdateSoulRequest = {
      name: req.body.name,
      tagline: req.body.tagline,
      personality: req.body.personality,
      skills: req.body.skills,
      creationStory: req.body.creationStory,
    };

    const result = await soulService.updateSoul(id, updateRequest);

    const response: ApiResponse = {
      success: true,
      data: result,
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// POST /api/souls/:id/interactions - Record interaction with soul
// ============================================================================

router.post('/:id/interactions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const interactionRequest: CreateInteractionRequest = {
      userWallet: req.body.userWallet,
      messages: req.body.messages,
      persistOnChain: req.body.persistOnChain,
    };

    // Validation
    if (!interactionRequest.messages || !Array.isArray(interactionRequest.messages)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'messages must be an array',
        },
      });
    }

    const result = await soulService.createInteraction(id, interactionRequest);

    const response: ApiResponse = {
      success: true,
      data: result,
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// GET /api/souls/:id/interactions - Get soul interactions
// ============================================================================

router.get('/:id/interactions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const query: GetInteractionsQuery = {
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
      role: req.query.role as any,
    };

    const result = await soulService.getInteractions(id, query);

    const response: ApiResponse = {
      success: true,
      data: result,
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// POST /api/souls/:id/reputation - Update soul reputation
// ============================================================================

router.post('/:id/reputation', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const reputationRequest: UpdateReputationRequest = {
      delta: req.body.delta,
      newScore: req.body.newScore,
      reason: req.body.reason,
    };

    const result = await soulService.updateReputation(id, reputationRequest);

    const response: ApiResponse = {
      success: true,
      data: result,
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// POST /api/souls/:id/transfer - Transfer soul to another wallet
// ============================================================================

router.post('/:id/transfer', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const transferRequest: TransferSoulRequest = {
      fromWallet: req.body.fromWallet,
      toWallet: req.body.toWallet,
    };

    // Validation
    if (!transferRequest.fromWallet || !transferRequest.toWallet) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields: fromWallet, toWallet',
        },
      });
    }

    const result = await soulService.transferSoul(id, transferRequest);

    const response: ApiResponse = {
      success: true,
      data: result,
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// POST /api/souls/fuse - Fuse two souls into a new one
// ============================================================================

router.post('/fuse', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const fuseRequest: FuseSoulsRequest = {
      parentAId: req.body.parentAId,
      parentBId: req.body.parentBId,
      ownerWallet: req.body.ownerWallet,
      fusionFormula: req.body.fusionFormula,
    };

    // Validation
    if (!fuseRequest.parentAId || !fuseRequest.parentBId || !fuseRequest.ownerWallet) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields: parentAId, parentBId, ownerWallet',
        },
      });
    }

    const result = await soulService.fuseSouls(fuseRequest);

    const response: ApiResponse = {
      success: true,
      data: result,
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

export default router;
