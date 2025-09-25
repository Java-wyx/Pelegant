/*
 * @Author: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @Date: 2025-07-20 21:39:18
 * @LastEditors: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @LastEditTime: 2025-09-01 13:28:19
 * @FilePath: \pelegant\vite.config.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { readFileSync } from "fs";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 加载版本环境变量
  const versionEnv = loadEnv('version', process.cwd(), 'VITE_');
  
  return {
    server: {
      host: "::",
      port: 3002,
      proxy: {
        '/api': {
          target: 'http://localhost:8080',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '/api')
        }
      }
    },
    plugins: [
      react(),
      mode === 'development' && componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      // 将版本信息注入到全局变量中
      '__APP_VERSION__': JSON.stringify(versionEnv.VITE_APP_VERSION || '1.0.0'),
      '__IMAGE_VERSION__': JSON.stringify(versionEnv.VITE_IMAGE_VERSION || '1.0'),
      '__BUILD_TIMESTAMP__': JSON.stringify(versionEnv.VITE_BUILD_TIMESTAMP || new Date().getTime().toString()),
    },
  };
});