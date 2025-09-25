
import React from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { BlurContainer } from "@/components/ui/BlurContainer";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

const PrivacyPolicy = () => {
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
          <h1 className="text-xl font-semibold text-foreground">Privacy Policy</h1>
        </motion.div>
        
        <motion.div 
          variants={itemVariants}
        >
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <h2 className="text-lg font-medium">Our Privacy Commitment</h2>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p>
                We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you about how we look after your personal data when you visit our application and tell you about your privacy rights and how the law protects you.
              </p>
              
              <h3 className="font-medium text-base mt-4">Information We Collect</h3>
              <p>
                We collect information that you provide directly to us, such as when you create or modify your account, request services, or contact customer support. This may include:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Personal identification information (Name, email address, phone number)</li>
                <li>Profile information (Resume, professional details, preferences)</li>
                <li>Account credentials</li>
              </ul>
              
              <h3 className="font-medium text-base mt-4">How We Use Your Information</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>To provide, maintain, and improve our services</li>
                <li>To process and complete transactions</li>
                <li>To send you technical notices and support messages</li>
                <li>To respond to your comments, questions, and customer service requests</li>
              </ul>
              
              <h3 className="font-medium text-base mt-4">Your Rights</h3>
              <p>
                You have the right to:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Access your personal data</li>
                <li>Request correction of your personal data</li>
                <li>Request deletion of your personal data</li>
                <li>Object to processing of your personal data</li>
                <li>Request restriction of processing your personal data</li>
                <li>Request transfer of your personal data</li>
              </ul>
              
              <p className="text-muted-foreground text-xs mt-6">
                Last updated: April 3, 2025
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default PrivacyPolicy;
