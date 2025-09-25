
import React from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { BlurContainer } from "@/components/ui/BlurContainer";
import { useNavigate } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const TermsOfUse = () => {
  const navigate = useNavigate();
  
  const containerVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 }
  };
  
  const termsItems = [
    {
      title: "Acceptance of Terms",
      content: "By accessing or using our service, you agree to be bound by these Terms of Use. If you do not agree to these terms, please do not use our service."
    },
    {
      title: "User Accounts",
      content: "You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account."
    },
    {
      title: "Content Guidelines",
      content: "Users may not post content that is illegal, harmful, threatening, abusive, harassing, defamatory, or otherwise objectionable."
    },
    {
      title: "Privacy Policy",
      content: "Your use of our service is also governed by our Privacy Policy, which outlines how we collect, use, and protect your information."
    },
    {
      title: "Service Modifications",
      content: "We reserve the right to modify or discontinue, temporarily or permanently, the service with or without notice."
    },
    {
      title: "Termination",
      content: "We may terminate or suspend your account immediately, without prior notice, for conduct that we believe violates these Terms of Use."
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
        <div className="flex items-center mb-6">
          <button 
            onClick={() => navigate("/help-support")}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 mr-3"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-semibold text-foreground">Terms of Use</h1>
        </div>
        
        <BlurContainer className="p-4">
          <p className="text-sm text-muted-foreground mb-4">
            Last updated: April 3, 2025
          </p>
          
          <p className="mb-4">
            Please read these terms of use carefully before using our application.
          </p>
          
          <Separator className="my-4" />
          
          <Accordion type="single" collapsible className="w-full">
            {termsItems.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {item.title}
                </AccordionTrigger>
                <AccordionContent>
                  {item.content}
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
