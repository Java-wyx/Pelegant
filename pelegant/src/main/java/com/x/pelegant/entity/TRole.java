/*
 * @Author: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @Date: 2025-07-05 10:01:46
 * @LastEditors: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @LastEditTime: 2025-07-05 10:32:21
 * @FilePath: \新建文件夹\Pelegant\src\main\java\com\x\pelegant\entity\TRole.java
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
package com.x.pelegant.entity;

import lombok.Data;
import lombok.EqualsAndHashCode;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.Size;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 教师管理角色权限实体类
 */
@Data
@EqualsAndHashCode(callSuper = false)
@Document(collection = "troles")
public class TRole {

    /**
     * 主键ID
     */
    @Id
    private String id;

    /**
     * 角色名称
     */
    @NotBlank(message = "角色名称不能为空")
    @Indexed(unique = true)
    @Field("roleName")
    private String roleName;

    /**
     * 角色描述
     */
    @NotBlank(message = "角色描述不能为空")
    @Size(max = 500, message = "角色描述不能超过500字符")
    @Field("description")
    private String description;

    /**
     * 权限列表
     */
    @NotEmpty(message = "权限列表不能为空")
    @Field("permissions")
    private List<String> permissions;

    /**
     * 是否为系统角色
     */
    @Field("isSystem")
    private Boolean isSystem = false;

    /**
     * 使用该角色的用户数量（计算字段，不存储在数据库中）
     */
    private Integer usersCount = 0;

    /**
     * 创建时间
     */
    @CreatedDate
    @Field("createdAt")
    private LocalDateTime createdAt;

    /**
     * 更新时间
     */
    @LastModifiedDate
    @Field("updatedAt")
    private LocalDateTime updatedAt;
}
