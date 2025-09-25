
import React, { useState } from "react";
import { updatePassword } from "@/api/login";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { KeyRound, ArrowLeft, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BlurContainer } from "@/components/ui/BlurContainer";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

const ChangePassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all password fields",
        variant: "destructive",
      });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      await updatePassword({
        oldPassword: currentPassword,
        newPassword: newPassword,
        t: (key: string) => key, // 简单翻译函数占位
      });
      
      toast({
        title: "Success",
        description: "Password has been changed successfully",
      });
      navigate("/account-security");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to change password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
    initial: { y: 10, opacity: 0 },
    animate: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.3 } 
    },
  };

  return (
    <div className="min-h-screen py-4 px-4 max-w-md mx-auto">
      <motion.div
        variants={containerVariants}
        initial="initial"
        animate="animate"
        className="space-y-4"
      >
        <motion.div 
          variants={itemVariants}
          className="flex items-center mb-2"
        >
          <button 
            onClick={() => navigate("/account-security")}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-semibold">Change Password</h1>
        </motion.div>

        <motion.div variants={itemVariants}>
          <BlurContainer className="p-5">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <ShieldCheck className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            
            <p className="text-sm text-center text-muted-foreground mb-5">
              Create a strong password using a combination of letters, numbers, and symbols
            </p>
            
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="current-password" className="text-sm font-medium">
                  Current Password
                </label>
                <div className="relative">
                  <Input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter your current password"
                    className="pl-9"
                  />
                  <KeyRound className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground opacity-70" />
                </div>
              </div>
              
              <Separator className="my-2" />
              
              <div className="space-y-2">
                <label htmlFor="new-password" className="text-sm font-medium">
                  New Password
                </label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter a new password"
                  className="border-blue-200 dark:border-blue-900"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="confirm-password" className="text-sm font-medium">
                  Confirm New Password
                </label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  className="border-blue-200 dark:border-blue-900"
                />
              </div>
              
              {newPassword && (
                <div className="pt-1">
                  <div className="flex gap-1 mb-1">
                    <div className="h-1 flex-1 rounded bg-gray-200 dark:bg-gray-700"></div>
                    <div className={`h-1 flex-1 rounded ${newPassword.length > 5 ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
                    <div className={`h-1 flex-1 rounded ${newPassword.length > 8 ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
                    <div className={`h-1 flex-1 rounded ${newPassword.length > 11 ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {newPassword.length < 6 ? 'Password is too weak' : 
                     newPassword.length < 9 ? 'Password is medium strong' : 
                     'Password is strong'}
                  </p>
                </div>
              )}
              
              <div className="pt-2">
                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Updating...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      Update Password
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </BlurContainer>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ChangePassword;
