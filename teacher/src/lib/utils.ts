/*
 * @Author: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @Date: 2025-07-20 22:12:59
 * @LastEditors: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @LastEditTime: 2025-08-25 15:03:25
 * @FilePath: \pelegant\src\lib\utils.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import {
  getUserProfile,
  updateUserProfile,
  updateUserPassword,
  logout,
} from "@/api/auth";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
// utils/avatarUtils.ts
export const getAvatarUrl = async (): Promise<string> => {
  try {
    const data = await getUserProfile();  // 获取用户信息
    if (data?.avatar) {
      // 替换路径中的反斜杠
      // const backendUrl = window.location.origin.replace(/:\d+$/, ":8080");  // 将端口替换为后端端口
      // return `${backendUrl}/api/files${data.avatar.replace(/\\/g, '/')}`;
      return data?.avatar
    } else {
      // 如果没有头像，返回默认头像
      return '';
    }
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return ''; // 发生错误时，返回默认头像
  }
};