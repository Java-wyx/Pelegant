package com.x.pelegant.entity;

import lombok.Data;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.LocalDateTime;

/**
 * MongoDB基础实体类
 * 包含通用字段：id、创建时间、更新时间
 */
@Data
public abstract class BaseEntity {

    /**
     * 主键ID，MongoDB自动生成
     */
    @Id
    private String id;

    /**
     * 创建时间，自动设置
     */
    @CreatedDate
    @Field("create_time")
    private LocalDateTime createTime;

    /**
     * 最后修改时间，自动更新
     */
    @LastModifiedDate
    @Field("update_time")
    private LocalDateTime updateTime;
}