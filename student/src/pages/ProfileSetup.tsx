import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Upload, User, Save, Camera } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BlurContainer } from "@/components/ui/BlurContainer";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/stores/auth";
import http from "@/api/http";



const ProfileSetup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userId, updateFirstLoginStatus } = useAuthStore();
  const [nickname, setNickname] = useState("");
const [gender, setGender] = useState<string | null>(null);  // 初始值为 null 或 'Male'

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);





  

  const handleProfileSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nickname) {
      toast({
        title: "Error",
        description: "Please provide your nickname",
        variant: "destructive",
      });
      return;
    }
    
    if (!resumeFile) {
      toast({
        title: "Error",
        description: "Please upload your resume",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('studentId', userId?.toString() || '');
      if (nickname) formData.append('nickname', nickname);
      
      // 确保性别值格式正确（转换为小写）
      if (gender) formData.append('gender', gender.toLowerCase());
      
      if (avatarFile) formData.append('avatarFile', avatarFile);
      if (resumeFile) formData.append('resumeFile', resumeFile);

      // 调用后端 API 完成个人资料设置
      const response = await http.post('/students/profile/complete', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log(response)
      
      if (response.success === true) {
        // 个人资料设置成功
        updateFirstLoginStatus(undefined, true);

        toast({
          title: "Success",
          description: "Personal profile settings have been successful",
        });
        navigate("/");
      } else {
        // 处理失败情况
        throw new Error(response.data.message || "Personal profile settings failed");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to set up personal profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  
  const handleResumeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setResumeFile(e.target.files[0]);
    }
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      
      // Create preview URL for the avatar
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
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
        <BlurContainer className="p-6">
          <motion.div variants={itemVariants} className="text-center mb-6">
            <h1 className="text-2xl font-semibold">Complete Your Profile</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Upload your resume and personal information
            </p>
          </motion.div>
          
          <motion.form 
            variants={itemVariants} 
            onSubmit={handleProfileSetup}
            className="space-y-4"
          >
            {/* Avatar Upload Section */}
            <div className="flex flex-col items-center justify-center space-y-3 mb-2">
              <div className="relative group">
                <Avatar className="h-24 w-24 border-2 border-ios-primary">
                  {avatarPreview ? (
                    <AvatarImage src={avatarPreview} alt="Profile" />
                  ) : (
                    <AvatarFallback className="bg-muted text-2xl">
                      <User />
                    </AvatarFallback>
                  )}
                </Avatar>
                <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 bg-ios-primary rounded-full p-1.5 cursor-pointer shadow-md">
                  <Camera className="h-4 w-4 text-white" />
                  <input
                    id="avatar-upload"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleAvatarFileChange}
                  />
                </label>
              </div>
              <p className="text-xs text-muted-foreground">Upload a profile photo</p>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="nickname" className="text-sm font-medium">
                Nickname
              </label>
              <Input
                id="nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Enter your nickname"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Gender</label>
<RadioGroup value={gender} onValueChange={setGender} className="flex space-x-4">
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="Male" id="male" />
    <Label htmlFor="male">Male</Label>
  </div>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="Female" id="female" />
    <Label htmlFor="female">Female</Label>
  </div>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="Other" id="other" />
    <Label htmlFor="other">Other</Label>
  </div>
</RadioGroup>



            </div>
            
            <div className="space-y-2">
              <label htmlFor="resume" className="text-sm font-medium">
                Resume/CV
              </label>
              <div className="border border-input rounded-md p-4 bg-background">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center justify-center gap-2 py-4">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm font-medium">
                      {resumeFile ? resumeFile.name : "Upload your resume"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PDF, DOC or DOCX up to 5MB
                    </p>
                  </div>
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                    onChange={handleResumeFileChange}
                  />
                </label>
              </div>
            </div>
            
            <div className="pt-4">
              <Button 
                type="submit" 
                className="w-full bg-ios-primary hover:bg-ios-primary/90"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Saving...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Save className="mr-2 h-4 w-4" /> Complete Setup
                  </div>
                )}
              </Button>
            </div>
          </motion.form>
        </BlurContainer>
      </motion.div>
    </div>
  );
};

export default ProfileSetup;