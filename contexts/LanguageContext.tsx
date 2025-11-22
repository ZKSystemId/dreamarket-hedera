"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

// UI Language for frontend (always all languages available)
export type UILanguage = "en" | "id";

export interface UILanguageInfo {
  code: UILanguage;
  name: string;
  nativeName: string;
  flag: string;
}

export const UI_LANGUAGES: UILanguageInfo[] = [
  { code: "en", name: "English", nativeName: "English", flag: "🇺🇸" },
  { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia", flag: "🇮🇩" },
];

interface LanguageContextType {
  uiLanguage: UILanguage;
  uiLanguageInfo: UILanguageInfo;
  setUILanguage: (lang: UILanguage) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [uiLanguage, setUILanguageState] = useState<UILanguage>("en");

  // Load UI language from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem("dreammarket_ui_language") as UILanguage;
    if (savedLanguage && UI_LANGUAGES.find(l => l.code === savedLanguage)) {
      setUILanguageState(savedLanguage);
    }
  }, []);

  const setUILanguage = (lang: UILanguage) => {
    setUILanguageState(lang);
    localStorage.setItem("dreammarket_ui_language", lang);
    console.log(`🌍 UI Language changed to: ${lang}`);
  };

  const uiLanguageInfo = UI_LANGUAGES.find(l => l.code === uiLanguage) || UI_LANGUAGES[0];

  return (
    <LanguageContext.Provider
      value={{
        uiLanguage,
        uiLanguageInfo,
        setUILanguage,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
