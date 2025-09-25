package com.x.pelegant.dto;

import lombok.Data;

import javax.validation.constraints.Email;
import javax.validation.constraints.NotBlank;


/**
 * 创建教师用户请求DTO
 */
@Data
public class CreateTeacherRequest {

    /**
     * 教师姓名
     */
    @NotBlank(message = "教师姓名不能为空")
    private String name;

    /**
     * 邮箱
     */
    @NotBlank(message = "邮箱不能为空")
    @Email(message = "邮箱格式不正确")
    private String email;

    /**
     * 角色
     */
    @NotBlank(message = "角色不能为空")
    private String role;

    /**
     * 学校ID
     */
    private String schoolId;
}
