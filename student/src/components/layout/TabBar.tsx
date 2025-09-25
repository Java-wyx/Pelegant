
import React from "react";
import { Home, Search, User } from "lucide-react";
import { NavLink } from "react-router-dom";
import { BlurContainer } from "../ui/BlurContainer";
import { motion } from "framer-motion";

export function TabBar() {
  const tabs = [
    {
      name: "Home",
      path: "/",
      icon: Home,
    },
    {
      name: "Search",
      path: "/search",
      icon: Search,
    },
    {
      name: "Me",
      path: "/profile",
      icon: User,
    },
  ];

  // Animation variants for tab indicator
  const tabVariants = {
    initial: { scale: 0.9, opacity: 0 },
    active: { scale: 1, opacity: 1 },
    inactive: { scale: 1, opacity: 0.6 },
  };

  // Animation variants for icon
  const iconVariants = {
    active: { scale: 1.1, y: -2 },
    inactive: { scale: 1, y: 0 },
  };

  return (
    <BlurContainer
      intensity="medium"
      className="fixed bottom-0 left-0 right-0 max-w-md mx-auto mb-1.5 rounded-lg overflow-hidden"
    >
      <div className="flex items-center justify-around h-12 px-2">
        {tabs.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            end={tab.path === "/"}
            className="flex-1"
          >
            {({ isActive }) => (
              <motion.div
                className="flex flex-col items-center justify-center h-full"
                initial="inactive"
                animate={isActive ? "active" : "inactive"}
                variants={tabVariants}
                transition={{ duration: 0.2 }}
              >
                <motion.div variants={iconVariants}>
                  <tab.icon
                    size={20}
                    className={`${
                      isActive ? "text-ios-primary" : "text-gray-500"
                    }`}
                  />
                </motion.div>
                <motion.span
                  className={`text-[10px] mt-0.5 ${
                    isActive ? "text-ios-primary font-medium" : "text-gray-500"
                  }`}
                >
                  {tab.name}
                </motion.span>
              </motion.div>
            )}
          </NavLink>
        ))}
      </div>
    </BlurContainer>
  );
}
