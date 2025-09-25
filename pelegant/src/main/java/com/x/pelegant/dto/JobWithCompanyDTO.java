package com.x.pelegant.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class JobWithCompanyDTO {
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
    private String companyId;
    private String companyName;
    private String companyType;
    private String companySize;
    private String industry;
    private String companyAddress;
    private String companyWebsite;
    private String companyDescription;
    private String contactPhone;
    private String contactPerson;
    private String contactEmail;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime deadline;
}