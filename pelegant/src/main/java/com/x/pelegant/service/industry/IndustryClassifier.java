package com.x.pelegant.service.industry;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.x.pelegant.entity.Company;
import org.apache.commons.text.similarity.JaroWinklerSimilarity;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.io.InputStream;
import java.util.*;
import java.util.stream.Collectors;

@Component
public class IndustryClassifier {

    /* ======================= Model ======================= */
    public static class Rule {
        private String sector;
        private String industry;
        private String subIndustry;
        private List<String> keywords;

        public String getSector() { return sector; }
        public void setSector(String sector) { this.sector = sector; }
        public String getIndustry() { return industry; }
        public void setIndustry(String industry) { this.industry = industry; }
        public String getSubIndustry() { return subIndustry; }
        public void setSubIndustry(String subIndustry) { this.subIndustry = subIndustry; }
        public List<String> getKeywords() { return keywords; }
        public void setKeywords(List<String> keywords) { this.keywords = keywords; }
    }

    public static class IndustryResult {
        private String sector;
        private String industry;
        private String subIndustry;

        public IndustryResult(String sector, String industry, String subIndustry) {
            this.sector = sector;
            this.industry = industry;
            this.subIndustry = subIndustry;
        }

        public String getSector() { return sector; }
        public String getIndustry() { return industry; }
        public String getSubIndustry() { return subIndustry; }

        public String flat() {
            return Arrays.asList(sector, industry, subIndustry).stream()
                    .filter(StringUtils::hasText)
                    .collect(Collectors.joining(" - "));
        }
    }

    /* ======================= Load Rules ======================= */
    private final List<Rule> rules;
    private final JaroWinklerSimilarity similarity = new JaroWinklerSimilarity();
    private final double NAME_SIM_THRESHOLD = 0.85;

    public static IndustryClassifier defaultClassifier() {
        return fromClasspathJson("industry-taxonomy.json");
    }

    public static IndustryClassifier fromClasspathJson(String path) {
        try {
            ClassPathResource res = new ClassPathResource(path);
            if (res.exists()) {
                try (InputStream in = res.getInputStream()) {
                    ObjectMapper mapper = new ObjectMapper();
                    List<Rule> external = mapper.readValue(in, new TypeReference<List<Rule>>() {});
                    return new IndustryClassifier(external == null ? Collections.emptyList() : external);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return new IndustryClassifier(Collections.emptyList());
    }

    public IndustryClassifier(List<Rule> rules) {
        this.rules = rules == null ? Collections.emptyList() : rules;
    }

    /* ======================= Classification ======================= */
    public IndustryResult classify(Company company) {
        if (company == null) return new IndustryResult("Unknown", null, null);
        String name = company.getCompanyName();
        String description = company.getCompanyDescription();

        for (Rule r : rules) {
            boolean matched = false;

            // 1️⃣ 关键词完全匹配或包含
            if (r.getKeywords() != null) {
                for (String kw : r.getKeywords()) {
                    if (matches(name, kw) || matches(description, kw)) {
                        matched = true;
                        break;
                    }
                    // ✅ 模糊匹配公司名和关键词
                    if (!matched && matchesFuzzy(name, kw)) {
                        matched = true;
                        break;
                    }
                    if (!matched && matchesFuzzy(description, kw)) {
                        matched = true;
                        break;
                    }
                }
            }

            // 2️⃣ 模糊匹配公司名/描述和 sector/industry/subIndustry
            if (!matched) {
                matched = matchesFuzzy(name, r.getSector())
                        || matchesFuzzy(name, r.getIndustry())
                        || matchesFuzzy(name, r.getSubIndustry())
                        || matchesFuzzy(description, r.getSector())
                        || matchesFuzzy(description, r.getIndustry())
                        || matchesFuzzy(description, r.getSubIndustry());
            }

            if (matched) {
                return new IndustryResult(
                        blankToNull(r.getSector()),
                        blankToNull(r.getIndustry()),
                        blankToNull(r.getSubIndustry())
                );
            }
        }

        return new IndustryResult("Unknown", null, null);
    }

    /* ======================= Matching ======================= */
    private boolean matches(String value, String keyword) {
        if (!StringUtils.hasText(value) || !StringUtils.hasText(keyword)) return false;
        value = normalize(value);
        keyword = normalize(keyword);
        return value.contains(keyword);
    }

    private boolean matchesFuzzy(String value, String term) {
        if (!StringUtils.hasText(value) || !StringUtils.hasText(term)) return false;
        value = normalize(value);
        term = normalize(term);
        return similarity.apply(value, term) >= NAME_SIM_THRESHOLD;
    }

    private String normalize(String s) {
        return s.replaceAll("[\\p{Punct}\\s]+", "").toLowerCase();
    }

    private static String blankToNull(String s) {
        return (s == null || s.trim().isEmpty()) ? null : s.trim();
    }
}
