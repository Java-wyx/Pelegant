package com.x.pelegant.entity;

import lombok.Data;
import lombok.EqualsAndHashCode;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import javax.validation.constraints.Email;
import javax.validation.constraints.NotBlank;
import java.time.LocalDateTime;

/**
 * 项目管理员实体类
 */
@Data
@EqualsAndHashCode(callSuper = false)
@Document(collection = "project")
public class Project {

    /**
     * 主键ID
     */
    @Id
    private String id;

    /**
     * 管理员姓名
     */
    @NotBlank(message = "姓名不能为空")
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
     * 密码 (在数据库脚本中未包含，但登录需要)
     */
    @NotBlank(message = "密码不能为空")
    @Field("password")
    private String password;

    /**
     * 部门
     */
    @NotBlank(message = "部门不能为空")
    @Field("department")
    private String department;

    /**
     * 角色
     */
    @NotBlank(message = "角色不能为空")
    @Field("role")
    private String role;

    /**
     * 状态：active-活跃，inactive-非活跃
     */
    @Field("status")
    private String status = "active";

    /**
     * 创建时间
     */
    @CreatedDate
    @Field("createTime")
    private LocalDateTime createTime;

    /**
     * 最后登录时间
     */
    @Field("lastLoginTime")
    private LocalDateTime lastLoginTime;

    /**
     * 更新时间
     */
    @LastModifiedDate
    @Field("updateTime")
    private LocalDateTime updateTime;
}
