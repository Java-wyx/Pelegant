package com.x.pelegant.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Pattern;
import java.time.LocalDate;

/**
 * 企业添加请求DTO
 * 包含字段：企业名称、行业、类型、所在地、联系人、联系方式（企业编号自动生成）
 */
@Data
public class CompanyCreateRequest {

    /**
     * 企业名称
     */
    @NotBlank(message = "企业名称不能为空")
    private String companyName;

    /**
     * 所属行业
     */
    @NotBlank(message = "所属行业不能为空")
    private String industry;

    /**
     * 企业类型
     */
    @NotBlank(message = "企业类型不能为空")
    private String companyType;

    /**
     * 企业地址（所在地）
     */
    @NotBlank(message = "企业地址不能为空")
    private String companyAddress;

    /**
     * 联系人姓名
     */
    @NotBlank(message = "联系人不能为空")
    private String contactPerson;

    /**
     * 联系电话
     */
    @Pattern(regexp = "^[0-9-+()\\s]+$", message = "联系电话格式不正确")
    private String contactPhone;

    /**
     * 联系邮箱
     */
    @Pattern(regexp = "^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$", message = "联系邮箱格式不正确")
    private String contactEmail;

    /**
     * 公司状态
     */
    private String status;
    /**
     * 合作时间
     */
    @JsonFormat(pattern = "yyyy-MM-dd")  // 只显示年月日
    private LocalDate partnershipDate;
}