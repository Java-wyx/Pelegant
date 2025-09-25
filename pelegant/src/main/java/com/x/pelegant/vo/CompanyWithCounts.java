package com.x.pelegant.vo;

import com.x.pelegant.entity.Company;

import java.util.Map;

/**
 * 企业 + 统计信息 VO
 */
public class CompanyWithCounts {
    private Company company;               // 企业信息
    private Long studentCount;             // 学生数量
    private Map<String, Long> jobTypeCounts; // 各岗位类型数量

    public CompanyWithCounts() {
    }

    public CompanyWithCounts(Company company, Long studentCount, Map<String, Long> jobTypeCounts) {
        this.company = company;
        this.studentCount = studentCount;
        this.jobTypeCounts = jobTypeCounts;
    }

    public Company getCompany() {
        return company;
    }

    public void setCompany(Company company) {
        this.company = company;
    }

    public Long getStudentCount() {
        return studentCount;
    }

    public void setStudentCount(Long studentCount) {
        this.studentCount = studentCount;
    }

    public Map<String, Long> getJobTypeCounts() {
        return jobTypeCounts;
    }

    public void setJobTypeCounts(Map<String, Long> jobTypeCounts) {
        this.jobTypeCounts = jobTypeCounts;
    }

    @Override
    public String toString() {
        return "CompanyWithCounts{" +
                "company=" + company +
                ", studentCount=" + studentCount +
                ", jobTypeCounts=" + jobTypeCounts +
                '}';
    }
}
