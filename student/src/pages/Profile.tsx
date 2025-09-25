
import React, { useEffect } from "react";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { BlurContainer } from "@/components/ui/BlurContainer";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import { ChevronRight, Shield, HelpCircle, LogOut, Briefcase, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth";
import { toast } from "sonner";

const Profile = () => {
  const navigate = useNavigate();
  const userInfo = useAuthStore(state => state.userInfo);

   useEffect(() => {
    console.log("User Info from store:", userInfo);
  }, [userInfo]);
const backendUrl = window.location.origin.replace(/:\d+$/, ":8080");
const avatarUrl = userInfo?.avatar
  ? `${backendUrl}/api/files${String(userInfo.avatar).replace(/\\/g, "/")}`
  : undefined;
console.log(avatarUrl)


  // 获取昵称首字母（作为备用头像）
  const fallbackLetter = (userInfo?.nickname || "U").charAt(0).toUpperCase();




  
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
  
  const menuItems = [
    { 
      icon: Briefcase, 
      label: "My Jobs", 
      description: "View applied and saved jobs",
      color: "text-blue-500 dark:text-blue-400",
      route: "/my-jobs"
    },
    { 
      icon: FileText, 
      label: "My Resume", 
      description: "View and update your resume",
      color: "text-emerald-500 dark:text-emerald-400",
      route: "/my-resume"
    },
    { 
      icon: Shield, 
      label: "Account Security", 
      description: "Update password and security settings",
      color: "text-purple-500 dark:text-purple-400",
      route: "/account-security"
    },
    { 
      icon: HelpCircle, 
      label: "Help & Support", 
      description: "Get help or contact support",
      color: "text-emerald-500 dark:text-emerald-400",
      route: "/help-support"
    }
  ];

  const logoutItem = {
    label: "Log Out", 
    color: "text-gray-500",
  };

  const handleMenuItemClick = (route: string) => {
    if (route) {
      navigate(route);
    }
  };

  const handleLogout = () => {
    // In a real application, you would call your auth service's logout function here
    // For example: authService.logout();
    
    // Show a success toast
    toast.success("You have been logged out", {
      description: "Redirecting to login page..."
    });
    
    // Simulate a short delay before redirecting (to show the toast)
    setTimeout(() => {
      // Redirect to the login page
      navigate("/login");
    }, 1500);
  };

  return (
    <div className="min-h-screen py-4 px-4 max-w-md mx-auto">
      <motion.div
        variants={containerVariants}
        initial="initial"
        animate="animate"
        className="space-y-4"
      >
        <motion.div variants={itemVariants}>
          <ProfileHeader 
            name={userInfo?.nickname || "User"}
            email={userInfo?.email || ""}
            avatar={avatarUrl}
            fallback={(userInfo?.nickname || "U").charAt(0).toUpperCase()}
          />
        </motion.div>
        
        <motion.div 
          className="space-y-2.5"
          variants={itemVariants}
        >
          {menuItems.map((item, index) => (
            <BlurContainer 
              key={index}
              className={cn(
                "p-3.5 cursor-pointer transition-all duration-200",
                "hover:bg-ios-subtle/80"
              )}
              onClick={() => handleMenuItemClick(item.route)}
            >
              <div className="flex items-center">
                <div className="mr-3">
                  <item.icon className={cn("h-5 w-5", item.color)} />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">
                    {item.label}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {item.description}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </BlurContainer>
          ))}
        </motion.div>
        
        {/* Logout section as a standalone module */}
        <motion.div variants={itemVariants} className="pt-2">
          <Separator className="my-2 bg-gray-200 dark:bg-gray-700" />
          
          <button 
            className="flex w-full items-center justify-center py-3 text-sm font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            {logoutItem.label}
          </button>
          
          <Separator className="mt-2 bg-gray-200 dark:bg-gray-700" />
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Profile;

// Helper function to merge class names
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
