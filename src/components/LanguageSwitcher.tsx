import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function LanguageSwitcher() {
  const [currentLang, setCurrentLang] = useState("en");

  useEffect(() => {
    // Load saved language from localStorage
    const savedLang = localStorage.getItem("lang") || "en";
    setCurrentLang(savedLang);
    
    // Initialize i18n if available
    if (typeof window !== 'undefined' && (window as any).i18n) {
      (window as any).i18n.changeLanguage(savedLang);
    }
  }, []);

  const switchLanguage = (lang: string) => {
    setCurrentLang(lang);
    localStorage.setItem("lang", lang);
    
    // Call i18n.changeLanguage if available
    if (typeof window !== 'undefined' && (window as any).i18n) {
      (window as any).i18n.changeLanguage(lang);
    }
    
    // Trigger custom event for components that need to react to language change
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
  };

  return (
    <div className="flex items-center space-x-1">
      <Button
        variant={currentLang === "en" ? "default" : "ghost"}
        size="sm"
        onClick={() => switchLanguage("en")}
        className="text-xs"
      >
        EN
      </Button>
      <Button
        variant={currentLang === "fr" ? "default" : "ghost"}
        size="sm"
        onClick={() => switchLanguage("fr")}
        className="text-xs"
      >
        FR
      </Button>
    </div>
  );
}