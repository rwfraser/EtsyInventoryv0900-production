import { Redis } from '@upstash/redis';

// Initialize Redis client
const redis = Redis.fromEnv();

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
  await redis.rpush(key, JSON.stringify(entry));
  
  // Set expiry to 7 days for weekly reports
  await redis.expire(key, 7 * 24 * 60 * 60);

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
  const entries = await redis.lrange(key, 0, -1);
  
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
  const entries = await redis.lrange(key, 0, -1);
  
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

  // Get costs for last 7 days
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const key = `costs:daily:${dateStr}`;
    
    const entries = await redis.lrange(key, 0, -1);
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
  // Check if we already sent a warning today
  const warningKey = `budget:warning:${getTodayKey()}`;
  const alreadySent = await redis.get(warningKey);
  
  if (alreadySent) {
    return; // Don't send duplicate warnings
  }

  // Mark warning as sent
  await redis.setex(warningKey, 24 * 60 * 60, '1');

  // TODO: Implement actual email sending via Resend or similar
  console.warn(`⚠️ BUDGET WARNING: Daily AI cost is $${currentCost.toFixed(2)} (Limit: $${COST_CONFIG.dailyBudget})`);
  console.warn(`Email would be sent to: ${COST_CONFIG.alertEmail}`);
  
  // For now, just log. In production, integrate with email service:
  // await sendEmail({
  //   to: COST_CONFIG.alertEmail,
  //   subject: '⚠️ AI Budget Warning - 75% Threshold Reached',
  //   body: `Your daily AI budget has reached $${currentCost.toFixed(2)} of $${COST_CONFIG.dailyBudget}.`
  // });
}

/**
 * Send budget exceeded email
 */
async function sendBudgetExceeded(currentCost: number): Promise<void> {
  // Check if we already sent an alert today
  const alertKey = `budget:exceeded:${getTodayKey()}`;
  const alreadySent = await redis.get(alertKey);
  
  if (alreadySent) {
    return; // Don't send duplicate alerts
  }

  // Mark alert as sent
  await redis.setex(alertKey, 24 * 60 * 60, '1');

  // TODO: Implement actual email sending
  console.error(`🚨 BUDGET EXCEEDED: Daily AI cost is $${currentCost.toFixed(2)} (Limit: $${COST_CONFIG.dailyBudget})`);
  console.error(`Email would be sent to: ${COST_CONFIG.alertEmail}`);
  
  // For now, just log. In production, integrate with email service:
  // await sendEmail({
  //   to: COST_CONFIG.alertEmail,
  //   subject: '🚨 AI Budget EXCEEDED',
  //   body: `Your daily AI budget has been exceeded: $${currentCost.toFixed(2)} of $${COST_CONFIG.dailyBudget}.`
  // });
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
