/*
 * @Author: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @Date: 2025-07-20 22:12:59
 * @LastEditors: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @LastEditTime: 2025-08-23 17:52:42
 * @FilePath: \pelegant\src\api\http.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

const http = axios.create({
  baseURL: '/',
  timeout: 10000,
});

// 请求拦截器
http.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    // 使用教师认证头
    config.headers['teacher'] = `Bearer ${accessToken}`;
  }
  return config;
});

// 响应拦截器
http.interceptors.response.use(
  (response) => {
    // 检查后端响应格式，如果success为false，则认为是错误
    if (response.data && response.data.success === false) {
      // 如果是认证相关错误，跳转到登录页
      if (response.data.message && (
        response.data.message.includes('认证') ||
        response.data.message.includes('登录') ||
        response.data.message.includes('token')
      )) {
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(new Error('Authentication failed: Please login again'));
      }
    }
    return response;
  },
  (error) => {
    // 检查HTTP状态码是否为403或401
    if (error.response?.status === 401 || error.response?.status === 403) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default http;
