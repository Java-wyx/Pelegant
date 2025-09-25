/*
 * @Author: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @Date: 2025-07-08 15:05:02
 * @LastEditors: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @LastEditTime: 2025-07-08 15:43:09
 * @FilePath: \新建文件夹\Pelegant\src\main\java\com\x\pelegant\dto\RecommendedJobResponse.java
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
package com.x.pelegant.dto;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

/**
 * 推荐工作响应DTO
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class RecommendedJobResponse {

    /**
     * 推荐记录ID
     */
    private String recommendationId;

    /**
     * 职位ID
     */
    private String jobId;

    /**
     * 职位标题
     */
    private String jobTitle;

    /**
     * 企业名称
     */
    private String companyName;

    /**
     * 企业ID
     */
    private String companyId;

    /**
     * 工作地点
     */
    private String location;

    /**
     * 薪资范围
     */
    private String salaryRange;

    /**
     * 工作类型：Full-time, Part-time, Contract, Internship
     */
    private String employmentType;

    /**
     * 工作描述
     */
    private String jobDescription;

    /**
     * 技能要求
     */
    private String skillsRequired;

    /**
     * 工作经验要求
     */
    private String experienceLevel;

    /**
     * 学历要求
     */
    private String educationLevel;

    /**
     * 职位状态：active-活跃，inactive-非活跃
     */
    private String jobStatus;

    /**
     * 是否已保存
     */
    private Boolean isSaved;

    /**
     * 是否已申请
     */
    private Boolean isApplied;

    private String logoImage;
}
