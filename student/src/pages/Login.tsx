
import React, { useState } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { login } from "@/api/login";
import { useAuthStore } from "@/stores/auth";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BlurContainer } from "@/components/ui/BlurContainer";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{email?: string; password?: string}>({});
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const currentYear = new Date().getFullYear();

  const validateForm = () => {
    const newErrors: {email?: string; password?: string} = {};
    let isValid = true;

    if (!email) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email";
      isValid = false;
    }

    if (!password) {
      newErrors.password = "Password is required";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await login({
        tenantName: "", // 保持接口兼容性，但不使用
        username: email,
        password,
        rememberMe: false // 保持接口兼容性，但不使用
      });
      
      // 获取用户信息
      const userInfo = useAuthStore.getState().userInfo;
      const displayName = userInfo?.nickname || userInfo?.username || email.split('@')[0];
      
      toast({
        title: t("login.success"),
        description: t("login.welcome", { name: displayName }),
        className: "bg-white border-l-4 border-green-500 shadow-sm p-3",
      });

      // 首次登录流程：先修改密码，再完善资料，最后进入主应用
      if (result.isFirstLogin) {
        if (!result.hasChangedPassword) {
          // 首次登录且未修改密码，跳转到修改密码页面
          navigate("/initial-password-change");
        } else if (!result.hasCompletedProfile) {
          // 已修改密码但未完善资料，跳转到资料设置页面
          navigate("/profile-setup");
        } else {
          // 已完成所有设置，进入主应用
          navigate("/");
        }
      } else if (result.needChangePassword) {
        // 非首次登录但需要修改密码
        navigate("/");
      } else {
        // 正常登录，直接进入主应用
        navigate("/");
      }
    } catch (error) {
      let message = t("login.error.default");
      if (axios.isAxiosError(error)) {
        // 优先使用后端返回的msg字段
        message = error.response?.data?.msg || t(`login.error.${error.response?.data?.code === 400 ? 'invalidFormat' : 'invalidCredentials'}`);
      } else if (error instanceof Error) {
        message = error.message;
      }
      setAlertMessage(message);
      setShowAlert(true);
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
        <motion.div variants={itemVariants} className="text-center mb-8">
          <div className="flex items-center justify-center">
            <div className="h-20 w-20 rounded-full overflow-hidden border-2 border-white/20 shadow-lg">
              <img 
                src="https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=400&auto=format&fit=crop&q=80"
                alt="Company Logo" 
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </motion.div>

        <BlurContainer className="p-6">
          <motion.form 
            variants={itemVariants} 
            onSubmit={handleLogin}
            className="space-y-4"
          >
            <div className="space-y-1">
              <label htmlFor="email" className="text-sm font-medium">
                {t("login.email")}
              </label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({...errors, email: undefined});
                }}
                className={`h-12 ${errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="password" className="text-sm font-medium">
                {t("login.password")}
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors({...errors, password: undefined});
                  }}
                  className={`h-12 pr-10 ${errors.password ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password}</p>
              )}
              <div className="flex justify-end">
                <Link 
                  to="/forgot-password" 
                  className="text-sm text-ios-primary hover:underline"
                >
                  {t("login.forgotPassword")}
                </Link>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-ios-primary hover:bg-ios-primary/90 mt-6"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  {t("login.submitting")}
                </div>
              ) : (
                <div className="flex items-center">
                  {t("login.submit")}
                </div>
              )}
            </Button>
          </motion.form>
        </BlurContainer>
        
        <motion.div variants={itemVariants} className="mt-8 text-center text-sm text-muted-foreground">
          © {currentYear} AppName. All rights reserved.
        </motion.div>
      </motion.div>

      <AlertDialog open={showAlert} onOpenChange={setShowAlert}>
        <AlertDialogContent className="max-w-[350px] rounded-xl">
          <AlertDialogTitle className="text-center text-red-500">
            {t("login.error.default")}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            {alertMessage}
          </AlertDialogDescription>
          <AlertDialogFooter className="flex justify-center">
            <AlertDialogAction 
              className="bg-ios-primary hover:bg-ios-primary/90" 
              onClick={() => setShowAlert(false)}
            >
              {t("login.tryAgain")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Login;
