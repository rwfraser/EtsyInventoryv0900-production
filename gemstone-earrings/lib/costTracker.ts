import { Redis } from '@upstash/redis';
import { Resend } from 'resend';

// Lazy-loaded Redis client to prevent build failures without env vars
// Required: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
let redis: Redis | null = null;

function getRedisClient(): Redis {
  if (!redis) {
    // Check if environment variables are set
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      throw new Error(
        'Upstash Redis not configured. Please set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables.'
      );
    }
    redis = Redis.fromEnv();
  }
  return redis;
}

// Cost configuration
export const COST_CONFIG = {
  dailyBudget: 20.0, // $20 per day
  warningThreshold: 15.0, // Send alert at $15
  alertEmail: 'rojer@myearringdepot.com',
} as const;

// AI service pricing (approximate costs per 1K tokens/requests)
export const AI_PRICING = {
  openai: {
    gpt4: 0.03, // GPT-4 per 1K tokens
    gpt35: 0.002, // GPT-3.5 per 1K tokens
  },
  gemini: {
    pro: 0.00025, // Gemini Pro per 1K characters
    proVision: 0.0025, // Gemini Pro Vision per image
  },
} as const;

interface CostEntry {
  timestamp: number;
  service: 'openai' | 'gemini';
  endpoint: string;
  userId: string;
  tokens?: number;
  images?: number;
  cost: number;
}

/**
 * Get the Redis key for today's costs
 */
function getTodayKey(): string {
  const today = new Date().toISOString().split('T')[0];
  return `costs:daily:${today}`;
}

/**
 * Track AI API usage and cost
 */
export async function trackCost(params: {
  service: 'openai' | 'gemini';
  endpoint: string;
  userId: string;
  tokens?: number;
  images?: number;
  estimatedCost: number;
}): Promise<{ dailyTotal: number; budgetRemaining: number }> {
  const key = getTodayKey();
  const entry: CostEntry = {
    timestamp: Date.now(),
    service: params.service,
    endpoint: params.endpoint,
    userId: params.userId,
    tokens: params.tokens,
    images: params.images,
    cost: params.estimatedCost,
  };

  // Store the cost entry
  const redisClient = getRedisClient();
  await redisClient.rpush(key, JSON.stringify(entry));
  
  // Set expiry to 7 days for weekly reports
  await redisClient.expire(key, 7 * 24 * 60 * 60);

  // Get today's total cost
  const dailyTotal = await getDailyCost();
  const budgetRemaining = COST_CONFIG.dailyBudget - dailyTotal;

  // Check if we need to send an alert
  if (dailyTotal >= COST_CONFIG.warningThreshold && dailyTotal < COST_CONFIG.dailyBudget) {
    await sendBudgetWarning(dailyTotal);
  } else if (dailyTotal >= COST_CONFIG.dailyBudget) {
    await sendBudgetExceeded(dailyTotal);
  }

  return {
    dailyTotal,
    budgetRemaining: Math.max(0, budgetRemaining),
  };
}

/**
 * Get total cost for today
 */
export async function getDailyCost(): Promise<number> {
  const key = getTodayKey();
  const redisClient = getRedisClient();
  const entries = await redisClient.lrange(key, 0, -1);
  
  if (!entries || entries.length === 0) {
    return 0;
  }

  const total = entries.reduce((sum: number, entryStr: string) => {
    try {
      const entry = JSON.parse(entryStr) as CostEntry;
      return sum + entry.cost;
    } catch {
      return sum;
    }
  }, 0);

  return total;
}

/**
 * Get cost breakdown by service
 */
export async function getCostBreakdown(): Promise<{
  openai: number;
  gemini: number;
  total: number;
}> {
  const key = getTodayKey();
  const redisClient = getRedisClient();
  const entries = await redisClient.lrange(key, 0, -1);
  
  const breakdown = {
    openai: 0,
    gemini: 0,
    total: 0,
  };

  if (!entries || entries.length === 0) {
    return breakdown;
  }

  entries.forEach((entryStr: string) => {
    try {
      const entry = JSON.parse(entryStr) as CostEntry;
      breakdown[entry.service] += entry.cost;
      breakdown.total += entry.cost;
    } catch {
      // Skip invalid entries
    }
  });

  return breakdown;
}

/**
 * Get weekly cost summary (for email reports)
 */
export async function getWeeklyCostSummary(): Promise<{
  days: { date: string; cost: number }[];
  total: number;
  average: number;
}> {
  const days: { date: string; cost: number }[] = [];
  let total = 0;
  const redisClient = getRedisClient();

  // Get costs for last 7 days
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const key = `costs:daily:${dateStr}`;
    
    const entries = await redisClient.lrange(key, 0, -1);
    const dayCost = entries.reduce((sum: number, entryStr: string) => {
      try {
        const entry = JSON.parse(entryStr) as CostEntry;
        return sum + entry.cost;
      } catch {
        return sum;
      }
    }, 0);

    days.push({ date: dateStr, cost: dayCost });
    total += dayCost;
  }

  return {
    days: days.reverse(),
    total,
    average: total / 7,
  };
}

/**
 * Send budget warning email (75% threshold)
 */
async function sendBudgetWarning(currentCost: number): Promise<void> {
  const redisClient = getRedisClient();
  // Check if we already sent a warning today
  const warningKey = `budget:warning:${getTodayKey()}`;
  const alreadySent = await redisClient.get(warningKey);
  
  if (alreadySent) {
    return; // Don't send duplicate warnings
  }

  // Mark warning as sent
  await redisClient.setex(warningKey, 24 * 60 * 60, '1');

  console.warn(`⚠️ BUDGET WARNING: Daily AI cost is $${currentCost.toFixed(2)} (Limit: $${COST_CONFIG.dailyBudget})`);

  try {
    const breakdown = await getCostBreakdown();
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: COST_CONFIG.alertEmail,
      subject: '⚠️ AI Budget Warning - 75% Threshold Reached',
      html: `
        <h2>⚠️ AI Budget Warning</h2>
        <p>Your daily AI budget has reached <strong>$${currentCost.toFixed(2)}</strong> of $${COST_CONFIG.dailyBudget.toFixed(2)}.</p>
        <h3>Breakdown</h3>
        <ul>
          <li>OpenAI: $${breakdown.openai.toFixed(4)}</li>
          <li>Gemini: $${breakdown.gemini.toFixed(4)}</li>
        </ul>
        <p>Date: ${new Date().toISOString().split('T')[0]}</p>
      `,
    });
  } catch (emailError) {
    console.error('Failed to send budget warning email:', emailError);
  }
}

/**
 * Send budget exceeded email
 */
async function sendBudgetExceeded(currentCost: number): Promise<void> {
  const redisClient = getRedisClient();
  // Check if we already sent an alert today
  const alertKey = `budget:exceeded:${getTodayKey()}`;
  const alreadySent = await redisClient.get(alertKey);
  
  if (alreadySent) {
    return; // Don't send duplicate alerts
  }

  // Mark alert as sent
  await redisClient.setex(alertKey, 24 * 60 * 60, '1');

  console.error(`🚨 BUDGET EXCEEDED: Daily AI cost is $${currentCost.toFixed(2)} (Limit: $${COST_CONFIG.dailyBudget})`);

  try {
    const breakdown = await getCostBreakdown();
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: COST_CONFIG.alertEmail,
      subject: '🚨 AI Budget EXCEEDED - Immediate Attention Required',
      html: `
        <h2>🚨 AI Budget Exceeded</h2>
        <p>Your daily AI budget has been <strong>exceeded</strong>: <strong>$${currentCost.toFixed(2)}</strong> of $${COST_CONFIG.dailyBudget.toFixed(2)}.</p>
        <h3>Breakdown</h3>
        <ul>
          <li>OpenAI: $${breakdown.openai.toFixed(4)}</li>
          <li>Gemini: $${breakdown.gemini.toFixed(4)}</li>
        </ul>
        <p>Consider temporarily disabling AI features or increasing the budget.</p>
        <p>Date: ${new Date().toISOString().split('T')[0]}</p>
      `,
    });
  } catch (emailError) {
    console.error('Failed to send budget exceeded email:', emailError);
  }
}

/**
 * Estimate OpenAI cost based on tokens
 */
export function estimateOpenAICost(tokens: number, model: 'gpt-4' | 'gpt-3.5' = 'gpt-4'): number {
  const pricePerThousand = model === 'gpt-4' ? AI_PRICING.openai.gpt4 : AI_PRICING.openai.gpt35;
  return (tokens / 1000) * pricePerThousand;
}

/**
 * Estimate Gemini cost based on characters or images
 */
export function estimateGeminiCost(params: { characters?: number; images?: number }): number {
  let cost = 0;
  
  if (params.characters) {
    cost += (params.characters / 1000) * AI_PRICING.gemini.pro;
  }
  
  if (params.images) {
    cost += params.images * AI_PRICING.gemini.proVision;
  }
  
  return cost;
}
