/**
 * Validation Utilities
 * Runtime validation helpers
 */

import { Rarity, RARITY_VALUES } from '../types';

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Validate Hedera wallet address format
 */
export const isValidWalletAddress = (address: string): boolean => {
  // Hedera account format: 0.0.xxxxx
  const hederaAccountRegex = /^0\.0\.\d+$/;
  // Ethereum-style address (for EVM compatibility)
  const evmAddressRegex = /^0x[a-fA-F0-9]{40}$/;

  return hederaAccountRegex.test(address) || evmAddressRegex.test(address);
};

/**
 * Validate rarity value
 */
export const isValidRarity = (rarity: string): rarity is Rarity => {
  return RARITY_VALUES.includes(rarity as Rarity);
};

/**
 * Validate reputation score (0-100)
 */
export const isValidReputation = (score: number): boolean => {
  return Number.isInteger(score) && score >= 0 && score <= 100;
};

/**
 * Validate skill array
 */
export const isValidSkills = (skills: any): skills is string[] => {
  return (
    Array.isArray(skills) &&
    skills.length > 0 &&
    skills.length <= 10 &&
    skills.every((skill) => typeof skill === 'string' && skill.length > 0 && skill.length <= 50)
  );
};

/**
 * Validate soul name
 */
export const isValidSoulName = (name: string): boolean => {
  return name.length >= 2 && name.length <= 50;
};

/**
 * Validate tagline
 */
export const isValidTagline = (tagline: string): boolean => {
  return tagline.length >= 5 && tagline.length <= 100;
};

/**
 * Sanitize string input
 */
export const sanitizeString = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

/**
 * Validate pagination params
 */
export const validatePagination = (limit?: number, offset?: number) => {
  const validatedLimit = limit && limit > 0 && limit <= 100 ? limit : 20;
  const validatedOffset = offset && offset >= 0 ? offset : 0;

  return { limit: validatedLimit, offset: validatedOffset };
};
