import { AdMob, RewardAdOptions, RewardAdPluginEvents, AdMobRewardItem } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

export class AdService {
    static isInitialized = false;

    static async initialize() {
        if (!Capacitor.isNativePlatform()) {
            console.log('AdMob: Skipping native initialization on web platform.');
            return;
        }

        try {
            await AdMob.initialize({
                initializeForTesting: true,
            });
            this.isInitialized = true;
            console.log('AdMob initialized successfully');
        } catch (e) {
            console.error('AdMob initialization failed:', e);
        }
    }

    static async showRewardVideo(onReward: () => void, onError?: () => void) {
        if (!Capacitor.isNativePlatform()) {
            console.log('AdMob: Faking reward ad for web testing.');
            setTimeout(() => onReward(), 1500); // Simulate an ad sequence
            return;
        }

        try {
            const options: RewardAdOptions = {
                adId: import.meta.env.VITE_ADMOB_REWARD_AD_ID, // ✅ ENV VAR'DAN YÜKLENIYOR
            };
            
            await AdMob.prepareRewardVideoAd(options);
            
            // Set up a one-time listener for the reward
            const rewardListener = await AdMob.addListener(RewardAdPluginEvents.Rewarded, (rewardItem: AdMobRewardItem) => {
                console.log('AdMob Reward received:', rewardItem);
                onReward();
                rewardListener.remove();
            });

            const failListener = await AdMob.addListener(RewardAdPluginEvents.FailedToLoad, () => {
                if (onError) onError();
                failListener.remove();
            });

            await AdMob.showRewardVideoAd();

        } catch (error) {
            console.error('Failed to show reward ad:', error);
            if(onError) onError();
        }
    }

    static async showInterstitial(onComplete: () => void) {
        if (!Capacitor.isNativePlatform()) {
             console.log('AdMob: Faking interstitial ad for web.');
             onComplete();
             return;
        }
        
        try {
            await AdMob.prepareInterstitial({
                adId: import.meta.env.VITE_ADMOB_INTERSTITIAL_AD_ID, // ✅ ENV VAR'DAN YÜKLENIYOR
            });
            await AdMob.showInterstitial();
            onComplete();
        } catch (e) {
            console.error('Failed to show interstitial:', e);
            onComplete();
        }
    }
}
