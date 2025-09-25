/*
 * @Author: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @Date: 2025-09-01 13:28:46
 * @LastEditors: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @LastEditTime: 2025-09-01 13:28:51
 * @FilePath: \pelegant\src\utils\version.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
// 版本管理工具函数
export const VersionUtils = {
  // 获取图片版本号
  getImageVersion: (): string => {
    return import.meta.env.VITE_IMAGE_VERSION || 
           (window as any).__IMAGE_VERSION__ || 
           '1.0';
  },

  // 获取构建时间戳
  getBuildTimestamp: (): string => {
    return import.meta.env.VITE_BUILD_TIMESTAMP || 
           (window as any).__BUILD_TIMESTAMP__ || 
           new Date().getTime().toString();
  },

  // 获取应用版本
  getAppVersion: (): string => {
    return import.meta.env.VITE_APP_VERSION || 
           (window as any).__APP_VERSION__ || 
           '1.0.0';
  },

  // 生成防缓存URL
  generateCacheBusterUrl: (url: string): string => {
    if (!url) return url;
    
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}v=${VersionUtils.getImageVersion()}&t=${VersionUtils.getBuildTimestamp()}`;
  },

  // 检查是否需要更新版本
  checkVersionUpdate: (): void => {
    const storedVersion = localStorage.getItem('app_version');
    const currentVersion = VersionUtils.getAppVersion();
    
    if (storedVersion !== currentVersion) {
      console.log(`版本更新: ${storedVersion} → ${currentVersion}`);
      localStorage.setItem('app_version', currentVersion);
      
      // 可以在这里添加版本更新提示逻辑
      if (storedVersion) {
        console.log('检测到新版本，建议刷新页面');
      }
    }
  }
};