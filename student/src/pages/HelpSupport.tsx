
import React from "react";
import { motion } from "framer-motion";
import { ArrowLeft, FileText, MessageSquare } from "lucide-react";
import { BlurContainer } from "@/components/ui/BlurContainer";
import { useNavigate } from "react-router-dom";

const HelpSupport = () => {
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
  
  const supportItems = [
    { 
      icon: FileText, 
      label: "Terms of Use", 
      description: "Review our terms and conditions",
      color: "text-blue-500",
      route: "/terms-of-use"
    },
    { 
      icon: MessageSquare, 
      label: "Feedback", 
      description: "Share your thoughts with us",
      color: "text-emerald-500",
      route: "/feedback"
    }
  ];

  const handleItemClick = (route: string) => {
    if (route) {
      navigate(route);
    }
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
            onClick={() => navigate("/profile")}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 mr-3"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-semibold text-foreground">Help & Support</h1>
        </motion.div>
        
        <motion.div 
          variants={itemVariants}
          className="space-y-4"
        >
          {supportItems.map((item, index) => (
            <BlurContainer 
              key={index}
              className={cn(
                "p-4 cursor-pointer transition-all duration-200 hover:shadow-md",
                "hover:bg-ios-subtle/80"
              )}
              onClick={() => handleItemClick(item.route)}
            >
              <div className="flex items-center">
                <div className="mr-4 p-2 rounded-full bg-gray-100 dark:bg-gray-800">
                  <item.icon className={cn("h-5 w-5", item.color)} />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-foreground">
                    {item.label}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>
                <ArrowLeft className="h-4 w-4 text-muted-foreground rotate-180" />
              </div>
            </BlurContainer>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default HelpSupport;

// Helper function to merge class names
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
