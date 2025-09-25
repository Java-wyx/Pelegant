package com.x.pelegant.dto;

import lombok.Data;

@Data
public class RawDataDTO {
    private String id;
    private String title;
    private String company;
    private String location;
    private String datePosted;
    private String jobType;
    private Double salaryMin;
    private Double salaryMax;
    private String currency;
    private Boolean isRemote;
    private String description;
    private String companyIndustry;
    private String skills;
    private String experienceRange;
    private String jobUrl;
    private String companyUrl;
}