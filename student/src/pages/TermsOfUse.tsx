
import React from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { BlurContainer } from "@/components/ui/BlurContainer";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const TermsOfUse = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const containerVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 }
  };
  
  const termsItems = [
    {
      key: 'acceptance',
      title: t('terms.acceptance.title'),
      content: t('terms.acceptance.content')
    },
    {
      key: 'accounts',
      title: t('terms.accounts.title'),
      content: t('terms.accounts.content')
    },
    {
      key: 'content',
      title: t('terms.content.title'),
      content: t('terms.content.content')
    },
    {
      key: 'privacy',
      title: t('terms.privacy.title'),
      content: t('terms.privacy.content')
    },
    {
      key: 'modifications',
      title: t('terms.modifications.title'),
      content: t('terms.modifications.content')
    },
    {
      key: 'termination',
      title: t('terms.termination.title'),
      content: t('terms.termination.content')
    }
  ];
  
  return (
    <div className="min-h-screen bg-background py-6 px-4 max-w-md mx-auto">
      <motion.div
        variants={containerVariants}
        initial="initial"
        animate="animate"
        className="space-y-6"
      >
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label={t('common.back')}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-semibold">{t('terms.title')}</h1>
          <div className="w-10"></div> {/* For alignment */}
        </div>
        
        <BlurContainer className="p-6">
          <p className="text-sm text-muted-foreground mb-6">
            {t('terms.lastUpdated', { date: '2024-09-25' })}
          </p>
          
          <p className="mb-6 text-sm">
            {t('terms.intro')}
          </p>
          
          <Accordion type="single" collapsible className="w-full space-y-4">
            {termsItems.map((item) => (
              <AccordionItem key={item.key} value={item.key} className="border-b">
                <AccordionTrigger className="text-left text-sm font-medium hover:no-underline">
                  {item.title}
                </AccordionTrigger>
                <AccordionContent className="pt-2 text-muted-foreground">
                  <p className="text-sm">{item.content}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </BlurContainer>
      </motion.div>
    </div>
  );
};

export default TermsOfUse;
