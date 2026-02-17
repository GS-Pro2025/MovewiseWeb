import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en/en_translation.json";
import es from "./locales/es/es_translation.json";

const resources = {
  en: { translation: en },
  es: { translation: es },
} as const;

const getInitialLanguage = () => {
  const stored = localStorage.getItem("language");
  if (stored && stored in resources) {
    return stored;
  }

  const browserLang = navigator.language.split("-")[0];
  const detected = browserLang in resources ? browserLang : "en";

  // Log detection to verify browser language and chosen fallback.
  console.log("[i18n] browser language:", navigator.language, "detected:", detected);

  return detected;
};

const setDocumentLanguage = (lang: string) => {
  document.documentElement.lang = lang;
};

const initialLanguage = getInitialLanguage();

void i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLanguage,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
  });

setDocumentLanguage(initialLanguage);

i18n.on("languageChanged", (lang) => {
  localStorage.setItem("language", lang);
  setDocumentLanguage(lang);
});

export default i18n;
