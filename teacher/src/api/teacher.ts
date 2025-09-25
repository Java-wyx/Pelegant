/*
 * @Author: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @Date: 2025-08-25 09:28:54
 * @LastEditors: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @LastEditTime: 2025-08-25 11:57:07
 * @FilePath: \pelegant\src\api\teacher.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import http from './http';


export const uploadAvatarFile = async (avatarFile: File) => {
  // 确保 avatarFile 是 File 类型，并检查文件类型
  if (!(avatarFile instanceof File)) {
    throw new Error("Expected a File object.");
  }
  
  if (!avatarFile.type.startsWith("image/")) {
    throw new Error("Invalid file type. Please select a valid image file.");
  }

  const formData = new FormData();
  formData.append("avatar", avatarFile);

  try {
    // 发起上传请求
    const response = await http.post("api/teachers/avatar/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 90000, // 设置超时时间
    });

    // 处理响应
    if (response && response.data && response.data.success) {
      return response.data.data; // 上传成功，返回文件路径
    } else {
      throw new Error(response?.data?.message || "Failed to upload avatar");
    }
  } catch (error) {
    // 捕获并输出详细的错误信息
    console.error("Upload failed:", error);
    throw new Error(error.message || "Failed to upload avatar. Please try again later.");
  }
};
