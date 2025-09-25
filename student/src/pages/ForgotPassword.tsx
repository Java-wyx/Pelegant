import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BlurContainer } from "@/components/ui/BlurContainer";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";  // Import Axios

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
   try {
  // Make the API call to reset the password with email in the request body
  const response = await axios.post("/api/students/forget-password", {
    email: email,  // Send the email as part of the request body
  });

  if (response.data.success) {
    setIsSubmitting(false);
    setIsSubmitted(true);
    toast({
      title: "Email Sent",
      description: "If an account exists with that email, you'll receive password reset instructions shortly.",
    });
  } else {
    setIsSubmitting(false);
    toast({
      title: "Error",
      description: response.data.message || "Something went wrong. Please try again later.",
      variant: "destructive",
    });
  }
} catch (error) {
  setIsSubmitting(false);
  toast({
    title: "Error",
    description: "An error occurred while sending the reset email. Please try again.",
    variant: "destructive",
  });
}
  };

  const containerVariants = {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
      } 
    },
  };

  const itemVariants = {
    initial: { y: 20, opacity: 0 },
    animate: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.5 } 
    },
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-6 px-4 bg-ios-background">
      <motion.div
        variants={containerVariants}
        initial="initial"
        animate="animate"
        className="w-full max-w-md"
      >
        <BlurContainer className="p-6 mb-4">
          {!isSubmitted ? (
            <motion.form 
              variants={itemVariants} 
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <div className="text-center mb-6">
                <h1 className="text-2xl font-semibold">Forgot Password</h1>
                <p className="text-sm text-muted-foreground mt-2">
                  Enter your email and we'll send you a reset link
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 pl-10"
                  />
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 bg-ios-primary hover:bg-ios-primary/90 mt-8"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Sending...
                  </div>
                ) : (
                  <div className="flex items-center justify-center w-full">
                    <Send className="mr-2 h-4 w-4" /> Reset Password
                  </div>
                )}
              </Button>

              <div className="pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => navigate("/login")}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to Login
                </Button>
              </div>
            </motion.form>
          ) : (
            <motion.div 
              variants={itemVariants}
              className="text-center space-y-6 py-4"
            >
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                  <Mail className="h-8 w-8 text-green-600" />
                </div>
              </div>
              
              <div>
                <h2 className="text-2xl font-semibold mb-2">Check Your Email</h2>
                <p className="text-muted-foreground">
                  We've sent a password reset link to <span className="font-medium">{email}</span>
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  The link will expire in 5 minutes
                </p>
              </div>
              
              <div className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate("/login")}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to Login
                </Button>
              </div>
            </motion.div>
          )}
        </BlurContainer>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
