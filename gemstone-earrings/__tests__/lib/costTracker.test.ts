import { describe, it, expect } from 'vitest';
import { estimateOpenAICost, estimateGeminiCost, COST_CONFIG, AI_PRICING } from '@/lib/costTracker';

describe('costTracker', () => {
  describe('COST_CONFIG', () => {
    it('has a daily budget set', () => {
      expect(COST_CONFIG.dailyBudget).toBeGreaterThan(0);
    });

    it('warning threshold is less than daily budget', () => {
      expect(COST_CONFIG.warningThreshold).toBeLessThan(COST_CONFIG.dailyBudget);
    });
  });

  describe('estimateOpenAICost', () => {
    it('calculates GPT-4 cost correctly', () => {
      // 1000 tokens at $0.03 per 1K = $0.03
      expect(estimateOpenAICost(1000, 'gpt-4')).toBeCloseTo(0.03);
    });

    it('calculates GPT-3.5 cost correctly', () => {
      // 1000 tokens at $0.002 per 1K = $0.002
      expect(estimateOpenAICost(1000, 'gpt-3.5')).toBeCloseTo(0.002);
    });

    it('scales linearly with token count', () => {
      const cost1k = estimateOpenAICost(1000, 'gpt-4');
      const cost5k = estimateOpenAICost(5000, 'gpt-4');
      expect(cost5k).toBeCloseTo(cost1k * 5);
    });

    it('returns 0 for 0 tokens', () => {
      expect(estimateOpenAICost(0)).toBe(0);
    });

    it('defaults to gpt-4 pricing', () => {
      expect(estimateOpenAICost(1000)).toBeCloseTo(AI_PRICING.openai.gpt4);
    });
  });

  describe('estimateGeminiCost', () => {
    it('calculates character-based cost', () => {
      // 1000 characters at $0.00025 per 1K = $0.00025
      expect(estimateGeminiCost({ characters: 1000 })).toBeCloseTo(0.00025);
    });

    it('calculates image-based cost', () => {
      // 1 image at $0.0025 per image
      expect(estimateGeminiCost({ images: 1 })).toBeCloseTo(0.0025);
      expect(estimateGeminiCost({ images: 4 })).toBeCloseTo(0.01);
    });

    it('combines character and image costs', () => {
      const charCost = estimateGeminiCost({ characters: 1000 });
      const imgCost = estimateGeminiCost({ images: 2 });
      const combinedCost = estimateGeminiCost({ characters: 1000, images: 2 });
      expect(combinedCost).toBeCloseTo(charCost + imgCost);
    });

    it('returns 0 for no input', () => {
      expect(estimateGeminiCost({})).toBe(0);
    });
  });
});
