/*
 * @Author: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @Date: 2025-09-01 13:36:26
 * @LastEditors: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @LastEditTime: 2025-09-01 13:36:43
 * @FilePath: \pelegant\scripts\update-version.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
// 自动更新版本号的脚本
const fs = require('fs');
const path = require('path');

function updateVersion() {
  const envPath = path.join(__dirname, '..', '.env.version');
  
  let content = '';
  if (fs.existsSync(envPath)) {
    content = fs.readFileSync(envPath, 'utf8');
  }
  
  // 更新版本号
  const newVersion = process.argv[2] || '1.0.0';
  const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
  
  let newContent = '';
  if (content.includes('VITE_IMAGE_VERSION=')) {
    newContent = content.replace(
      /VITE_IMAGE_VERSION=.*/,
      `VITE_IMAGE_VERSION=${newVersion}`
    );
  } else {
    newContent = content + `\nVITE_IMAGE_VERSION=${newVersion}`;
  }
  
  if (newContent.includes('VITE_BUILD_TIMESTAMP=')) {
    newContent = newContent.replace(
      /VITE_BUILD_TIMESTAMP=.*/,
      `VITE_BUILD_TIMESTAMP=${timestamp}`
    );
  } else {
    newContent = newContent + `\nVITE_BUILD_TIMESTAMP=${timestamp}`;
  }
  
  fs.writeFileSync(envPath, newContent);
  console.log(`版本已更新为: ${newVersion}, 时间戳: ${timestamp}`);
}

updateVersion();