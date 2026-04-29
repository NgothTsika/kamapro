import React, { createContext, useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SupportedLanguage } from "../i18n/config";

type LocaleContextType = {
  currentLanguage: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
  isInitialized: boolean;
};

const LocaleContext = createContext<LocaleContextType | null>(null);

const LANGUAGE_STORAGE_KEY = "kama_app_language";

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>("en");
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeLanguage = async () => {
      try {
        // Try to load saved language preference
        const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (savedLanguage && (savedLanguage === "en" || savedLanguage === "fr")) {
          setCurrentLanguage(savedLanguage);
          await i18n.changeLanguage(savedLanguage);
        } else {
          // Use device language detection or default to English
          const detectedLang = i18n.language?.split("-")[0] || "en";
          const lang = (detectedLang === "fr" || detectedLang === "en" ? detectedLang : "en") as SupportedLanguage;
          setCurrentLanguage(lang);
          await i18n.changeLanguage(lang);
        }
      } catch (error) {
        console.error("Error initializing language:", error);
        setCurrentLanguage("en");
        await i18n.changeLanguage("en");
      } finally {
        setIsInitialized(true);
      }
    };

    void initializeLanguage();
  }, [i18n]);

  const handleSetLanguage = async (lang: SupportedLanguage) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      setCurrentLanguage(lang);
      await i18n.changeLanguage(lang);
    } catch (error) {
      console.error("Error setting language:", error);
    }
  };

  return (
    <LocaleContext.Provider
      value={{
        currentLanguage,
        setLanguage: handleSetLanguage,
        isInitialized,
      }}
    >
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return context;
}
