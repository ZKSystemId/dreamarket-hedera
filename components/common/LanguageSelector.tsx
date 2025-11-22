"use client";

import { useState, useRef, useEffect } from "react";
import { Globe, Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage, UI_LANGUAGES } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

export function LanguageSelector() {
  const { uiLanguage, uiLanguageInfo, setUILanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(!open)}
        className="gap-2 text-muted-foreground hover:text-foreground"
      >
        <Globe className="h-4 w-4" />
        <span className="hidden sm:inline text-sm">{uiLanguageInfo.flag} {uiLanguageInfo.nativeName}</span>
        <span className="sm:hidden text-sm">{uiLanguageInfo.flag}</span>
        <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
      </Button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-lg border border-white/10 bg-background/95 backdrop-blur-xl shadow-xl z-50">
          <div className="px-3 py-2 text-xs font-semibold text-muted-foreground border-b border-white/10">
            UI Language
          </div>
          <div className="py-1">
            {UI_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setUILanguage(lang.code);
                  setOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-purple-500/10 transition-colors",
                  uiLanguage === lang.code && "bg-purple-500/10"
                )}
              >
                <span className="text-lg">{lang.flag}</span>
                <span className="flex-1 text-left">{lang.nativeName}</span>
                {uiLanguage === lang.code && (
                  <Check className="h-4 w-4 text-purple-400" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
