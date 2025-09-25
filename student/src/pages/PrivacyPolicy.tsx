
import React from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { BlurContainer } from "@/components/ui/BlurContainer";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

const PrivacyPolicy = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const containerVariants = {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 }
  };
  
  return (
    <div className="min-h-screen bg-background py-6 px-4 max-w-md mx-auto">
      <motion.div
        variants={containerVariants}
        initial="initial"
        animate="animate"
        className="space-y-6"
      >
        <motion.div 
          variants={itemVariants}
          className="flex items-center mb-6"
        >
          <button 
            onClick={() => navigate("/account-security")}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 mr-3"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-semibold text-foreground">{t('privacy.title')}</h1>
        </motion.div>
        
        <motion.div 
          variants={itemVariants}
        >
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <h2 className="text-lg font-medium">{t('privacy.sections.commitment.title')}</h2>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p>{t('privacy.sections.commitment.content')}</p>
              
              <h3 className="font-medium text-base mt-4">{t('privacy.sections.collection.title')}</h3>
              <p>{t('privacy.sections.collection.content')}</p>
              <ul className="list-disc pl-5 space-y-1">
                {(t('privacy.sections.collectionItems', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
              
              <h3 className="font-medium text-base mt-4">{t('privacy.sections.usage.title')}</h3>
              <p>{t('privacy.sections.usage.content')}</p>
              <ul className="list-disc pl-5 space-y-1">
                {(t('privacy.sections.usageItems', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
              
              <h3 className="font-medium text-base mt-4">{t('privacy.sections.rights.title')}</h3>
              <p>{t('privacy.sections.rights.content')}</p>
              <ul className="list-disc pl-5 space-y-1">
                {(t('privacy.sections.rightsItems', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
              
              <p className="text-muted-foreground text-xs mt-6">
                {t('privacy.lastUpdated', { date: '2025年4月3日' })}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default PrivacyPolicy;
