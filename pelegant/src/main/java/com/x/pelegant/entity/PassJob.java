package com.x.pelegant.entity;


import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 用于存储未匹配到 company 的爬虫岗位数据
 */
@Data
@Document(collection = "passjob")
public class PassJob {

    @Id
    private String id;

    private String jobId;
    private String jobTitle;
    private String jobDescription;
    private String jobRequirements;
    private String jobType;
    private String workLocation;

    private BigDecimal minSalary;
    private BigDecimal maxSalary;
    private String salaryUnit;

    private String experienceRequired;
    private String educationRequired;
    private List<String> skillsRequired;
    private String benefits;

    private String companyId = "COM_UNKNOWN"; // 默认值
    private String companyName;

    private Integer recruitmentCount;

    private String status;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime deadline;

    // 可选标记字段：来源是爬虫，或标记为未匹配公司
    private String source = "crawler";

    private String jobUrl;
}
