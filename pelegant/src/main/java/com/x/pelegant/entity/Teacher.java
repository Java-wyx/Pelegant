
package com.x.pelegant.entity;

import lombok.Data;
import lombok.EqualsAndHashCode;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import javax.validation.constraints.Email;
import javax.validation.constraints.NotBlank;

/**
 * 教师实体类
 */
@Data
@EqualsAndHashCode(callSuper = false)
@Document(collection = "teacher")
public class Teacher {

    /**
     * MongoDB主键ID
     */
    @Id
    private String id;

    /**
     * 教师自定义ID (如: TEA001, TEA002)
     */
    @NotBlank(message = "教师ID不能为空")
    @Indexed(unique = true)
    @Field("teacherId")
    private String teacherId;

    /**
     * 教师姓名
     */
    @NotBlank(message = "教师姓名不能为空")
    @Field("name")
    private String name;

    /**
     * 邮箱
     */
    @NotBlank(message = "邮箱不能为空")
    @Email(message = "邮箱格式不正确")
    @Indexed(unique = true)
    @Field("email")
    private String email;

    /**
     * 密码
     */
    @NotBlank(message = "密码不能为空")
    @Field("password")
    private String password;

    /**
     * 角色
     */
    @NotBlank(message = "角色不能为空")
    @Field("role")
    private String role;

    /**
     * 学校ID
     */
    @Field("schoolid")
    private String schoolId;

    /**
     * 头像文件路径
     */
    @Field("avatarPath")
    private String avatarPath;
}
