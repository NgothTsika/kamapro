import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/lib/auth/auth-context";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type SubscriptionTier = "free" | "pro";
export type FeedbackCategory = "bug" | "feedback" | "feature";

export type PersonalInfo = {
  fullName: string;
  username: string;
  email: string;
  country: string;
  bio: string;
};

export type ContentPreferences = {
  notificationsEnabled: boolean;
  emailSubscriptionEnabled: boolean;
};

export type FeedbackEntry = {
  id: string;
  category: FeedbackCategory;
  subject: string;
  message: string;
  createdAt: string;
};

type StoredProfilePreferences = {
  subscriptionTier: SubscriptionTier;
  hasRestorablePurchase: boolean;
  lastPurchasedAt: string | null;
  lastRestoredAt: string | null;
  personalInfo: PersonalInfo;
  contentPreferences: ContentPreferences;
  feedbackEntries: FeedbackEntry[];
  appRating: number;
  appReview: string;
  appRatedAt: string | null;
  passwordUpdatedAt: string | null;
  deleteRequestedAt: string | null;
};

type ProfilePreferencesContextValue = StoredProfilePreferences & {
  isReady: boolean;
  purchasePro: () => Promise<void>;
  restorePurchases: () => Promise<boolean>;
  updatePersonalInfo: (next: PersonalInfo) => Promise<void>;
  updateContentPreferences: (
    next: Partial<ContentPreferences>,
  ) => Promise<void>;
  submitFeedback: (
    input: Omit<FeedbackEntry, "id" | "createdAt">,
  ) => Promise<void>;
  saveAppRating: (rating: number, review: string) => Promise<void>;
  updatePassword: () => Promise<void>;
  requestDeleteAccount: () => Promise<void>;
};

const STORAGE_KEY = "kama_profile_preferences_v1";

const ProfilePreferencesContext =
  createContext<ProfilePreferencesContextValue | null>(null);

function buildDefaultPersonalInfo(user: {
  username?: string;
  email?: string;
} | null): PersonalInfo {
  return {
    fullName: user?.username ?? "",
    username: user?.username ?? "",
    email: user?.email ?? "",
    country: "Ghana",
    bio: "Learning one story at a time.",
  };
}

function buildDefaultState(user: {
  username?: string;
  email?: string;
} | null): StoredProfilePreferences {
  return {
    subscriptionTier: "free",
    hasRestorablePurchase: false,
    lastPurchasedAt: null,
    lastRestoredAt: null,
    personalInfo: buildDefaultPersonalInfo(user),
    contentPreferences: {
      notificationsEnabled: true,
      emailSubscriptionEnabled: true,
    },
    feedbackEntries: [],
    appRating: 0,
    appReview: "",
    appRatedAt: null,
    passwordUpdatedAt: null,
    deleteRequestedAt: null,
  };
}

function mergeState(
  user: { username?: string; email?: string } | null,
  stored?: Partial<StoredProfilePreferences> | null,
): StoredProfilePreferences {
  const defaults = buildDefaultState(user);

  return {
    ...defaults,
    ...stored,
    personalInfo: {
      ...defaults.personalInfo,
      ...stored?.personalInfo,
      email: user?.email ?? stored?.personalInfo?.email ?? defaults.personalInfo.email,
    },
    contentPreferences: {
      ...defaults.contentPreferences,
      ...stored?.contentPreferences,
    },
    feedbackEntries: stored?.feedbackEntries ?? defaults.feedbackEntries,
  };
}

export function ProfilePreferencesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const [state, setState] = useState<StoredProfilePreferences>(() =>
    buildDefaultState(user),
  );
  const [isReady, setIsReady] = useState(false);
  const stateRef = useRef(state);

  const storageKey = useMemo(
    () => `${STORAGE_KEY}:${user?.id ?? "guest"}`,
    [user?.id],
  );

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    let isMounted = true;

    async function loadPreferences() {
      if (!user) {
        if (isMounted) {
          setState(buildDefaultState(null));
          setIsReady(true);
        }
        return;
      }

      setIsReady(false);

      try {
        const rawValue = await AsyncStorage.getItem(storageKey);
        const parsed = rawValue
          ? (JSON.parse(rawValue) as Partial<StoredProfilePreferences>)
          : null;

        if (isMounted) {
          setState(mergeState(user, parsed));
        }
      } catch {
        if (isMounted) {
          setState(buildDefaultState(user));
        }
      } finally {
        if (isMounted) {
          setIsReady(true);
        }
      }
    }

    void loadPreferences();

    return () => {
      isMounted = false;
    };
  }, [storageKey, user]);

  const persistState = useCallback(
    async (
      updater:
        | StoredProfilePreferences
        | ((current: StoredProfilePreferences) => StoredProfilePreferences),
    ) => {
      if (!user) {
        return;
      }

      const currentValue =
        typeof updater === "function" ? updater(stateRef.current) : updater;
      setState(currentValue);
      await AsyncStorage.setItem(storageKey, JSON.stringify(currentValue));
    },
    [storageKey, user],
  );

  const purchasePro = useCallback(async () => {
    const now = new Date().toISOString();
    await persistState((current) => ({
      ...current,
      subscriptionTier: "pro",
      hasRestorablePurchase: true,
      lastPurchasedAt: now,
    }));
  }, [persistState]);

  const restorePurchases = useCallback(async () => {
    if (!state.hasRestorablePurchase) {
      return false;
    }

    const now = new Date().toISOString();
    await persistState((current) => ({
      ...current,
      subscriptionTier: "pro",
      lastRestoredAt: now,
    }));
    return true;
  }, [persistState, state.hasRestorablePurchase]);

  const updatePersonalInfo = useCallback(
    async (next: PersonalInfo) => {
      await persistState((current) => ({
        ...current,
        personalInfo: {
          ...next,
          email: user?.email ?? current.personalInfo.email,
        },
      }));
    },
    [persistState, user?.email],
  );

  const updateContentPreferences = useCallback(
    async (next: Partial<ContentPreferences>) => {
      await persistState((current) => ({
        ...current,
        contentPreferences: {
          ...current.contentPreferences,
          ...next,
        },
      }));
    },
    [persistState],
  );

  const submitFeedback = useCallback(
    async (input: Omit<FeedbackEntry, "id" | "createdAt">) => {
      await persistState((current) => ({
        ...current,
        feedbackEntries: [
          {
            ...input,
            id: `${Date.now()}`,
            createdAt: new Date().toISOString(),
          },
          ...current.feedbackEntries,
        ],
      }));
    },
    [persistState],
  );

  const saveAppRating = useCallback(
    async (rating: number, review: string) => {
      await persistState((current) => ({
        ...current,
        appRating: rating,
        appReview: review,
        appRatedAt: new Date().toISOString(),
      }));
    },
    [persistState],
  );

  const updatePassword = useCallback(async () => {
    await persistState((current) => ({
      ...current,
      passwordUpdatedAt: new Date().toISOString(),
    }));
  }, [persistState]);

  const requestDeleteAccount = useCallback(async () => {
    await persistState((current) => ({
      ...current,
      deleteRequestedAt: new Date().toISOString(),
    }));
  }, [persistState]);

  const value = useMemo(
    () => ({
      ...state,
      isReady,
      purchasePro,
      restorePurchases,
      updatePersonalInfo,
      updateContentPreferences,
      submitFeedback,
      saveAppRating,
      updatePassword,
      requestDeleteAccount,
    }),
    [
      isReady,
      purchasePro,
      requestDeleteAccount,
      restorePurchases,
      saveAppRating,
      state,
      submitFeedback,
      updateContentPreferences,
      updatePassword,
      updatePersonalInfo,
    ],
  );

  return (
    <ProfilePreferencesContext.Provider value={value}>
      {children}
    </ProfilePreferencesContext.Provider>
  );
}

export function useProfilePreferences() {
  const context = useContext(ProfilePreferencesContext);

  if (!context) {
    throw new Error(
      "useProfilePreferences must be used inside ProfilePreferencesProvider",
    );
  }

  return context;
}
