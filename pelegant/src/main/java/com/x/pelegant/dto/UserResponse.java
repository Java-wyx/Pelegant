package com.x.pelegant.dto;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 用户响应DTO
 */
@Data
public class UserResponse {

    /**
     * 用户ID
     */
    private String id;

    /**
     * 用户姓名
     */
    private String name;

    /**
     * 邮箱
     */
    private String email;

    /**
     * 角色
     */
    private String role;

    /**
     * 部门
     */
    private String department;

    /**
     * 学校ID
     */
    private String schoolId;

    /**
     * 学校名称
     */
    private String schoolName;

    /**
     * 用户类型：teacher-教师，project-项目管理员
     */
    private String userType;

    /**
     * 状态：active-活跃，inactive-非活跃
     */
    private String status;

    /**
     * 最后登录时间
     */
    private LocalDateTime lastLogin;

    /**
     * 创建时间
     */
    private LocalDateTime createdAt;
}
