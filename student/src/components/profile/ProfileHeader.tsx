
import React from "react";
import { BlurContainer } from "@/components/ui/BlurContainer";
import { motion } from "framer-motion";
import { Edit, Pencil } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";

interface ProfileHeaderProps {
  name: string;
  email: string;
  avatar?: string;
  fallback?: string;
}

export function ProfileHeader({ name, email, avatar,fallback }: ProfileHeaderProps) {
  const navigate = useNavigate();
  
  const handleEditProfile = () => {
    navigate("/edit-profile");
  };
  
  return (
    <BlurContainer className="p-6 mb-4">
      <div className="flex items-center">
        <motion.div 
          className="relative"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <Avatar className="h-20 w-20 border-2 border-gray-200 bg-gray-100 dark:bg-gray-800 dark:border-gray-700">
            {avatar ? (
              <AvatarImage src={avatar} alt={name} className=" " />
            ) : (
             <AvatarFallback className="text-xl font-semibold text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-800">
  {fallback ? fallback : name.charAt(0)}
</AvatarFallback>

            )}
          </Avatar>
          <button 
            className="absolute bottom-0 right-0 bg-white dark:bg-black rounded-full p-1.5 shadow-md border border-gray-200 dark:border-gray-700"
            onClick={handleEditProfile}
          >
            <Edit size={14} className="text-gray-600 dark:text-gray-300" />
          </button>
        </motion.div>
        
        <div className="ml-5 flex-1">
          <motion.h2 
            className="text-xl font-semibold"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            {name}
          </motion.h2>
          <motion.p 
            className="text-sm text-muted-foreground"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            {email}
          </motion.p>
          <motion.button 
            className="flex items-center text-sm text-gray-600 dark:text-gray-300 font-medium mt-2 hover:underline"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            onClick={handleEditProfile}
          >
            <Pencil size={14} className="mr-1" />
            Edit Profile
          </motion.button>
        </div>
      </div>
    </BlurContainer>
  );
}
