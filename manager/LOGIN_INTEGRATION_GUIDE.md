# 项目管理系统 - 前后端登录集成指南

## 🎉 集成完成状态

✅ **后端服务器**: Spring Boot 应用运行在 `http://localhost:8080`  
✅ **前端服务器**: React 应用运行在 `http://localhost:3000`  
✅ **API 连接**: 前后端通信正常  
✅ **登录功能**: 项目管理员登录集成完成  
✅ **认证管理**: JWT token 管理和存储  
✅ **路由保护**: 未登录用户自动重定向到登录页

## 🔐 测试账户

根据数据库中的数据，可以使用以下账户进行测试：

**项目管理员账户:**

- 邮箱: `zhangsan@example.com`
- 密码: `123456`
- 角色: Administrator

## 🚀 如何使用

### 1. 启动后端服务

```bash
cd Pelegant
java -jar target/Pelegant-0.0.1-SNAPSHOT.jar
```

### 2. 启动前端服务

```bash
cd managementsystem-main/managementsystem-main
npm run dev
```

### 3. 访问系统

- 前端地址: http://localhost:3000
- 后端 API 文档: http://localhost:8080/doc.html

### 4. 登录流程

1. 访问 http://localhost:3000
2. 系统会自动重定向到登录页面
3. 输入邮箱和密码
4. 登录成功后跳转到仪表板

## 🔧 技术实现

### 前端技术栈

- **React 18** + **TypeScript**
- **Vite** 开发服务器
- **Tailwind CSS** + **shadcn/ui** 组件库
- **React Router** 路由管理
- **React Hook Form** + **Zod** 表单验证

### 后端技术栈

- **Spring Boot 2.6.13**
- **MongoDB** 数据库
- **JWT** 认证
- **Swagger/Knife4j** API 文档

### 认证流程

1. 用户提交邮箱和密码
2. 前端调用 `/api/projects/login-json` 接口
3. 后端验证用户信息并生成 JWT token
4. 前端存储 token 和用户信息到 localStorage
5. 后续请求在请求头中携带 token (`project: Bearer <token>`)

## 📁 关键文件

### 前端核心文件

- `src/lib/api.ts` - API 接口和认证管理
- `src/contexts/AuthContext.tsx` - 认证上下文
- `src/pages/Login.tsx` - 登录页面
- `src/components/layout/DashboardLayout.tsx` - 主布局组件

### 后端核心文件

- `src/main/java/com/x/pelegant/controller/ProjectController.java` - 项目管理员控制器
- `src/main/java/com/x/pelegant/service/ProjectService.java` - 项目管理员服务
- `src/main/java/com/x/pelegant/config/JwtConfig.java` - JWT 配置

## 🔍 API 接口

### 项目管理员登录

```
POST /api/projects/login-json
Content-Type: application/json

{
  "email": "zhangsan@example.com",
  "password": "123456"
}
```

### 响应格式

```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzUxMiJ9...",
    "userId": "68649d479c9bb245d1dfba2c",
    "username": "张三",
    "role": "project",
    "expiresAt": 1751676000000,
    "userInfo": {
      "id": "68649d479c9bb245d1dfba2c",
      "name": "张三",
      "email": "zhangsan@example.com",
      "department": "技术部",
      "role": "Administrator",
      "status": "active"
    }
  }
}
```

## 🛡️ 安全特性

- **JWT Token**: 7 天有效期
- **密码加密**: 后端密码加密存储
- **CORS 配置**: 允许跨域请求
- **路由保护**: 未认证用户无法访问受保护页面
- **Token 过期检查**: 自动检查 token 有效性

## 🎯 下一步计划

1. **完善其他页面**: 集成学校管理、学生管理等页面的 API
2. **权限管理**: 实现基于角色的权限控制
3. **数据绑定**: 将前端表格和表单与后端数据绑定
4. **错误处理**: 完善错误处理和用户提示
5. **测试**: 添加单元测试和集成测试

## 🐛 故障排除

### 常见问题

1. **CORS 错误**: 确保后端 CORS 配置正确
2. **连接失败**: 检查后端服务是否在 8080 端口运行
3. **登录失败**: 验证数据库中的用户数据
4. **Token 过期**: 清除 localStorage 重新登录

### 调试工具

- 浏览器开发者工具 (F12)
- 后端日志输出
- API 测试页面: http://localhost:3000/test-login
- Swagger 文档: http://localhost:8080/doc.html

---

🎉 **恭喜！项目管理系统的前后端登录功能已成功集成！**
