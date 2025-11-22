"use client";

import { useState, useRef, useEffect } from "react";
import { Languages, Check, ChevronDown, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  getUnlockedLanguages, 
  getLockedLanguages,
  Language,
  LanguageInfo 
} from "@/lib/languageSystem";

interface AILanguageSelectorProps {
  soulLevel: number;
  selectedLanguage: Language;
  onLanguageChange: (lang: Language) => void;
}

export function AILanguageSelector({ 
  soulLevel, 
  selectedLanguage, 
  onLanguageChange 
}: AILanguageSelectorProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unlockedLanguages = getUnlockedLanguages(soulLevel);
  const lockedLanguages = getLockedLanguages(soulLevel);

  // Auto-reset to English if selected language is not unlocked
  useEffect(() => {
    const isUnlocked = unlockedLanguages.some(l => l.code === selectedLanguage);
    if (!isUnlocked && selectedLanguage !== "en") {
      console.log(`⚠️ Language ${selectedLanguage} not unlocked for level ${soulLevel}. Resetting to English.`);
      onLanguageChange("en");
    }
  }, [soulLevel, selectedLanguage, unlockedLanguages, onLanguageChange]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  // Find selected language info (check both unlocked and locked)
  const allLanguages = [...unlockedLanguages, ...lockedLanguages];
  const selectedLangInfo = allLanguages.find(l => l.code === selectedLanguage) || unlockedLanguages[0];
  
  // Check if selected language is actually unlocked
  const isSelectedUnlocked = unlockedLanguages.some(l => l.code === selectedLanguage);

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(!open)}
        className="gap-2 text-muted-foreground hover:text-foreground"
      >
        <Languages className="h-4 w-4" />
        <span className="text-sm">
          {selectedLangInfo.flag} {selectedLangInfo.nativeName}
          {!isSelectedUnlocked && <span className="text-red-400 ml-1">🔒</span>}
        </span>
        <Badge variant="outline" className="text-xs">
          {unlockedLanguages.length}/8
        </Badge>
        <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
      </Button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 rounded-lg border border-white/10 bg-background/95 backdrop-blur-xl shadow-xl z-50 max-h-96 overflow-y-auto">
          {/* Header */}
          <div className="px-3 py-2 border-b border-white/10 sticky top-0 bg-background/95 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">
                AI Response Language
              </span>
              <Badge variant="secondary" className="text-xs">
                Level {soulLevel}
              </Badge>
            </div>
          </div>

          {/* Unlocked Languages */}
          <div className="py-1">
            <div className="px-3 py-1.5 text-xs font-semibold text-green-400">
              ✓ Unlocked ({unlockedLanguages.length})
            </div>
            {unlockedLanguages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  onLanguageChange(lang.code);
                  setOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-purple-500/10 transition-colors",
                  selectedLanguage === lang.code && "bg-purple-500/10"
                )}
              >
                <span className="text-lg">{lang.flag}</span>
                <span className="flex-1 text-left">{lang.nativeName}</span>
                {selectedLanguage === lang.code && (
                  <Check className="h-4 w-4 text-purple-400" />
                )}
              </button>
            ))}
          </div>

          {/* Locked Languages */}
          {lockedLanguages.length > 0 && (
            <div className="py-1 border-t border-white/10">
              <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <Lock className="h-3 w-3" />
                Locked ({lockedLanguages.length})
              </div>
              {lockedLanguages.map((lang) => (
                <div
                  key={lang.code}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm opacity-50 cursor-not-allowed"
                >
                  <span className="text-lg grayscale">{lang.flag}</span>
                  <span className="flex-1 text-left">{lang.nativeName}</span>
                  <Badge variant="outline" className="text-xs">
                    Lv {lang.unlockLevel}
                  </Badge>
                </div>
              ))}
            </div>
          )}

          {/* Footer Info */}
          <div className="px-3 py-2 border-t border-white/10 bg-purple-500/5">
            <p className="text-xs text-muted-foreground">
              💡 <strong>Level up</strong> to unlock more languages!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
