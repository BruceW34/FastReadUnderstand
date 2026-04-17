/**
 * ✅ MULTIPLAYER OPERATIONS - RATE LIMIT ENTEGRASYON
 * 
 * Bu dosya, multiplayer işlemlerine rate limiting'i nasıl ekleyeceğini gösterir
 */

import {
  duelRateLimiter,
  duelPickRateLimiter,
  ratelimitWrapper,
  PersistentRateLimiter,
} from './rateLimit';
import { logError } from './errorLogger';
import type { User } from '../shared/types';

// ===============================================
// 1️⃣ DUEL OPERATIONS WITH RATE LIMITING
// ===============================================

/**
 * ✅ Create duel with rate limiting
 */
export async function createDuelWithRateLimit(
  user: User | null,
  parameters: any,
  createDuelFn: (params: any) => Promise<any>
) {
  if (!user) {
    throw new Error('User not authenticated');
  }

  try {
    // Check rate limit
    const status = duelRateLimiter.isAllowed(`duel:${user.uid}`);

    if (!status.allowed) {
      logError({
        message: `Duel rate limit exceeded for user ${user.uid}`,
        level: 'warn',
        context: 'Rate Limiting',
      });
      throw new Error(
        `Çok hızlı duel başlatıyorsunuz. ${status.retryAfter}s sonra tekrar deneyin.`
      );
    }

    // Proceed with duel creation
    const result = await createDuelFn(parameters);

    console.log(`✅ Duel created. Remaining requests: ${status.remaining}`);
    return result;
  } catch (error: any) {
    logError({
      message: error.message,
      level: 'error',
      context: 'Create Duel',
    });
    throw error;
  }
}

// ===============================================
// 2️⃣ DUEL PICK OPERATIONS WITH RATE LIMITING
// ===============================================

/**
 * ✅ Pick game type with rate limiting
 */
export async function pickDuelGameWithRateLimit(
  user: User | null,
  duelId: string,
  gameType: string,
  updateFn: (duelId: string, gameType: string) => Promise<any>
) {
  if (!user) {
    throw new Error('User not authenticated');
  }

  try {
    // Persistent rate limit (survives page refresh)
    const limiter = new PersistentRateLimiter(
      `duel-pick:${user.uid}`,
      {
        maxRequests: 20,
        windowMs: 30000, // 30 seconds
      }
    );

    const status = limiter.isAllowed();

    if (!status.allowed) {
      logError({
        message: `Duel pick rate limit exceeded for user ${user.uid}`,
        level: 'warn',
        context: 'Rate Limiting',
      });
      throw new Error(
        `Çok hızlı işlem yapıyorsunuz. ${status.retryAfter}s sonra tekrar deneyin.`
      );
    }

    // Proceed with pick
    const result = await updateFn(duelId, gameType);

    console.log(`✅ Pick saved. Remaining requests: ${status.remaining}`);
    return result;
  } catch (error: any) {
    logError({
      message: error.message,
      level: 'error',
      context: 'Duel Pick',
    });
    throw error;
  }
}

// ===============================================
// 3️⃣ TRAINING SESSION WITH RATE LIMITING
// ===============================================

/**
 * ✅ Submit training result with rate limiting
 * Spam XP farming'i önlemek için
 */
export async function submitTrainingWithRateLimit(
  user: User | null,
  trainingData: any,
  submitFn: (data: any) => Promise<any>
) {
  if (!user) {
    throw new Error('User not authenticated');
  }

  try {
    // Max 30 trainings per minute (normal user ~2-10 per minute)
    const limiter = new PersistentRateLimiter(
      `training:${user.uid}`,
      {
        maxRequests: 30,
        windowMs: 60000,
      }
    );

    const status = limiter.isAllowed();

    if (!status.allowed) {
      logError({
        message: `Training rate limit exceeded for user ${user.uid}`,
        level: 'warn',
        context: 'Rate Limiting',
      });
      throw new Error(
        `Çok hızlı eğitim aktivitesi. Biraz daha yavaş deneyin.`
      );
    }

    // Validate training data (prevent cheating)
    if (trainingData.xp < 0 || trainingData.xp > 10000) {
      throw new Error('Invalid XP amount');
    }

    // Server-side validation yapılır Cloud Functions'ta
    const result = await submitFn(trainingData);

    console.log(`✅ Training submitted. Remaining: ${status.remaining}`);
    return result;
  } catch (error: any) {
    logError({
      message: error.message,
      level: 'error',
      context: 'Submit Training',
    });
    throw error;
  }
}

// ===============================================
// 4️⃣ REACT COMPONENT EXAMPLE
// ===============================================

/**
 * ✅ React component'ta rate limit kullanımı
 * 
 * export const DuelButton: React.FC<Props> = ({ user }) => {
 *   const [loading, setLoading] = useState(false);
 *   const [error, setError] = useState('');
 *   const [cooldown, setCooldown] = useState(0);
 * 
 *   const handleCreateDuel = async () => {
 *     setLoading(true);
 *     setError('');
 * 
 *     try {
 *       await createDuelWithRateLimit(user, {}, createDuelFn);
 *     } catch (err: any) {
 *       setError(err.message);
 * 
 *       // Parse cooldown time
 *       const match = err.message.match(/(\\d+)s/);
 *       if (match) {
 *         setCooldown(parseInt(match[1]));
 *         // Countdown timer
 *         const interval = setInterval(() => {
 *           setCooldown(c => c > 0 ? c - 1 : 0);
 *         }, 1000);
 *         setTimeout(() => clearInterval(interval), parseInt(match[1]) * 1000);
 *       }
 *     } finally {
 *       setLoading(false);
 *     }
 *   };
 * 
 *   return (
 *     <div>
 *       <button
 *         onClick={handleCreateDuel}
 *         disabled={loading || cooldown > 0}
 *       >
 *         {cooldown > 0 ? `Bekleyin: ${cooldown}s` : 'Duel Başlat'}
 *       </button>
 *       {error && <p className="text-red-600">{error}</p>}
 *     </div>
 *   );
 * };
 */

// ===============================================
// 5️⃣ MONITORING & ANALYTICS
// ===============================================

/**
 * ✅ Rate limit violations logging
 */
export function logRateLimitViolation(
  userId: string,
  action: string,
  violations: number
) {
  logError({
    message: `Rate limit violation for ${action}`,
    level: violations > 5 ? 'error' : 'warn',
    context: 'Rate Limiting Abuse',
  });

  // Firebase Analytics
  if ((window as any).firebase?.analytics) {
    try {
      (window as any).firebase.analytics().logEvent('rate_limit_exceeded', {
        action,
        violation_count: violations,
      });
    } catch {
      // Ignore
    }
  }
}
