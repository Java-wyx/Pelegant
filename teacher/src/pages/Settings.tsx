import React, { useState, useRef, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import {
  getUserProfile,
  updateUserProfile,
  updateUserPassword,
  logout,
} from "@/api/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Lock, User, LogOut, Camera, Upload } from "lucide-react";
import { toast } from "sonner";
import { uploadAvatarFile } from "@/api/teacher";
import { useAuthStore } from "@/store/authStore";
import {getAvatarUrl} from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { get } from "http";
import { set } from "date-fns";

const Settings = () => {
  
  const { logout } = useAuthStore();
  const { user, setUser } = useAuthStore();
  const [profile, setProfile] = useState({
    nickname: "",
    email: "",
    avatarSrc:""
  });

  const [avatarSrc, setAvatarSrc] = useState("");
  const [previewSrc, setPreviewSrc] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isAvatarChanged, setIsAvatarChanged] = useState(false); // New state to track avatar change
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await getUserProfile();
        // 设置 profile，包括头像信息
        setProfile({
          nickname: data.nickname || "",
          email: data.email || "",
          avatarSrc: data.avatar || "", // 这里设置从后端获取的头像
          
        });
      
      } catch (error) {
        toast.error("Failed to load profile");
      }
    };

    loadProfile();
    fetchAvatarUrl();

  }, []); // 初次加载时调用

  console.log("avatar", profile.avatarSrc); // 在控制台输出当前头像
  // const avatarUrl = `/api/files${profile?.avatarSrc?.replace(/\\/g, '/')}`;

  const fetchAvatarUrl = async () => {
  const url = await getAvatarUrl();
  setAvatarSrc(url); // 使用 setAvatarSrc 来更新 state
};


   const loadProfile = async () => {
      try {
        const data = await getUserProfile();
        // 设置 profile，包括头像信息
        setProfile({
          nickname: data.nickname || "",
          email: data.email || "",
          avatarSrc: data.avatar || "", // 这里设置从后端获取的头像
        });
      } catch (error) {
        toast.error("Failed to load profile");
      }
    };

  const handleSave = async () => {
    try {
      await updateUserProfile({
        nickname: profile.nickname,
        // Note: Email cannot be updated through profile API
        // Only name (nickname) can be updated
      });
     setUser({ ...user, nickname: profile.nickname }); // 同步更新全局 user
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Profile update error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update profile";
      toast.error(errorMessage);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Successfully logged out");
      useAuthStore.getState().logout();
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // File validation
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      // 5MB limit
      toast.error("Image size should be less than 5MB");
      return;
    }

    // Generate preview without uploading yet
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setPreviewSrc(event.target.result as string); // Set the preview
        setIsAvatarChanged(true); // Mark avatar as changed
      }
    };
    reader.readAsDataURL(file);
  };
const handleConfirmUpload = async () => {
  if (!previewSrc) {
    toast.error("No image selected");
    return;
  }

  // 将 Base64 字符串转换为 Blob 对象
  const byteCharacters = atob(previewSrc.split(',')[1]); // 解码 Base64 字符串
  const byteArrays = [];
  
  for (let offset = 0; offset < byteCharacters.length; offset++) {
    byteArrays.push(byteCharacters.charCodeAt(offset));
  }

  const byteArray = new Uint8Array(byteArrays);
  const blob = new Blob([byteArray], { type: "image/jpeg" });

  // 创建一个 File 对象
  const file = new File([blob], "avatar.jpg", {
    type: "image/jpeg",
  });

  console.log("Uploading file:", file); // 打印上传的文件信息，检查类型

 try {
    setIsUploading(true);
    // 假设上传文件的 API 返回头像 URL 路径
    const avatarUrl = await uploadAvatarFile(file); // 服务器返回的头像 URL
    useAuthStore.getState().updateAvatar(avatarUrl); // 更新全局头像路径
    toast.success("The avatar has been updated successfully.");
    loadProfile();
    fetchAvatarUrl();
  } catch (error) {
    toast.error("The avatar upload failed.");
  } finally {
    setIsUploading(false);
  }
};


  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleCancelUpload = () => {
    setPreviewSrc("");
    setIsAvatarChanged(false); // Reset the avatar changed flag
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Layout>
      <div className="w-full max-w-3xl mx-auto">
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid grid-cols-2 w-full max-w-xs mb-6">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-3.5 w-3.5" />
              <span>Profile</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Lock className="h-3.5 w-3.5" />
              <span>Security</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab Content */}
          <TabsContent value="profile">
            <Card className="shadow-sm border-slate-100">
              <CardContent className="p-6">
                <div className="max-w-md mx-auto space-y-6">
                  {/* Profile Picture Section */}
                  <div className="flex justify-center">
                    <div className="relative">
                      <Avatar className="h-20 w-20 border-2 border-slate-100">
                        <AvatarImage src={avatarSrc} alt="Profile picture" />
                        <AvatarFallback className="text-xl bg-blue-50 text-blue-600">
                          {user?.username?.charAt(0).toUpperCase() || "A"}
                        </AvatarFallback>
                      </Avatar>

                      <Dialog>
                        <DialogTrigger asChild>
                          <button
                            className="absolute bottom-0 right-0 bg-blue-500 hover:bg-blue-600 text-white p-1.5 rounded-full transition-colors shadow-md"
                            title="Upload profile picture"
                          >
                            <Camera className="h-3.5 w-3.5" />
                          </button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Upload profile picture</DialogTitle>
                          </DialogHeader>
                          <div className="flex flex-col items-center gap-4 py-6">
                            {previewSrc ? (
                              <div className="relative w-36 h-36 rounded-full overflow-hidden border-2 border-slate-100">
                                <img
                                  src={previewSrc}
                                  alt="Preview"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div
                                onClick={handleUploadClick}
                                className="w-36 h-36 rounded-full bg-slate-50 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-100 transition-colors border-2 border-dashed border-slate-200"
                              >
                                <Upload className="h-7 w-7 text-slate-400" />
                                <span className="text-sm text-slate-500">
                                  Select image
                                </span>
                              </div>
                            )}

                            <input
                              type="file"
                              ref={fileInputRef}
                              onChange={handleFileChange}
                              accept="image/*"
                              className="hidden"
                            />

                            {previewSrc ? (
                              <div className="flex gap-3">
                                <Button
                                  variant="outline"
                                  onClick={handleCancelUpload}
                                  disabled={isUploading}
                                  size="sm"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  onClick={handleConfirmUpload}
                                  disabled={isUploading || !isAvatarChanged} // Disabled if no change
                                  size="sm"
                                >
                                  {isUploading ? "Uploading..." : "Save"}
                                </Button>
                              </div>
                            ) : (
                              <Button
                                onClick={handleUploadClick}
                                variant="outline"
                                size="sm"
                              >
                                Select image
                              </Button>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>

                  {/* Profile Form Section */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="nickname">Nickname</Label>
                      <Input
                        id="nickname"
                        value={profile.nickname}
                        onChange={(e) =>
                          setProfile({ ...profile, nickname: e.target.value })
                        }
                        className="max-w-md"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        value={profile.email}
                        disabled
                        className="max-w-md bg-gray-50"
                        title="Email cannot be changed through profile settings"
                      />
                      <p className="text-xs text-gray-500">
                        Email cannot be changed through profile settings
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Roles</Label>
                      <div className="flex flex-wrap gap-2">
                        {user?.roles?.length > 0 ? (
                          user.roles.map((role) => {
                            const roleName =
                              role.name || role.code || String(role.id);
                            return (
                              <span
                                key={role.id}
                                className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-full border border-blue-100"
                              >
                                {roleName}
                              </span>
                            );
                          })
                        ) : (
                          <span className="text-sm text-gray-500">
                            No roles assigned
                          </span>
                        )}
                      </div>
                    </div>

                    <Button
                      onClick={handleSave}
                      className="w-full max-w-md mt-2"
                    >
                      Update Profile
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab Content */}
          <TabsContent value="security">
            <Card className="shadow-sm border-slate-100">
              <CardContent className="p-6">
                <div className="max-w-md mx-auto space-y-5">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <Input
                        id="current-password"
                        type="password"
                        className="max-w-md"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        className="max-w-md"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Password must be at least 8 characters long and include
                        a mix of letters, numbers, and symbols.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">
                        Confirm New Password
                      </Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        className="max-w-md"
                      />
                    </div>

                    <Button
                      onClick={async () => {
                        const currentPassword = (
                          document.getElementById(
                            "current-password"
                          ) as HTMLInputElement
                        ).value;
                        const newPassword = (
                          document.getElementById(
                            "new-password"
                          ) as HTMLInputElement
                        ).value;
                        const confirmPassword = (
                          document.getElementById(
                            "confirm-password"
                          ) as HTMLInputElement
                        ).value;

                        if (
                          !currentPassword ||
                          !newPassword ||
                          !confirmPassword
                        ) {
                          toast.error("Please fill all password fields");
                          return;
                        }

                        if (newPassword !== confirmPassword) {
                          toast.error("New passwords do not match");
                          return;
                        }

                        try {
                          await updateUserPassword({
                            oldPassword: currentPassword,
                            newPassword: newPassword,
                          });
                          toast.success("Password updated successfully");
                          // Clear password fields
                          (
                            document.getElementById(
                              "current-password"
                            ) as HTMLInputElement
                          ).value = "";
                          (
                            document.getElementById(
                              "new-password"
                            ) as HTMLInputElement
                          ).value = "";
                          (
                            document.getElementById(
                              "confirm-password"
                            ) as HTMLInputElement
                          ).value = "";
                        } catch (error) {
                          toast.error("Failed to update password");
                        }
                      }}
                      className="w-full max-w-md mt-2"
                    >
                      Update Password
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Logout section at the bottom */}
        <div className="mt-8 flex justify-center">
          <Button
            onClick={handleLogout}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 text-slate-600"
          >
            <LogOut className="h-3.5 w-3.5" />
            Logout
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;
