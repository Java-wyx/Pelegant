
package com.x.pelegant.dto;

import lombok.Data;
import org.springframework.data.mongodb.core.mapping.Field;

import javax.validation.constraints.Email;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Pattern;

/**
 * 学校添加请求DTO（学校编号自动生成）
 */
@Data
public class SchoolCreateRequest {

    /**
     * 大学名称
     */
    @NotBlank(message = "大学名称不能为空")
    private String universityName;

    /**
     * 大学类型
     */
    @NotBlank(message = "大学类型不能为空")
    private String universityType;

    /**
     * 大学地址
     */
    @NotBlank(message = "大学地址不能为空")
    private String universityAddress;

    /**
     * 管理员邮箱（添加学校时会自动创建管理员教师账户）
     */
    @NotBlank(message = "管理员邮箱不能为空")
    @Email(message = "邮箱格式不正确")
    private String adminEmail;

    /**
     * 大学网站
     */
    @Pattern(regexp = "^https?://.*", message = "网站地址格式不正确")
    private String universityWebsite;

    /**
     * 状态：active-活跃，inactive-非活跃
     */
    @NotBlank(message = "状态不能为空")
    private String status = "active";

    /**
     * 大学简介
     */
    @NotBlank(message = "大学简介不能为空")
    private String universityDescription;

    @Field("continent")
    private String continent;

    @Field("country")
    private String country;

    @Field("region")
    private String region;

}