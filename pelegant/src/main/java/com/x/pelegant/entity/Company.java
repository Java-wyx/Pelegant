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
import javax.validation.constraints.Size;
import java.time.LocalDateTime;

/**
 * 企业实体类
 */
@Data
@EqualsAndHashCode(callSuper = false)
@Document(collection = "company")
public class Company {

    /** 主键ID */
    @Id
    private String id;

    /** 企业编号 */
    @NotBlank(message = "企业编号不能为空")
    @Indexed(unique = true)
    @Field("companyId")
    private String companyId;

    /** 企业名称 */
    @NotBlank(message = "企业名称不能为空")
    @Field("companyName")
    private String companyName;

    /** 企业类型 */
    @NotBlank(message = "企业类型不能为空")
    @Field("companyType")
    private String companyType;

    /** 企业规模 */
    @Field("companySize")
    private String companySize;

    @Field("companyNameLower")
    private String companyNameLower;

    /**
     * 一级行业（大类，如 Financial, IT, Healthcare, Construction 等）
     */
    @Field("sector")
    private String sector;

    /**
     * 二级行业（如 Banking, Software, Pharmaceuticals 等）
     */
    @Field("industryCategory")
    private String industryCategory;

    /**
     * 三级子行业（如 Virtual Bank, AI, Civil Engineering 等）
     */
    @Field("subIndustry")
    private String subIndustry;

    /**
     * 兼容旧逻辑的行业字段，存拼接好的 "sector - industry - subIndustry"
     * （例如 "Financial - Banking - Virtual Bank"）
     */
    @NotBlank(message = "所属行业不能为空")
    @Field("industry")
    private String industry;

    /** 企业地址 */
    @NotBlank(message = "企业地址不能为空")
    @Field("companyAddress")
    private String companyAddress;

    /** 企业网站 */
    @Pattern(regexp = "^https?://.*", message = "网站地址格式不正确")
    @Field("companyWebsite")
    private String companyWebsite;

    /** 企业描述 */
    @Size(max = 1000, message = "企业描述不能超过1000字符")
    @Field("companyDescription")
    private String companyDescription;

    /** 联系电话 */
    @Pattern(regexp = "^[0-9-+()\\s]+$", message = "联系电话格式不正确")
    @Field("contactPhone")
    private String contactPhone;

    /** 联系人姓名 */
    @NotBlank(message = "联系人不能为空")
    @Field("contactPerson")
    private String contactPerson;

    /** 联系邮箱 */
    @Pattern(regexp = "^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$", message = "联系邮箱格式不正确")
    @Field("contactEmail")
    private String contactEmail;

    /** 企业状态：active-活跃，inactive-非活跃 */
    @Field("status")
    private String status = "active";

    /** 创建时间 */
    @CreatedDate
    @Field("createdAt")
    private LocalDateTime createdAt;

    /** 更新时间 */
    @LastModifiedDate
    @Field("updatedAt")
    private LocalDateTime updatedAt;

    @Field("logoImage")
    private String logoImage; // 新增字段

    @Field("company_url")
    private String companyUrl;

    @Field("source")
    private String source;
}
