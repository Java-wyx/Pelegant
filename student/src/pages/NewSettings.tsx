import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Globe, Moon, Sun, Bell, Lock, HelpCircle, Info, ChevronRight } from "lucide-react";
import { BlurContainer } from "@/components/ui/BlurContainer";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type SettingItem = {
  id: string;
  icon: React.ElementType;
  label: string;
  description: string;
  color: string;
  route: string;
  action?: () => void;
};

const Settings = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) return savedTheme;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  // Apply theme
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const settings: SettingItem[] = [
    {
      id: 'language',
      icon: Globe,
      label: t('settings.language'),
      description: i18n.language === 'en' ? 'English' : '中文',
      color: "text-blue-500 dark:text-blue-400",
      route: "/settings/language"
    },
    {
      id: 'appearance',
      icon: theme === 'dark' ? Moon : Sun,
      label: t('settings.appearance'),
      description: theme === 'dark' ? t('settings.darkMode') : t('settings.lightMode'),
      color: "text-yellow-500 dark:text-yellow-400",
      route: "",
      action: toggleTheme
    },
    {
      id: 'notifications',
      icon: Bell,
      label: t('settings.notifications'),
      description: t('settings.notificationsDescription'),
      color: "text-purple-500 dark:text-purple-400",
      route: "/settings/notifications"
    },
    {
      id: 'privacy',
      icon: Lock,
      label: t('settings.privacy'),
      description: t('settings.privacyDescription'),
      color: "text-red-500 dark:text-red-400",
      route: "/settings/privacy"
    },
    {
      id: 'help',
      icon: HelpCircle,
      label: t('settings.help'),
      description: t('settings.helpDescription'),
      color: "text-emerald-500 dark:text-emerald-400",
      route: "/help-support"
    },
    {
      id: 'about',
      icon: Info,
      label: t('settings.about'),
      description: t('settings.aboutDescription'),
      color: "text-blue-500 dark:text-blue-400",
      route: "/about"
    }
  ];

  const containerVariants = {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 }
  };

  const handleItemClick = (route: string, action?: () => void) => {
    if (action) {
      action();
    } else if (route) {
      navigate(route);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <motion.div 
        className="max-w-md mx-auto px-4 py-6"
        variants={containerVariants}
        initial="initial"
        animate="animate"
      >
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
            {t('settings.title')}
          </h1>
        </div>

        <motion.div 
          className="space-y-2.5"
          variants={itemVariants}
        >
          {settings.map((item) => (
            <BlurContainer 
              key={item.id}
              className={cn(
                "p-3.5 cursor-pointer transition-all duration-200",
                "hover:bg-ios-subtle/80 dark:hover:bg-gray-800/50"
              )}
              onClick={() => handleItemClick(item.route, item.action)}
            >
              <div className="flex items-center">
                <div className="mr-3 p-2 rounded-full bg-opacity-20" style={{ backgroundColor: `${item.color.split(' ')[0].replace('text-', '')}20` }}>
                  <item.icon className={cn("h-5 w-5", item.color)} />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {item.label}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {item.description}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </BlurContainer>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Settings;
