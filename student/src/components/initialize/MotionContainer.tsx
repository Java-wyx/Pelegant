
import React from "react";
import { motion } from "framer-motion";

interface MotionContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const MotionContainer: React.FC<MotionContainerProps> = ({ children, className = "" }) => {
  const containerVariants = {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
      } 
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const MotionItem: React.FC<MotionContainerProps> = ({ children, className = "" }) => {
  const itemVariants = {
    initial: { y: 20, opacity: 0 },
    animate: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.5 } 
    },
  };

  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  );
};
