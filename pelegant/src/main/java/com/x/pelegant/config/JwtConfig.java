package com.x.pelegant.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * JWT配置类
 */
@Data
@Component
@ConfigurationProperties(prefix = "jwt")
public class JwtConfig {

    /**
     * JWT密钥
     */
    private String secret = "pelegant-jwt-secret-key-2024";

    /**
     * JWT过期时间（毫秒）
     * 默认7天
     */
    private Long expiration = 7 * 24 * 60 * 60 * 1000L;

    /**
     * 学生请求头名称
     */
    private String studentHeader = "student";

    /**
     * 教师请求头名称
     */
    private String teacherHeader = "teacher";

    /**
     * 项目管理员请求头名称
     */
    private String projectHeader = "project";

    /**
     * Token前缀
     */
    private String tokenPrefix = "Bearer ";

    /**
     * 用户角色枚举
     */
    public enum UserRole {
        STUDENT("student"),
        TEACHER("teacher"),
        PROJECT("project");

        private final String value;

        UserRole(String value) {
            this.value = value;
        }

        public String getValue() {
            return value;
        }

        public static UserRole fromValue(String value) {
            for (UserRole role : UserRole.values()) {
                if (role.getValue().equals(value)) {
                    return role;
                }
            }
            throw new IllegalArgumentException("Unknown role: " + value);
        }
    }
}
