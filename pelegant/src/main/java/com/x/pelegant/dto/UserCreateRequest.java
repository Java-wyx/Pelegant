
package com.x.pelegant.dto;

import lombok.Data;

import javax.validation.constraints.Email;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

/**
 * 用户创建请求DTO
 */
@Data
public class UserCreateRequest {

    /**
     * 用户姓名
     */
    @NotBlank(message = "用户姓名不能为空")
    @Size(max = 100, message = "用户姓名不能超过100字符")
    private String name;

    /**
     * 邮箱
     */
    @NotBlank(message = "邮箱不能为空")
    @Email(message = "邮箱格式不正确")
    private String email;

    /**
     * 密码（可选，如果不提供将自动生成）
     */
    private String password;

    /**
     * 角色
     */
    @NotBlank(message = "角色不能为空")
    private String role;

    /**
     * 部门（项目管理员需要）
     */
    private String department;

    /**
     * 学校ID（教师需要）
     */
    private String schoolId;

    /**
     * 用户类型：teacher-教师，project-项目管理员
     */
    @NotBlank(message = "用户类型不能为空")
    private String userType;

    /**
     * 状态：active-活跃，inactive-非活跃
     */
    private String status = "active";
}
