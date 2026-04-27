import { useAuth } from "@/lib/auth/auth-context";
import {
  createRewardedAd,
  getGoogleMobileAdsEventTypes,
  getRewardedAdTestId,
  isGoogleMobileAdsAvailable,
  type RewardedAdInstance,
} from "@/lib/ads/google-mobile-ads";
import { restoreRewardedHeart, type HeartState } from "@/lib/api";
import { useCallback, useEffect, useRef, useState } from "react";

function getRewardedHeartAdUnitId() {
  if (__DEV__) {
    return getRewardedAdTestId();
  }

  return process.env.EXPO_PUBLIC_ADMOB_REWARDED_HEARTS_ID ?? null;
}

type PendingRewardRequest = {
  resolve: (didEarnReward: boolean) => void;
  reject: (error: Error) => void;
};

export function useRewardedHeartRecovery() {
  const { token, user } = useAuth();
  const adsModuleAvailable = isGoogleMobileAdsAvailable();
  const adUnitId = getRewardedHeartAdUnitId();
  const rewardedAdRef = useRef<RewardedAdInstance | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const pendingRequestRef = useRef<PendingRewardRequest | null>(null);
  const didEarnRewardRef = useRef(false);

  const [isAdReady, setIsAdReady] = useState(false);
  const [isLoadingAd, setIsLoadingAd] = useState(false);
  const [isClaimingHeart, setIsClaimingHeart] = useState(false);
  const [error, setError] = useState<string | null>(
    !adsModuleAvailable
      ? "Rewarded ads require a development build or production app."
      : adUnitId
        ? null
        : "Set EXPO_PUBLIC_ADMOB_REWARDED_HEARTS_ID to enable rewarded hearts.",
  );

  const clearPendingRequest = useCallback(() => {
    pendingRequestRef.current = null;
    didEarnRewardRef.current = false;
  }, []);

  const prepareAd = useCallback(() => {
    const eventTypes = getGoogleMobileAdsEventTypes();
    if (!adsModuleAvailable || !eventTypes) {
      setIsAdReady(false);
      setIsLoadingAd(false);
      setError("Rewarded ads require a development build or production app.");
      return;
    }

    if (!adUnitId) {
      setIsAdReady(false);
      setIsLoadingAd(false);
      setError(
        "Set EXPO_PUBLIC_ADMOB_REWARDED_HEARTS_ID to enable rewarded hearts.",
      );
      return;
    }

    unsubscribeRef.current?.();
    unsubscribeRef.current = null;

    setError(null);
    setIsAdReady(false);
    setIsLoadingAd(true);
    didEarnRewardRef.current = false;

    const rewardedAd = createRewardedAd(adUnitId, {
      requestNonPersonalizedAdsOnly: true,
      serverSideVerificationOptions: user?.id
        ? {
            userId: user.id,
            customData: "heart_restore_v1",
          }
        : undefined,
    });
    if (!rewardedAd) {
      setIsAdReady(false);
      setIsLoadingAd(false);
      setError("Rewarded ads require a development build or production app.");
      return;
    }

    rewardedAdRef.current = rewardedAd;
    unsubscribeRef.current = rewardedAd.addAdEventsListener(
      ({ type, payload }) => {
        switch (type) {
          case eventTypes.RewardedAdEventType.LOADED:
            setIsAdReady(true);
            setIsLoadingAd(false);
            break;
          case eventTypes.RewardedAdEventType.EARNED_REWARD:
            didEarnRewardRef.current = true;
            break;
          case eventTypes.AdEventType.CLOSED: {
            setIsAdReady(false);
            setIsLoadingAd(false);
            const didEarnReward = didEarnRewardRef.current;
            pendingRequestRef.current?.resolve(didEarnReward);
            clearPendingRequest();
            setTimeout(() => {
              prepareAd();
            }, 0);
            break;
          }
          case eventTypes.AdEventType.ERROR: {
            setIsAdReady(false);
            setIsLoadingAd(false);
            const adError =
              payload instanceof Error
                ? payload
                : new Error("Rewarded ad failed to load.");
            setError(adError.message);
            pendingRequestRef.current?.reject(adError);
            clearPendingRequest();
            setTimeout(() => {
              prepareAd();
            }, 0);
            break;
          }
        }
      },
    );

    rewardedAd.load();
  }, [adUnitId, adsModuleAvailable, clearPendingRequest, user?.id]);

  useEffect(() => {
    prepareAd();

    return () => {
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;
    };
  }, [prepareAd]);

  const showRewardedAd = useCallback(async () => {
    if (!adUnitId || !rewardedAdRef.current) {
      throw new Error(
        "Rewarded ads are not configured yet. Add the rewarded ad unit ID first.",
      );
    }

    if (!isAdReady) {
      throw new Error("Rewarded ad is still loading. Try again in a moment.");
    }

    if (pendingRequestRef.current) {
      throw new Error("A rewarded ad is already in progress.");
    }

    const rewardResult = new Promise<boolean>((resolve, reject) => {
      pendingRequestRef.current = { resolve, reject };
    });

    await rewardedAdRef.current.show();
    return rewardResult;
  }, [adUnitId, isAdReady]);

  const restoreOneHeartWithAd = useCallback(async (): Promise<HeartState> => {
    if (!token) {
      throw new Error("You need to be signed in to restore hearts.");
    }

    const didEarnReward = await showRewardedAd();
    if (!didEarnReward) {
      throw new Error("Finish the ad to earn 1 heart.");
    }

    setIsClaimingHeart(true);
    try {
      return await restoreRewardedHeart(token);
    } finally {
      setIsClaimingHeart(false);
    }
  }, [showRewardedAd, token]);

  return {
    error,
    isAdReady,
    isLoadingAd,
    isClaimingHeart,
    restoreOneHeartWithAd,
  };
}
