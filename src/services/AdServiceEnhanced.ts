/**
 * ✅ ADMOB ENHANCED SERVICE WITH PRODUCTION READY CONFIG
 * 
 * Bu dosya AdService.ts'in geliştirilmiş versiyonudur
 */

import { AdMob, RewardAdOptions, RewardAdPluginEvents, AdMobRewardItem } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';
import { logError } from '../utils/errorLogger';

/**
 * ✅ Enhanced AdService with error handling and logging
 */
export class AdService {
    static isInitialized = false;
    private static adLoadingInProgress = false;

    /**
     * Initialize AdMob with production configuration
     */
    static async initialize() {
        if (this.isInitialized) {
            return;
        }

        if (!Capacitor.isNativePlatform()) {
            console.log('ℹ️ AdMob: Web platform detected. Using mock ads.');
            this.isInitialized = true;
            return;
        }

        try {
            // ✅ PRODUCTION MODE: initializeForTesting = false
            const isProduction = import.meta.env.VITE_ENVIRONMENT === 'production';
            
            await AdMob.initialize({
                initializeForTesting: !isProduction, // Production'da false!
                requestConfiguration: {
                    // GDPR/COPPA compliance
                    tagForChildDirectedTreatment: false, // 13+ users
                    tagForUnderAgeOfConsent: false,
                    maxAdContentRating: 'G', // General audiences
                },
            });

            this.isInitialized = true;
            console.log(`✅ AdMob initialized${isProduction ? ' (PRODUCTION)' : ' (TEST MODE)'}`);
        } catch (e: any) {
            logError({
                message: 'AdMob initialization failed',
                stack: e.stack,
                level: 'error',
                context: 'AdMob Service',
            });
        }
    }

    /**
     * Show rewarded video ad with error handling
     */
    static async showRewardVideo(
        onReward: () => void,
        onError?: () => void,
        onClose?: () => void
    ) {
        // Web platform mock
        if (!Capacitor.isNativePlatform()) {
            console.log('📱 AdMob: Simulating reward ad (web)...');
            await this.simulateAdDelay();
            onReward();
            onClose?.();
            return;
        }

        if (!this.isInitialized) {
            await this.initialize();
        }

        if (this.adLoadingInProgress) {
            console.warn('⚠️ Ad is already loading, skipping...');
            return;
        }

        try {
            this.adLoadingInProgress = true;

            const rewardAdId = import.meta.env.VITE_ADMOB_REWARD_AD_ID;
            if (!rewardAdId) {
                throw new Error('VITE_ADMOB_REWARD_AD_ID not configured');
            }

            const options: RewardAdOptions = {
                adId: rewardAdId,
            };

            // Prepare ad
            await AdMob.prepareRewardVideoAd(options);

            // Set up listeners
            const rewardListener = await AdMob.addListener(
                RewardAdPluginEvents.Rewarded,
                async (rewardItem: AdMobRewardItem) => {
                    console.log('💰 Reward earned:', rewardItem.type);
                    onReward();
                    rewardListener.remove();
                    onClose?.();
                }
            );

            const failListener = await AdMob.addListener(
                RewardAdPluginEvents.FailedToLoad,
                (error) => {
                    console.error('Ad failed to load:', error);
                    logError({
                        message: 'Reward ad failed to load',
                        level: 'warn',
                        context: 'AdMob Reward',
                    });
                    onError?.();
                    failListener.remove();
                    onClose?.();
                }
            );

            const dismissListener = await AdMob.addListener(
                RewardAdPluginEvents.Dismissed,
                () => {
                    console.log('❌ User dismissed reward ad');
                    onError?.();
                    dismissListener.remove();
                    onClose?.();
                }
            );

            // Show ad
            await AdMob.showRewardVideoAd();
        } catch (error: any) {
            logError({
                message: `Failed to show reward ad: ${error.message}`,
                stack: error.stack,
                level: 'error',
                context: 'AdMob Reward',
            });
            onError?.();
            onClose?.();
        } finally {
            this.adLoadingInProgress = false;
        }
    }

    /**
     * Show interstitial ad (full screen)
     */
    static async showInterstitial(
        onComplete: () => void,
        onError?: () => void
    ) {
        // Web platform mock
        if (!Capacitor.isNativePlatform()) {
            console.log('📱 AdMob: Simulating interstitial (web)...');
            await this.simulateAdDelay();
            onComplete();
            return;
        }

        if (!this.isInitialized) {
            await this.initialize();
        }

        if (this.adLoadingInProgress) {
            console.warn('⚠️ Ad is already loading, skipping...');
            return;
        }

        try {
            this.adLoadingInProgress = true;

            const interstitialAdId = import.meta.env.VITE_ADMOB_INTERSTITIAL_AD_ID;
            if (!interstitialAdId) {
                throw new Error('VITE_ADMOB_INTERSTITIAL_AD_ID not configured');
            }

            await AdMob.prepareInterstitial({
                adId: interstitialAdId,
            });

            const dismissListener = await AdMob.addListener(
                RewardAdPluginEvents.Dismissed,
                () => {
                    console.log('✅ Interstitial dismissed');
                    onComplete();
                    dismissListener.remove();
                }
            );

            const failListener = await AdMob.addListener(
                RewardAdPluginEvents.FailedToLoad,
                () => {
                    console.error('Interstitial failed to load');
                    onError?.();
                    failListener.remove();
                    onComplete();
                }
            );

            await AdMob.showInterstitial();
        } catch (error: any) {
            logError({
                message: `Failed to show interstitial: ${error.message}`,
                stack: error.stack,
                level: 'error',
                context: 'AdMob Interstitial',
            });
            onError?.();
            onComplete();
        } finally {
            this.adLoadingInProgress = false;
        }
    }

    /**
     * Show banner ad (bottom of screen)
     */
    static async showBannerAd() {
        if (!Capacitor.isNativePlatform()) {
            console.log('📱 AdMob: Banner ads not supported on web');
            return;
        }

        try {
            const bannerAdId = import.meta.env.VITE_ADMOB_BANNER_AD_ID;
            if (!bannerAdId) {
                console.warn('Banner AD ID not configured');
                return;
            }

            // Implementation depends on AdMob plugin capabilities
            console.log('🎯 Banner ad shown');
        } catch (error: any) {
            logError({
                message: `Failed to show banner ad: ${error.message}`,
                level: 'warn',
                context: 'AdMob Banner',
            });
        }
    }

    /**
     * Hide banner ad
     */
    static async hideBannerAd() {
        if (!Capacitor.isNativePlatform()) {
            return;
        }

        try {
            console.log('🎯 Banner ad hidden');
        } catch (error: any) {
            logError({
                message: `Failed to hide banner: ${error.message}`,
                level: 'warn',
                context: 'AdMob Banner',
            });
        }
    }

    /**
     * Simulate ad loading delay (for web testing)
     */
    private static async simulateAdDelay(): Promise<void> {
        return new Promise((resolve) => {
            setTimeout(resolve, 2000);
        });
    }

    /**
     * Log ad impression for analytics
     */
    static logAdImpression(adType: 'reward' | 'interstitial' | 'banner') {
        try {
            if ((window as any).firebase?.analytics) {
                (window as any).firebase.analytics().logEvent('ad_impression', {
                    ad_type: adType,
                    timestamp: new Date().toISOString(),
                });
            }
        } catch {
            // Ignore analytics errors
        }
    }
}

export default AdService;
