package com.x.pelegant.dto;

import lombok.Data;

/**
 * 登录响应DTO
 */
@Data
public class LoginResponse {

    /**
     * JWT Token
     */
    private String token;

    /**
     * 用户ID
     */
    private String userId;

    /**
     * 用户名
     */
    private String username;

    /**
     * 用户角色
     */
    private String role;

    /**
     * Token过期时间（毫秒时间戳）
     */
    private Long expiresAt;

    /**
     * 用户信息（可选，根据角色返回不同的用户对象）
     */
    private Object userInfo;

    /**
     * 是否首次登录
     */
    private Boolean isFirstLogin;

    /**
     * 是否已修改初始密码
     */
    private Boolean hasChangedPassword;

    /**
     * 是否已完成个人资料设置
     */
    private Boolean hasCompletedProfile;

    public LoginResponse() {
    }

    public LoginResponse(String token, String userId, String username, String role, Long expiresAt) {
        this.token = token;
        this.userId = userId;
        this.username = username;
        this.role = role;
        this.expiresAt = expiresAt;
    }

    public LoginResponse(String token, String userId, String username, String role, Long expiresAt, Object userInfo) {
        this.token = token;
        this.userId = userId;
        this.username = username;
        this.role = role;
        this.expiresAt = expiresAt;
        this.userInfo = userInfo;
    }

    public LoginResponse(String token, String userId, String username, String role, Long expiresAt, Object userInfo,
                         Boolean isFirstLogin, Boolean hasChangedPassword, Boolean hasCompletedProfile) {
        this.token = token;
        this.userId = userId;
        this.username = username;
        this.role = role;
        this.expiresAt = expiresAt;
        this.userInfo = userInfo;
        this.isFirstLogin = isFirstLogin;
        this.hasChangedPassword = hasChangedPassword;
        this.hasCompletedProfile = hasCompletedProfile;
    }
}
