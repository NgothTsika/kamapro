import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-react-native-language-detector";
import en from "./locales/en.json";
import fr from "./locales/fr.json";

// Polyfill for Intl.PluralRules if not available
if (!Intl.PluralRules) {
  // @ts-ignore
  Intl.PluralRules = class {
    locale: string;
    constructor(locale?: string) {
      this.locale = locale || "en";
    }
    select(n: number): string {
      if (n === 1) return "one";
      return "other";
    }
  };
}

export const supportedLanguages = {
  en: { name: "English", nativeName: "English" },
  fr: { name: "Français", nativeName: "Français" },
};

export type SupportedLanguage = keyof typeof supportedLanguages;

export const resources = {
  en: { translation: en },
  fr: { translation: fr },
};

i18next
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "en",
    supportedLngs: Object.keys(supportedLanguages),
    resources,
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    ns: ["translation"],
    defaultNS: "translation",
  });

export default i18next;
