/**
 * ✅ RATE LIMITING SYSTEM
 * Multiplayer işlemlerinde spam ve abuse'ı önler
 * 
 * İKİ KAT KORUNMA:
 * 1. Client-side: User experience ve immediate feedback
 * 2. Server-side (Cloud Functions): Security ve enforcement
 */

// ===============================================
// CLIENT-SIDE RATE LIMITING
// ===============================================

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // Time window in milliseconds
  message?: string;
}

export interface RateLimitStatus {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  /**
   * ✅ Check if request is allowed
   */
  isAllowed(identifier: string): RateLimitStatus {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Get requests for this identifier
    const requests = this.requests.get(identifier) || [];

    // Remove old requests outside the window
    const recentRequests = requests.filter((time) => time > windowStart);

    // Check if allowed
    const allowed = recentRequests.length < this.config.maxRequests;

    if (allowed) {
      // Add new request
      recentRequests.push(now);
      this.requests.set(identifier, recentRequests);
    }

    // Calculate reset time
    const oldestRequest = recentRequests[0];
    const resetTime = oldestRequest + this.config.windowMs;
    const retryAfter = Math.ceil((resetTime - now) / 1000); // seconds

    return {
      allowed,
      remaining: Math.max(0, this.config.maxRequests - recentRequests.length),
      resetTime,
      retryAfter: allowed ? undefined : retryAfter,
    };
  }

  /**
   * ✅ Reset limits for a user
   */
  reset(identifier: string) {
    this.requests.delete(identifier);
  }

  /**
   * ✅ Clear all limits (admin)
   */
  clearAll() {
    this.requests.clear();
  }
}

// ===============================================
// PREDEFINED RATE LIMITERS
// ===============================================

// 🎮 Duel: Max 10 duel starts per minute
export const duelRateLimiter = new RateLimiter({
  maxRequests: 10,
  windowMs: 60000, // 1 minute
  message: 'Çok hızlı duel başlatıyorsunuz. Bir dakika bekleyin.',
});

// 🚫 Duel Pick: Max 20 picks per 30 seconds
export const duelPickRateLimiter = new RateLimiter({
  maxRequests: 20,
  windowMs: 30000,
  message: 'Çok hızlı işlem yapıyorsunuz. Biraz bekleyin.',
});

// 📝 Training: Max 30 activities per minute
export const trainingRateLimiter = new RateLimiter({
  maxRequests: 30,
  windowMs: 60000,
  message: 'Çok hızlı eğitim aktivitesi. Hız moderatör aktiviteler.',
});

// 💬 Social: Max 5 messages per 10 seconds
export const socialRateLimiter = new RateLimiter({
  maxRequests: 5,
  windowMs: 10000,
  message: 'Çok hızlı mesaj gönderiyorsunuz. Biraz bekleyin.',
});

// 🔄 API: Max 100 requests per minute
export const apiRateLimiter = new RateLimiter({
  maxRequests: 100,
  windowMs: 60000,
  message: 'API rate limit exceeded. Please try again later.',
});

// ===============================================
// ASYNC RATE LIMITER WITH STORAGE
// ===============================================

/**
 * ✅ Server-side rate limiting (Firestore'da tutulan)
 * Cloud Functions'ta da bu pattern'ı kullan
 */
export async function serverSideRateLimit(
  userId: string,
  action: string,
  maxAttempts: number = 10,
  windowSeconds: number = 60
): Promise<RateLimitStatus> {
  // Bu function Cloud Functions'ta uygulanır
  // Firestore'da `rateLimits` collection'ında saklanır
  
  // Örnek implementation:
  const docRef = `users/${userId}/rateLimits/${action}`;
  const now = Date.now();
  const windowStart = now - windowSeconds * 1000;

  // Firestore kuralında:
  // - Read: User kendi limits'ini okuyabilir
  // - Write: Sadece Cloud Functions tarafından yazılır

  return {
    allowed: true,
    remaining: 10,
    resetTime: now + windowSeconds * 1000,
  };
}

// ===============================================
// REACT HOOK FOR RATE LIMITING
// ===============================================

/**
 * ✅ React hook kullanımı
 * 
 * Örnek:
 * const { isAllowed, status, reset } = useRateLimit('duel', userId);
 * 
 * if (!isAllowed) {
 *   return <p>Çok hızlı. {status.retryAfter}s sonra tekrar deneyin</p>
 * }
 */

export function useRateLimit(
  action: string,
  userId: string,
  config?: RateLimitConfig
) {
  const limiter = config
    ? new RateLimiter(config)
    : getDefaultLimiter(action);

  const identifier = `${userId}:${action}`;
  const status = limiter.isAllowed(identifier);

  return {
    isAllowed: status.allowed,
    status,
    reset: () => limiter.reset(identifier),
  };
}

function getDefaultLimiter(action: string): RateLimiter {
  const limiters: Record<string, RateLimiter> = {
    duel: duelRateLimiter,
    duelPick: duelPickRateLimiter,
    training: trainingRateLimiter,
    social: socialRateLimiter,
    api: apiRateLimiter,
  };

  return limiters[action] || apiRateLimiter;
}

// ===============================================
// RATE LIMIT MIDDLEWARE
// ===============================================

/**
 * ✅ Async action wrapper
 * 
 * Örnek:
 * const createDuel = ratelimitWrapper(
 *   async (data) => { ... },
 *   'duel',
 *   userId
 * );
 */

export function ratelimitWrapper<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  action: string,
  userId: string,
  config?: RateLimitConfig
) {
  const limiter = config
    ? new RateLimiter(config)
    : getDefaultLimiter(action);

  return async (...args: T): Promise<R | null> => {
    const identifier = `${userId}:${action}`;
    const status = limiter.isAllowed(identifier);

    if (!status.allowed) {
      console.warn(
        `Rate limit exceeded for ${action}. Retry after ${status.retryAfter}s`
      );
      throw new Error(
        `Rate limited. Birkaç saniyede yeniden deneyin (${status.retryAfter}s)`
      );
    }

    try {
      return await fn(...args);
    } catch (error) {
      throw error;
    }
  };
}

// ===============================================
// LOCAL STORAGE PERSISTENCE
// ===============================================

/**
 * ✅ Store rate limit data in localStorage
 * Page refresh'te bile korunur
 */

export class PersistentRateLimiter {
  private key: string;
  private config: RateLimitConfig;

  constructor(identifier: string, config: RateLimitConfig) {
    this.key = `rateLimit:${identifier}`;
    this.config = config;
  }

  isAllowed(): RateLimitStatus {
    const now = Date.now();
    const data = this.getData();

    if (!data.requests || data.requests.length === 0) {
      this.saveData([now]);
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime: now + this.config.windowMs,
      };
    }

    const windowStart = now - this.config.windowMs;
    const recentRequests = data.requests.filter((time) => time > windowStart);

    const allowed = recentRequests.length < this.config.maxRequests;

    if (allowed) {
      recentRequests.push(now);
      this.saveData(recentRequests);
    }

    const oldestRequest = recentRequests[0];
    const resetTime = oldestRequest + this.config.windowMs;

    return {
      allowed,
      remaining: Math.max(0, this.config.maxRequests - recentRequests.length),
      resetTime,
      retryAfter: allowed ? undefined : Math.ceil((resetTime - now) / 1000),
    };
  }

  reset() {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.key);
    }
  }

  private getData(): any {
    try {
      if (typeof localStorage === 'undefined') return { requests: [] };
      const data = localStorage.getItem(this.key);
      return data ? JSON.parse(data) : { requests: [] };
    } catch {
      return { requests: [] };
    }
  }

  private saveData(requests: number[]) {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.setItem(this.key, JSON.stringify({ requests }));
    } catch {
      // localStorage full veya başka hata
    }
  }
}

// ===============================================
// CLOUD FUNCTIONS EXAMPLE
// ===============================================

/**
 * ✅ CLOUD FUNCTIONS RATE LIMITING
 * 
 * functions/src/rateLimit.ts örneği:
 * 
 * import * as functions from 'firebase-functions';
 * import * as admin from 'firebase-admin';
 * 
 * export const checkRateLimit = functions.https.onCall(async (data, context) => {
 *   const userId = context.auth?.uid;
 *   const action = data.action;
 * 
 *   if (!userId) throw new Error('Unauthenticated');
 * 
 *   const db = admin.firestore();
 *   const limitDoc = db.collection('rateLimits').doc(`${userId}:${action}`);
 * 
 *   return await db.runTransaction(async (transaction) => {
 *     const doc = await transaction.get(limitDoc);
 *     const now = Date.now();
 *     const window = 60000; // 1 minute
 * 
 *     let requests = doc.data()?.requests || [];
 *     requests = requests.filter((t) => t > now - window);
 * 
 *     if (requests.length >= 10) {
 *       throw new Error('Rate limit exceeded');
 *     }
 * 
 *     requests.push(now);
 *     transaction.set(limitDoc, { requests }, { merge: true });
 * 
 *     return { allowed: true, remaining: 10 - requests.length };
 *   });
 * });
 */
