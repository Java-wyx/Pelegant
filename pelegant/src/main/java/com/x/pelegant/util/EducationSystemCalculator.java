package com.x.pelegant.util;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import java.io.File;
import java.time.Year;
import java.util.Map;

@Component
public class EducationSystemCalculator {

    private Map<String, CountryEducationSystem> educationSystems;
    private ObjectMapper objectMapper = new ObjectMapper()
            .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

    // 配置注入
    @Value("${pelegant.upload.path}")
    private String documentLocation;

    @Value("${pelegant.education.keywords.config}")
    private String keywordsConfigPath;

    @PostConstruct
    public void init() {
        try {
            String fullPath = documentLocation + File.separator + keywordsConfigPath;
            File file = new File(fullPath);
            if (file.exists()) {
                educationSystems = objectMapper.readValue(file,
                        objectMapper.getTypeFactory().constructMapType(
                                Map.class, String.class, CountryEducationSystem.class));
            } else {
                throw new RuntimeException("教育体系配置文件不存在: " + fullPath);
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to load education system data", e);
        }
    }

    public String calculateGrade(String country, Integer enrollmentYear, Boolean isMaster, Boolean isPhd) {
        if (enrollmentYear == null) return "Unknown";

        int currentYear = Year.now().getValue();
        int gradeLevel = currentYear - enrollmentYear + 1;

        CountryEducationSystem countrySystem = educationSystems.get(country);
        if (countrySystem == null) {
            return getDefaultGradeName(gradeLevel, isMaster, isPhd);
        }

        Degree level;
        if (Boolean.TRUE.equals(isPhd)) {
            level = countrySystem.getEducationSystem().getPhd();
        } else if (Boolean.TRUE.equals(isMaster)) {
            level = countrySystem.getEducationSystem().getMaster();
        } else {
            level = countrySystem.getEducationSystem().getUndergraduate();
        }

        if (gradeLevel > level.getDuration()) {
            if (Boolean.TRUE.equals(isPhd)) return "Post-Doctoral";
            if (Boolean.TRUE.equals(isMaster)) return "Master Extended";
            return "Graduate";
        }

        String yearKey = "year_" + gradeLevel;
        return level.getYearNames().getOrDefault(yearKey, getDefaultGradeName(gradeLevel, isMaster, isPhd));
    }

    private String getDefaultGradeName(int gradeLevel, Boolean isMaster, Boolean isPhd) {
        if (Boolean.TRUE.equals(isPhd)) return "Doctoral Year " + Math.min(gradeLevel, 3);
        if (Boolean.TRUE.equals(isMaster)) return "Master Year " + Math.min(gradeLevel, 2);

        switch (gradeLevel) {
            case 1: return "Freshman";
            case 2: return "Sophomore";
            case 3: return "Junior";
            case 4: return "Senior";
            case 5: case 6: return "Graduate";
            default: return gradeLevel > 6 ? "Doctoral" : "Preparatory";
        }
    }

    // ==================== 嵌套类 ====================

    public static class CountryEducationSystem {
        @JsonProperty("education_system")
        private EducationSystem educationSystem;

        @JsonProperty("last_updated")
        private String lastUpdated;

        public EducationSystem getEducationSystem() { return educationSystem; }
        public void setEducationSystem(EducationSystem educationSystem) { this.educationSystem = educationSystem; }
        public String getLastUpdated() { return lastUpdated; }
        public void setLastUpdated(String lastUpdated) { this.lastUpdated = lastUpdated; }
    }

    public static class EducationSystem {
        @JsonProperty("undergraduate")
        private Degree undergraduate;

        @JsonProperty("master")
        private Degree master;

        @JsonProperty("phd")
        private Degree phd;

        public Degree getUndergraduate() { return undergraduate; }
        public void setUndergraduate(Degree undergraduate) { this.undergraduate = undergraduate; }
        public Degree getMaster() { return master; }
        public void setMaster(Degree master) { this.master = master; }
        public Degree getPhd() { return phd; }
        public void setPhd(Degree phd) { this.phd = phd; }
    }

    public static class Degree {
        @JsonProperty("duration")
        private int duration;

        @JsonProperty("local_name")
        private String localName;

        @JsonProperty("year_names")
        private Map<String, String> yearNames;

        public int getDuration() { return duration; }
        public void setDuration(int duration) { this.duration = duration; }
        public String getLocalName() { return localName; }
        public void setLocalName(String localName) { this.localName = localName; }
        public Map<String, String> getYearNames() { return yearNames; }
        public void setYearNames(Map<String, String> yearNames) { this.yearNames = yearNames; }
    }
}
