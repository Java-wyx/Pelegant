import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Globe } from "lucide-react";
import { BlurContainer } from "@/components/ui/BlurContainer";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type LanguageOption = {
  code: string;
  name: string;
  nativeName: string;
  dir?: 'ltr' | 'rtl';
};

const LanguageSettings = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const currentLanguage = i18n.language;

  const languages: LanguageOption[] = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'zh', name: '中文', nativeName: '中文' },
    { code: 'fr', name: 'Français', nativeName: 'Français' },
    { code: 'hi', name: 'हिन्दी', nativeName: 'हिन्दी' },
    { code: 'es', name: 'Español', nativeName: 'Español' },
    { code: 'ar', name: 'العربية', nativeName: 'العربية', dir: 'rtl' }
  ];

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('i18nextLng', lng);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <div className="max-w-md mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center mb-6">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label={t('common.back')}
          >
            <ArrowLeft className="h-5 w-5 text-gray-900 dark:text-gray-100" />
          </button>
          <h1 className="text-xl font-semibold ml-2 text-gray-900 dark:text-white">
            {t('settings.language')}
          </h1>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="space-y-2"
        >
          {languages.map((lang) => (
            <BlurContainer
              key={lang.code}
              className={cn(
                "p-4 cursor-pointer transition-all duration-200",
                "hover:bg-ios-subtle/80 dark:hover:bg-gray-800/50"
              )}
              onClick={() => changeLanguage(lang.code)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="mr-3 p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <Globe className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {lang.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {lang.nativeName}
                    </p>
                  </div>
                </div>
                {currentLanguage === lang.code && (
                  <Check className="h-5 w-5 text-blue-500" />
                )}
              </div>
            </BlurContainer>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default LanguageSettings;
