package com.x.pelegant.dto;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 企业收到工作申请统计响应DTO
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class CompanyApplicationStatsResponse {

    /**
     * 企业统计数据列表
     */
    private List<CompanyStats> companyStats;

    /**
     * 总申请数
     */
    private Long totalApplications;

    /**
     * 总企业数
     */
    private Long totalCompanies;

    /**
     * 企业统计数据
     */
    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class CompanyStats {
        /**
         * 企业排名
         */
        private Integer rank;

        /**
         * 企业名称
         */
        private String companyName;

        /**
         * 企业ID
         */
        private String companyId;

        /**
         * 实习申请数
         */
        private Long internshipApplications;

        /**
         * 全职申请数
         */
        private Long fullTimeApplications;

        /**
         * 总申请数
         */
        private Long totalApplications;

        /**
         * 该企业发布的职位数
         */
        private Long totalJobs;
    }
}
