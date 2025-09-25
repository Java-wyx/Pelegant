package com.x.pelegant.dto;

import lombok.Data;

@Data
public class DashboardDataDto {
    private Integer totalStudents;
    private Integer totalStudentsincrease;
    private String totalStudentsincreasePercent;
    private Integer totalJobs;
    private Integer totalJobsincrease;
    private String totalJobsincreasePercent;
    private Integer totalCompanies;
    private Integer totalCompaniesincrease;
    private String totalCompaniesincreasePercent;
    private Integer totalSchools;
    private Integer totalSchoolsincrease;
    private String totalSchoolsincreasePercent;
}
