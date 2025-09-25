package com.x.pelegant.dto;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * 学生申请工作统计响应DTO
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class StudentApplicationStatsResponse {

    /**
     * 按年级统计的申请数据
     */
    private List<GradeStats> gradeStats;

    /**
     * 按专业统计的申请数据
     */
    private List<MajorStats> majorStats;

    /**
     * 总申请数
     */
    private Long totalApplications;

    /**
     * 总学生数
     */
    private Long totalStudents;

    /**
     * 年级统计数据
     */
    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class GradeStats {
        /**
         * 年级（如：大一、大二、大三、大四、研究生）
         */
        private String grade;

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
         * 该年级学生总数
         */
        private Long totalStudents;
    }

    /**
     * 专业统计数据
     */
    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class MajorStats {
        /**
         * 专业名称
         */
        private String major;

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
         * 该专业学生总数
         */
        private Long totalStudents;
    }
}
