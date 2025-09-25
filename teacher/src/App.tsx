/*
 * @Author: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @Date: 2025-07-05 21:53:51
 * @LastEditors: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @LastEditTime: 2025-07-05 22:27:39
 * @FilePath: \新建文件夹\careeroffice-main\careeroffice-main\src\App.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */

import React, { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Permissions from "./pages/Permissions";
import Students from "./pages/Students";
import Enterprises from "./pages/Enterprises";
import Statistics from "./pages/Statistics";
import Settings from "./pages/Settings";
import ProtectedRoute from "./components/ProtectedRoute";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 60 * 1000,
    },
  },
});

const App: React.FC = () => {
  // 添加全局错误处理，防止媒体播放错误影响应用
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // 忽略媒体播放相关的错误
      if (event.reason?.name === 'AbortError' && 
          event.reason?.message?.includes('play()')) {
        console.warn('媒体播放错误已忽略:', event.reason);
        event.preventDefault();
        return;
      }
      
      // 忽略其他常见的非关键错误
      if (event.reason?.message?.includes('interrupted by a call to pause')) {
        console.warn('媒体暂停错误已忽略:', event.reason);
        event.preventDefault();
        return;
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                <Route 
                  path="/permissions" 
                  element={<ProtectedRoute requiredPermission="system:user:list"><Permissions /></ProtectedRoute>} 
                />
                <Route
                  path="/students"
                  element={<ProtectedRoute requiredPermission="students.manage"><Students /></ProtectedRoute>}
                />
                <Route 
                  path="/enterprises" 
                  element={<ProtectedRoute requiredPermission="pelegant:company:query"><Enterprises /></ProtectedRoute>} 
                />
                <Route
                  path="/statistics"
                  element={<ProtectedRoute requiredPermission="statistics.view"><Statistics /></ProtectedRoute>}
                />
                <Route 
                  path="/settings" 
                  element={<ProtectedRoute requiredPermission=""><Settings /></ProtectedRoute>} 
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
};

export default App;
