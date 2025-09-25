package com.x.pelegant.dto;

import lombok.Data;

import java.time.Year;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 学校统计信息响应类
 */
@Data
public class SchoolStatisticsResponse {
    private long totalSchools;
    private long newSchoolsThisYear;
    private List<String> continents;
    private List<String> countries;
    private Map<String, Long> schoolsByContinent;
    private String mostSchoolsContinent;
    private long mostSchoolsContinentCount;
    private String topCountry;
    private long topCountryCount;
    private Map<Integer, Long> monthlyNewSchools;

    private Map<String, Long> schoolsByCountry;

    private List<ContinentCount> continentCounts;

    @Data
    public static class ContinentCount {
        private String id; // 洲名
        private long count; // 洲总学校数
        private List<CountryCount> countries;
    }

    @Data
    public static class CountryCount {
        private String id; // 国家名
        private long count; // 学校数量
    }
}
