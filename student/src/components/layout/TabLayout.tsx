
import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { TabBar } from "./TabBar";
import { AnimatePresence, motion } from "framer-motion";

interface TabLayoutProps {
  children?: React.ReactNode;
}

export function TabLayout({ children }: TabLayoutProps) {
  const location = useLocation();

  // Determine if the transition is between Home and job details
  const isJobDetailsTransition = location.pathname.includes('/job/');

  // Simplified page transition variants with reduced animation for job details
  const pageVariants = {
    initial: {
      opacity: isJobDetailsTransition ? 0.9 : 0,
    },
    in: {
      opacity: 1,
    },
    out: {
      opacity: isJobDetailsTransition ? 0.9 : 0,
    },
  };

  return (
    <div className="flex flex-col h-screen bg-ios-background overflow-hidden">
      <div className="flex-1 overflow-auto pb-14">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={{ 
              duration: isJobDetailsTransition ? 0.1 : 0.2, 
              ease: "easeInOut" 
            }}
            className="h-full"
          >
            {children || <Outlet />}
          </motion.div>
        </AnimatePresence>
      </div>
      <TabBar />
    </div>
  );
}
