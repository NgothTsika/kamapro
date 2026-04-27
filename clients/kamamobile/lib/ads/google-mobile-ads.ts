import Constants from "expo-constants";

type RewardedAdEvent = {
  payload?: unknown;
  type: string;
};

export type RewardedAdInstance = {
  addAdEventsListener: (
    listener: (event: RewardedAdEvent) => void,
  ) => () => void;
  load: () => void;
  show: () => Promise<void>;
};

type GoogleMobileAdsModule = {
  AdEventType: {
    CLOSED: string;
    ERROR: string;
  };
  RewardedAd: {
    createForAdRequest: (
      adUnitId: string,
      requestOptions?: Record<string, unknown>,
    ) => RewardedAdInstance;
  };
  RewardedAdEventType: {
    EARNED_REWARD: string;
    LOADED: string;
  };
  TestIds: {
    REWARDED: string;
  };
};

let cachedModule: GoogleMobileAdsModule | null | undefined;

function isExpoGo() {
  return (
    Constants.appOwnership === "expo" ||
    Constants.executionEnvironment === "storeClient"
  );
}

function loadGoogleMobileAdsModule(): GoogleMobileAdsModule | null {
  if (cachedModule !== undefined) {
    return cachedModule;
  }

  if (isExpoGo()) {
    cachedModule = null;
    return cachedModule;
  }

  try {
    cachedModule =
      require("react-native-google-mobile-ads") as GoogleMobileAdsModule;
  } catch {
    cachedModule = null;
  }

  return cachedModule;
}

export function isGoogleMobileAdsAvailable() {
  return loadGoogleMobileAdsModule() !== null;
}

export function getRewardedAdTestId() {
  return loadGoogleMobileAdsModule()?.TestIds.REWARDED ?? null;
}

export function getGoogleMobileAdsEventTypes() {
  const module = loadGoogleMobileAdsModule();
  if (!module) {
    return null;
  }

  return {
    AdEventType: module.AdEventType,
    RewardedAdEventType: module.RewardedAdEventType,
  };
}

export function createRewardedAd(
  adUnitId: string,
  requestOptions?: Record<string, unknown>,
) {
  const module = loadGoogleMobileAdsModule();
  if (!module) {
    return null;
  }

  return module.RewardedAd.createForAdRequest(adUnitId, requestOptions);
}
