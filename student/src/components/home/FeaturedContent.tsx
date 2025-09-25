
import React from "react";
import { BlurContainer } from "@/components/ui/BlurContainer";
import { motion } from "framer-motion";

export function FeaturedContent() {
  const containerVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5,
        delay: 0.2,
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
    >
      <BlurContainer className="overflow-hidden">
        <div className="p-4">
          <h3 className="text-lg font-medium mb-3">Featured</h3>
          <motion.div 
            className="relative aspect-video rounded-lg bg-gradient-to-br from-ios-primary/20 to-ios-secondary/20 overflow-hidden mb-3"
            variants={itemVariants}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-ios-primary font-medium">Featured Image</span>
            </div>
          </motion.div>
          
          <motion.p 
            className="text-sm text-muted-foreground mb-4"
            variants={itemVariants}
          >
            Discover the latest and greatest in our curated collection
          </motion.p>
          
          <motion.div 
            className="flex justify-between items-center"
            variants={itemVariants}
          >
            <span className="text-xs text-muted-foreground">Updated today</span>
            <button className="text-sm font-medium text-ios-primary">
              View All →
            </button>
          </motion.div>
        </div>
      </BlurContainer>
    </motion.div>
  );
}
