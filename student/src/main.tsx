import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { VersionUtils } from "./utils/version";

createRoot(document.getElementById("root")!).render(<App />);

// 应用启动时检查版本
VersionUtils.checkVersionUpdate();

// 也可以定期检查版本更新
setInterval(() => {
  VersionUtils.checkVersionUpdate();
}, 5 * 60 * 1000); // 每5分钟检查一次
