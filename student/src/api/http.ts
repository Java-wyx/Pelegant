/*
 * @Author: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @Date: 2025-07-20 21:39:18
 * @LastEditors: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @LastEditTime: 2025-08-24 21:55:25
 * @FilePath: \pelegant\src\api\http.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import axios from 'axios';
import { useAuthStore } from '@/stores/auth';



const http = axios.create({
  baseURL: '/api',
  timeout: 25000,
});

// 请求拦截器
http.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  config.headers['tenant-id'] = '1';
  // 将JWT token放在student请求头中，用于后端JWT拦截器验证
  if (accessToken) {
    config.headers['student'] = `Bearer ${accessToken}`;
  }
  return config;
});

// 响应拦截器
http.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.config.url, response.data);
    // 检查响应体中的code是否为403
    if (response.data && response.data.code === 403) {
      console.log('Response code 403 detected, redirecting to login page');
      useAuthStore.getState().logout();
      window.location.href = '/login';
      return Promise.reject(new Error('Forbidden: Please login again'));
    }
    return response.data;
  },
  (error) => {
    // 检查HTTP状态码是否为403或401
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.log(`HTTP ${error.response.status} detected, redirecting to login page`);
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);



export default http;
