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
import javax.validation.constraints.Min;
import javax.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 职位实体类
 */
@Data
@EqualsAndHashCode(callSuper = false)
@Document(collection = "job")
public class Job {

    /**
     * 主键ID
     */
    @Id
//    @Field("_id") // 明确映射
    private String id;

    /**
     * 职位编号
     */
    @NotBlank(message = "职位编号不能为空")
    @Indexed(unique = true)
    @Field("jobId")
    private String jobId;

    /**
     * 职位名称
     */
    @NotBlank(message = "职位名称不能为空")
    @Field("jobTitle")
    private String jobTitle;

    /**
     * 职位描述
     */
    @NotBlank(message = "职位描述不能为空")
    @Size(max = 2000, message = "职位描述不能超过2000字符")
    @Field("jobDescription")
    private String jobDescription;

    /**
     * 职位要求
     */
    @Size(max = 1500, message = "职位要求不能超过1500字符")
    @Field("jobRequirements")
    private String jobRequirements;

    /**
     * 职位类型：full-time全职, internship实习
     */
    @NotBlank(message = "职位类型不能为空")
    @Field("jobType")
    private String jobType;

    /**
     * 工作地点
     */
    @NotBlank(message = "工作地点不能为空")
    @Field("workLocation")
    private String workLocation;

    /**
     * 最低薪资
     */
    @Min(value = 0, message = "最低薪资不能为负数")
    @Field("minSalary")
    private BigDecimal minSalary;

    /**
     * 最高薪资
     */
    @Min(value = 0, message = "最高薪资不能为负数")
    @Field("maxSalary")
    private BigDecimal maxSalary;

    /**
     * 薪资单位：month月薪, year年薪, hour时薪
     */
    @Field("salaryUnit")
    private String salaryUnit = "month";

    /**
     * 经验要求
     */
    @Field("experienceRequired")
    private String experienceRequired;

    /**
     * 学历要求
     */
    @Field("educationRequired")
    private String educationRequired;

    /**
     * 技能要求列表
     */
    @Field("skillsRequired")
    private List<String> skillsRequired;

    /**
     * 福利待遇
     */
    @Size(max = 1000, message = "福利待遇不能超过1000字符")
    @Field("benefits")
    private String benefits;

    /**
     * 所属企业ID
     */
    @NotBlank(message = "所属企业不能为空")
    @Field("companyId")
    private String companyId;

    /**
     * 所属企业名称（冗余字段，便于查询）
     */
    @Field("companyName")
    private String companyName;

    @Field("logoImage")
    private String logoImage;

    @Field("jobUrl")
    private String jobUrl;

    /**
     * 招聘人数
     */
    @Min(value = 1, message = "招聘人数至少为1")
    @Field("recruitmentCount")
    private Integer recruitmentCount = 1;

    /**
     * 职位状态：open开放, closed关闭, suspended暂停
     */
    @Field("status")
    private String status = "opening";

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

    /**
     * 职位截止日期
     */
    @Field("deadline")
    private LocalDateTime deadline;

    private String companyUrl;

    @Indexed(unique = true)
    private String uniqueKey;

}