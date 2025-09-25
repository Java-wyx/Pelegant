import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Save, Camera, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BlurContainer } from "@/components/ui/BlurContainer";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { getProfile, updateProfile, uploadAvatarFile } from "@/api/login";
import { useAuthStore } from "@/stores/auth";

const EditProfile = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();
  const { setUserInfo } = useAuthStore();

  const [profile, setProfile] = useState({
    nickname: "",
    gender: "1", // 1: male, 2: female, 3: other
    avatar: ""
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    

    const fetchProfile = async () => {
      try {
        const data = await getProfile();
        setProfile({
          nickname: data.nickname,
          gender: data.sex.toString(),
          avatar: data.avatar
        
        });
        setIsFetching(false);
      } catch (error) {
        toast({
          title: t('editProfile.toast.error.title'),
          description: t('editProfile.toast.error.loadError'),
          variant: "destructive",
        });
        navigate("/profile");
      }
    };

    fetchProfile();
  }, [navigate, toast]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile.nickname) {
      toast({
        title: t('editProfile.toast.error.title'),
        description: t('editProfile.toast.error.validation.nicknameRequired'),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // 更新用户资料
      await updateProfile({
        nickname: profile.nickname,
        sex: parseInt(profile.gender),
        email: "", // 保持空值，不更新邮箱
        mobile: "", // 保持空值，不更新手机号
        avatar: profile.avatar // 使用更新后的头像
      });

      // 重新获取最新用户信息
      const freshUserInfo = await getProfile();
      setUserInfo(freshUserInfo);

      toast({
        title: t('editProfile.toast.success.title'),
        description: t('editProfile.toast.success.description'),
      });
      navigate("/profile");
    } catch (error) {
      toast({
        title: t('editProfile.toast.error.title'),
        description: t('editProfile.toast.error.saveError'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  if (e.target.files && e.target.files[0]) {
    const file = e.target.files[0];
    setAvatarFile(file); // 设置选择的文件

    // 显示预览
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string); // 设置文件预览
    };
    reader.readAsDataURL(file);

    try {
      // 调用上传头像的接口
      const avatarUrl = await uploadAvatarFile(file);

      if (avatarUrl) {
        // 上传成功后更新头像
        setProfile((prev) => ({
          ...prev,
          avatar: avatarUrl, // 更新头像 URL
        }));
        toast({
          title: t('editProfile.toast.success.title'),
          description: t('editProfile.avatar.uploadSuccess'),
        });
      }
    } catch (error) {
      // 如果上传失败，清除预览并显示错误信息
      setAvatarPreview(null);
      toast({
        title: t('editProfile.toast.error.title'),
        description: error.message || t('editProfile.avatar.uploadError'),
        variant: "destructive",
      });
    }
  }
};


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  if (isFetching) {
    return (
      <div className="min-h-screen bg-ios-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-ios-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ios-background py-6 px-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/profile")}
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">{t('editProfile.title')}</h1>
        </div>

        <BlurContainer className="p-5">
          <form onSubmit={handleProfileUpdate} className="space-y-6">
            <div className="flex flex-col items-center justify-center space-y-3 mb-2">
              <div className="relative group">
                <Avatar className="h-24 w-24 border border-gray-200 dark:border-gray-700">
                  {avatarPreview ? (
                    <AvatarImage src={avatarPreview} alt="Profile" />
                  ) : profile.avatar ? (
                    <AvatarImage src={`http://localhost:8080/api/files${profile.avatar.replace(/\\/g, '/')}`} alt="Profile" />
                  ) : (
                    <AvatarFallback className="bg-gray-100 dark:bg-gray-800 text-xl">
                      {profile.nickname.charAt(0)}
                
                    </AvatarFallback>
                  )}
                </Avatar>
                <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 bg-ios-primary rounded-full p-1.5 cursor-pointer shadow-sm">
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
              <p className="text-xs text-muted-foreground">{t('editProfile.avatar.change')}</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nickname" className="text-sm font-medium">
                  {t('editProfile.form.nickname.label')}
                </Label>
                <Input
                  id="nickname"
                  name="nickname"
                  value={profile.nickname}
                  onChange={handleChange}
                  placeholder={t('editProfile.form.nickname.placeholder')}
                  className="bg-background/50"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">{t('editProfile.form.gender.label')}</Label>
                <RadioGroup 
                  value={profile.gender} 
                  onValueChange={(value) => setProfile(prev => ({ ...prev, gender: value }))}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="1" id="male" />
                    <Label htmlFor="male">{t('editProfile.form.gender.male')}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="2" id="female" />
                    <Label htmlFor="female">{t('editProfile.form.gender.female')}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="3" id="other" />
                    <Label htmlFor="other">{t('editProfile.form.gender.other')}</Label>
                  </div>
                </RadioGroup>
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
                    {t('editProfile.form.saving')}
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Save className="mr-2 h-4 w-4" /> {t('editProfile.form.submit')}
                  </div>
                )}
              </Button>
            </div>
          </form>
        </BlurContainer>
      </div>
    </div>
  );
};

export default EditProfile;
