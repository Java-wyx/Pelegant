
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Key } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BlurContainer } from "@/components/ui/BlurContainer";
import { useToast } from "@/hooks/use-toast";
import { updatePassword } from "@/api/login";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/stores/auth";

const InitialPasswordChange = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isFirstLogin, hasCompletedProfile, updateFirstLoginStatus } = useAuthStore();

  const validateForm = () => {
    const newErrors: typeof errors = {};
    let isValid = true;

    if (!currentPassword) {
      newErrors.currentPassword = "Current password is required";
      isValid = false;
    }

    if (!newPassword) {
      newErrors.newPassword = "New password is required";
      isValid = false;
    } else if (newPassword.length < 8) {
      newErrors.newPassword = "Password must be at least 8 characters";
      isValid = false;
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
      isValid = false;
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const { t } = useTranslation();
  
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log("开始修改密码...");
      const success = await updatePassword({
        oldPassword: currentPassword,
        newPassword: newPassword,
        t
      });

      console.log("密码修改结果:", success);
      if (success) {
        toast({
          title: t("passwordChange.success"),
          description: t("passwordChange.successMessage"),
          className: "bg-white border-l-4 border-green-500 shadow-sm p-3",
        });

        // 更新密码修改状态
        updateFirstLoginStatus(true, undefined);

        // 如果是首次登录且未完成资料设置，跳转到资料设置页面
        if (isFirstLogin ) {
          navigate("/profile-setup");
        }else if (!hasCompletedProfile){
          navigate("/profile-setup");
        }
         else if(!isFirstLogin&&hasCompletedProfile) {
          navigate("/");
        }
      }
    } catch (error) {
      console.error("Password modification failed.:", error);
      toast({
        title: t("passwordChange.error"),
        description: error instanceof Error ? error.message : t("passwordChange.errorMessage"),
        className: "bg-white border-l-4 border-red-500 shadow-sm p-3",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    // Skip to profile setup
    navigate("/profile-setup");
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
        <BlurContainer className="p-6">
          <motion.div variants={itemVariants} className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-ios-primary/10">
                <Key className="h-6 w-6 text-ios-primary" />
              </div>
            </div>
            <h1 className="text-xl font-semibold">{t("login.passwordChange.title")}</h1>
            <p className="text-sm text-muted-foreground mt-2">
              {t("login.passwordChange.description")}
            </p>
          </motion.div>

          <motion.form 
            variants={itemVariants}
            onSubmit={handleChangePassword}
            className="space-y-4"
          >
            <div className="space-y-1">
                <label htmlFor="currentPassword" className="text-sm font-medium">
                {t("login.passwordChange.currentPassword")}
              </label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    if (errors.currentPassword) setErrors({...errors, currentPassword: undefined});
                  }}
                  className={`h-12 pr-10 ${errors.currentPassword ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.currentPassword && (
                <p className="text-red-500 text-xs mt-1">{errors.currentPassword}</p>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="newPassword" className="text-sm font-medium">
                {t("login.passwordChange.newPassword")}
              </label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (errors.newPassword) setErrors({...errors, newPassword: undefined});
                  }}
                  className={`h-12 pr-10 ${errors.newPassword ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.newPassword && (
                <p className="text-red-500 text-xs mt-1">{errors.newPassword}</p>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="confirmPassword" className="text-sm font-medium">
                {t("login.passwordChange.confirmPassword")}
              </label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword) setErrors({...errors, confirmPassword: undefined});
                  }}
                  className={`h-12 pr-10 ${errors.confirmPassword ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
              )}
            </div>

            <div className="flex flex-col space-y-3 pt-4">
              <Button 
                type="submit" 
                className="w-full bg-ios-primary hover:bg-ios-primary/90"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    {t("login.passwordChange.updating")}
                  </div>
                ) : (
                  <span>{t("login.passwordChange.updateButton")}</span>
                )}
              </Button>
              <Button 
                type="button" 
                variant="outline"
                className="w-full"
                onClick={handleSkip}
              >
                Skip & Continue to Profile Setup
              </Button>
            </div>
          </motion.form>
        </BlurContainer>
      </motion.div>
    </div>
  );
};

export default InitialPasswordChange;
