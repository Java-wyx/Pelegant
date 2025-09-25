# Pelegant - Spring Boot + MongoDB 项目

## 📁 项目概述

Pelegant 是一个基于 Spring Boot 2.6.13 和 MongoDB 的现代化社交平台应用，提供完整的用户管理功能和 RESTful API。

## 🛠️ 技术栈

- **后端框架**: Spring Boot 2.6.13
- **数据库**: MongoDB
- **数据层**: Spring Data MongoDB
- **API 文档**: Swagger 3 + Knife4j
- **日志**: Log4j2
- **工具库**: Lombok
- **Java 版本**: 8

## 🗄️ MongoDB 配置

### 数据库配置信息

```yaml
spring:
  data:
    mongodb:
      host: localhost
      port: 27017
      database: pelegant_db
```

### 主要配置类

1. **MongoConfig.java** - MongoDB 核心配置

   - 移除文档中的 `_class` 字段
   - 配置 MongoTemplate
   - 设置转换器

2. **BaseEntity.java** - 基础实体类

   - 自动设置创建时间和更新时间
   - 统一主键管理

3. **User.java** - 用户实体示例
   - 用户名和邮箱唯一索引
   - 完整的用户信息字段

## 🚀 快速开始

### 1. 环境准备

确保已安装并启动 MongoDB：

```bash
# 启动 MongoDB 服务
mongod --dbpath /path/to/your/data

# 或者使用 Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 2. 运行项目

```bash
# 编译项目
mvn clean compile

# 启动应用
mvn spring-boot:run
```

### 3. 访问接口

- **应用地址**: http://localhost:8080
- **API 文档**: http://localhost:8080/doc.html
- **Swagger UI**: http://localhost:8080/swagger-ui/

## 📖 API 接口示例

### 用户管理接口

| 方法   | 路径                             | 描述             |
| ------ | -------------------------------- | ---------------- |
| GET    | `/api/users`                     | 获取所有用户     |
| GET    | `/api/users/{id}`                | 根据 ID 获取用户 |
| POST   | `/api/users`                     | 创建新用户       |
| PUT    | `/api/users/{id}`                | 更新用户信息     |
| DELETE | `/api/users/{id}`                | 删除用户         |
| GET    | `/api/users/username/{username}` | 根据用户名查找   |
| GET    | `/api/users/status/{status}`     | 根据状态查找     |
| GET    | `/api/users/search/{nickname}`   | 昵称模糊查询     |

### 创建用户示例

```json
POST /api/users
{
  "username": "testuser",
  "password": "123456",
  "email": "test@example.com",
  "nickname": "测试用户",
  "status": 1
}
```

## 🗃️ 数据库结构

### users 集合

```javascript
{
  "_id": ObjectId("..."),
  "username": "testuser",      // 用户名（唯一索引）
  "password": "123456",        // 密码
  "email": "test@example.com", // 邮箱（唯一索引）
  "nickname": "测试用户",       // 昵称
  "status": 1,                 // 状态：1-正常，0-禁用
  "avatar": "avatar_url",      // 头像URL
  "create_time": ISODate("..."), // 创建时间
  "update_time": ISODate("...")  // 更新时间
}
```

## 🔧 开发指南

### 创建新的实体类

1. 继承 `BaseEntity` 类
2. 使用 `@Document` 注解指定集合名称
3. 使用 `@Field` 注解映射字段
4. 使用 `@Indexed` 注解创建索引

```java
@Data
@EqualsAndHashCode(callSuper = true)
@Document(collection = "your_collection")
public class YourEntity extends BaseEntity {

    @Indexed(unique = true)
    @Field("unique_field")
    private String uniqueField;

    @Field("normal_field")
    private String normalField;
}
```

### 创建 Repository 接口

```java
@Repository
public interface YourRepository extends MongoRepository<YourEntity, String> {

    // 基于字段名的查询方法
    Optional<YourEntity> findByUniqueField(String uniqueField);

    // 自定义查询
    @Query("{'field': {$regex: ?0, $options: 'i'}}")
    List<YourEntity> findByFieldContaining(String field);
}
```

## 📝 日志配置

项目使用 Log4j2 进行日志管理，MongoDB 相关日志级别设置为 DEBUG，便于开发调试。

## 🔍 故障排除

### 常见问题

1. **连接失败**: 检查 MongoDB 服务是否启动
2. **认证失败**: 确认用户名密码配置正确
3. **索引冲突**: 检查唯一索引字段是否重复

### 数据库连接测试

启动应用后，查看日志中是否有以下信息：

- `MongoDB转换器配置完成`
- `MongoTemplate配置完成`
- `MongoDB数据库配置完成，数据库名称: pelegant_db`

## 📄 许可证

本项目采用 MIT 许可证。
