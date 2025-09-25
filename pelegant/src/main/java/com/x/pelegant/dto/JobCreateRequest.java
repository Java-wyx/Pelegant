
package com.x.pelegant.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Min;
import javax.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 职位添加请求DTO（职位编号自动生成）
 */
@Data
public class JobCreateRequest {

    /**
     * 职位名称
     */
    @NotBlank(message = "职位名称不能为空")
    private String jobTitle;

    /**
     * 职位描述
     */
    @NotBlank(message = "职位描述不能为空")
    @Size(max = 2000, message = "职位描述不能超过2000字符")
    private String jobDescription;

    /**
     * 职位要求
     */
    @Size(max = 1500, message = "职位要求不能超过1500字符")
    private String jobRequirements;

    /**
     * 职位类型：full-time全职, internship实习
     */
    @NotBlank(message = "职位类型不能为空")
    private String jobType;

    /**
     * 工作地点
     */
    @NotBlank(message = "工作地点不能为空")
    private String workLocation;

    /**
     * 最低薪资
     */
    @Min(value = 0, message = "最低薪资不能为负数")
    private BigDecimal minSalary;

    /**
     * 最高薪资
     */
    @Min(value = 0, message = "最高薪资不能为负数")
    private BigDecimal maxSalary;

    /**
     * 薪资单位：month月薪, year年薪, hour时薪
     */
    private String salaryUnit = "month";

    /**
     * 经验要求
     */
    private String experienceRequired;

    /**
     * 学历要求
     */
    private String educationRequired;

    /**
     * 技能要求列表
     */
    private List<String> skillsRequired;

    /**
     * 福利待遇
     */
    @Size(max = 1000, message = "福利待遇不能超过1000字符")
    private String benefits;

    /**
     * 所属企业ID
     */
    @NotBlank(message = "所属企业不能为空")
    private String companyId;

    /**
     * 招聘人数
     */
    @Min(value = 1, message = "招聘人数至少为1")
    private Integer recruitmentCount = 1;

    /**
     * 职位截止日期
     */
    private LocalDateTime deadline;
    /**
     * 职位状态
     */
    private String status = "opening";
}