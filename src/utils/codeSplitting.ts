/**
 * ✅ CODE SPLITTING & LAZY LOADING UTILITIES
 * Performance optimization through dynamic imports
 */

import React, { Suspense, ReactNode } from 'react';

// ===============================================
// 1️⃣ LAZY LOADING COMPONENTS
// ===============================================

/**
 * ✅ Lazy load route components for faster initial load
 * Kullanıcı bir sayfaya gittiğinde bundle yüklenir
 */

// Admin panel (heavy, lazy loaded)
export const AdminLayout = React.lazy(() => 
  import('../components/admin/AdminLayout').then(m => ({ default: m.AdminLayout }))
);

// Training modules (heavy, lazy loaded)
export const FlashRead = React.lazy(() => 
  import('../components/modules').then(m => ({ default: m.FlashRead }))
);

export const GuidedRead = React.lazy(() => 
  import('../components/modules').then(m => ({ default: m.GuidedRead }))
);

export const VisualMemory = React.lazy(() => 
  import('../components/modules').then(m => ({ default: m.VisualMemory }))
);

export const DailyChallenge = React.lazy(() => 
  import('../components/modules').then(m => ({ default: m.DailyChallenge }))
);

// Views (medium weight)
export const Profile = React.lazy(() => 
  import('../components/views/Profile').then(m => ({ default: m.default }))
);

export const SocialHub = React.lazy(() => 
  import('../components/views/SocialHub').then(m => ({ default: m.default }))
);

export const Pathway = React.lazy(() => 
  import('../components/views/Pathway').then(m => ({ default: m.default }))
);

// ===============================================
// 2️⃣ LOADING FALLBACK COMPONENT
// ===============================================

interface LoadingFallbackProps {
  message?: string;
}

export const LoadingFallback: React.FC<LoadingFallbackProps> = ({ message = 'Yükleniyor...' }) => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
    <div className="text-center">
      <div className="animate-spin mb-4">
        <div className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
      </div>
      <p className="text-gray-700 dark:text-gray-300 text-lg font-medium">{message}</p>
    </div>
  </div>
);

// ===============================================
// 3️⃣ SUSPENSE WRAPPER HOC
// ===============================================

/**
 * ✅ Wrap components with Suspense automatically
 */
interface WithSuspenseProps {
  fallback?: ReactNode;
  children: ReactNode;
}

export const WithSuspense: React.FC<WithSuspenseProps> = ({
  fallback = <LoadingFallback />,
  children,
}) => (
  <Suspense fallback={fallback}>
    {children}
  </Suspense>
);

// ===============================================
// 4️⃣ DYNAMIC IMPORT HELPER
// ===============================================

/**
 * ✅ Dynamically import modules at runtime
 * Code splitting for large features
 */

export async function importModule<T = any>(
  modulePath: string
): Promise<T> {
  try {
    // Dynamic import with webpack/vite magic comment
    const module = await import(
      /* webpackChunkName: "[request]" */
      /* @vite-ignore */
      modulePath
    );
    return module.default || module;
  } catch (error) {
    console.error(`Failed to load module: ${modulePath}`, error);
    throw error;
  }
}

// ===============================================
// 5️⃣ ROUTE-BASED CODE SPLITTING
// ===============================================

/**
 * ✅ Route lazy loading configuration
 * Kullanılabilir React Router ile
 */

export const lazyRoutes = {
  // Home & Dashboard
  dashboard: () => import('../components/views/Dashboard'),
  
  // Training
  training: () => import('../components/views/TrainingMenu'),
  flashRead: () => import('../components/modules/FlashRead'),
  guidedRead: () => import('../components/modules/GuidedRead'),
  
  // Multiplayer
  duelMatchmaking: () => import('../components/modals/OnlineMatchmaking'),
  
  // Social
  socialHub: () => import('../components/views/SocialHub'),
  friends: () => import('../components/views/Friends'),
  profile: () => import('../components/views/Profile'),
  
  // Admin
  adminLayout: () => import('../components/admin/AdminLayout'),
  
  // Settings
  settings: () => import('../components/modals/StoreModals'),
};

// ===============================================
// 6️⃣ PREFETCHING STRATEGY
// ===============================================

/**
 * ✅ Prefetch modules before user navigates
 * Smooth navigation UX
 */

class PrefetchManager {
  private prefetchedModules: Set<string> = new Set();

  /**
   * Prefetch module for later use
   */
  prefetch(modulePath: string, delay: number = 3000) {
    if (this.prefetchedModules.has(modulePath)) {
      return; // Already prefetched
    }

    setTimeout(() => {
      import(/* webpackPrefetch: true */ modulePath)
        .then(() => {
          console.log(`✅ Prefetched: ${modulePath}`);
          this.prefetchedModules.add(modulePath);
        })
        .catch(() => {
          // Silently fail, module will load on demand
        });
    }, delay);
  }

  /**
   * Prefetch related modules
   */
  prefetchRelated(modulePaths: string[]) {
    modulePaths.forEach((path, index) => {
      this.prefetch(path, 500 + index * 500);
    });
  }

  /**
   * Prefetch after idle
   */
  prefetchOnIdle(modulePaths: string[]) {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        this.prefetchRelated(modulePaths);
      });
    } else {
      setTimeout(() => {
        this.prefetchRelated(modulePaths);
      }, 2000);
    }
  }
}

export const prefetchManager = new PrefetchManager();

// ===============================================
// 7️⃣ USAGE EXAMPLES
// ===============================================

/**
 * ✅ Example 1: Lazy route component
 * 
 * import { WithSuspense, FlashRead } from '@/utils/codeSplitting';
 * 
 * export const TrainingPage = () => (
 *   <WithSuspense>
 *     <FlashRead />
 *   </WithSuspense>
 * );
 */

/**
 * ✅ Example 2: Prefetch on user hover
 * 
 * const handleDuelHover = () => {
 *   prefetchManager.prefetch(
 *     '../components/modals/OnlineMatchmaking'
 *   );
 * };
 * 
 * <button onMouseEnter={handleDuelHover}>
 *   Start Duel
 * </button>
 */

/**
 * ✅ Example 3: Prefetch when app loads
 * 
 * useEffect(() => {
 *   // Prefetch user's favorite modules
 *   prefetchManager.prefetchOnIdle([
 *     '../components/modules/FlashRead',
 *     '../components/modules/GuidedRead',
 *   ]);
 * }, []);
 */

// ===============================================
// 8️⃣ DYNAMIC IMPORT WITH LOAD INDICATOR
// ===============================================

/**
 * ✅ Custom hook for loading states
 */
export function useLazyComponent(
  componentPath: () => Promise<{ default: React.ComponentType<any> }>
) {
  const [Component, setComponent] = React.useState<React.ComponentType<any> | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    componentPath()
      .then(module => {
        setComponent(() => module.default);
      })
      .catch(err => {
        setError(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return { Component, loading, error };
}

// ===============================================
// 9️⃣ BUNDLE ANALYSIS
// ===============================================

/**
 * ✅ Check bundle sizes
 * npm run build -- --analyze
 */

export const bundleAnalysisConfig = {
  command: 'npm run build -- --analyze',
  // Bundles:
  // - vendor-firebase: ~150kb (Firebase SDK)
  // - vendor-react: ~200kb (React, React DOM)
  // - modules-*: ~50-100kb each (Training modules)
  // - main: ~100kb (App core)
  // - admin: ~80kb (Admin panel, lazy loaded)
};

// ===============================================
// 🔟 PERFORMANCE METRICS
// ===============================================

/**
 * ✅ Measure code-splitting effectiveness
 */

export function measureCodeSplitting() {
  if (typeof window !== 'undefined' && 'performance' in window) {
    const perfData = performance.getEntriesByType('resource');
    const scripts = perfData.filter(entry => 
      entry.name.includes('.js')
    );

    console.table(
      scripts.map(s => ({
        name: (s.name as string).split('/').pop(),
        size: `${((s as any).transferSize / 1024).toFixed(2)}kb`,
        duration: `${s.duration.toFixed(2)}ms`,
      }))
    );
  }
}

// ===============================================
// Script execution:
// measureCodeSplitting();
// çalıştır browser console'da
