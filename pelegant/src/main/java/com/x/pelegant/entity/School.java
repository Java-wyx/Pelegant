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
import javax.validation.constraints.Pattern;
import java.time.LocalDateTime;

/**
 * 学校实体类
 */
@Data
@EqualsAndHashCode(callSuper = false)
@Document(collection = "school")
public class School {

    /**
     * 主键ID
     */
    @Id
    private String id;

    /**
     * 学校编号
     */
    @NotBlank(message = "学校编号不能为空")
    @Indexed(unique = true)
    @Field("schoolId")
    private String schoolId;

    /**
     * 大学名称
     */
    @NotBlank(message = "大学名称不能为空")
    @Field("universityName")
    private String universityName;

    /**
     * 大学类型
     */
    @NotBlank(message = "大学类型不能为空")
    @Field("universityType")
    private String universityType;

    /**
     * 大学地址
     */
    @NotBlank(message = "大学地址不能为空")
    @Field("universityAddress")
    private String universityAddress;

    /**
     * 大学网站
     */
    @Pattern(regexp = "^https?://.*", message = "网站地址格式不正确")
    @Field("universityWebsite")
    private String universityWebsite;

    /**
     * 大学描述
     */
    @Field("universityDescription")
    private String universityDescription;

    /**
     * 状态：active-活跃，inactive-非活跃
     */
    @Field("status")
    private String status = "active";

    /**
     * 教师管理员ID
     */
    @Field("tadmin")
    private String tadmin;

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
    @Field("continent")
    private String continent;
    @Field("country")
    private String country;
    @Field("region")
    private String region;
}