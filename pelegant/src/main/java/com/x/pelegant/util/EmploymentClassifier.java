package com.x.pelegant.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Scope;
import org.springframework.context.annotation.ScopedProxyMode;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.*;
import java.util.concurrent.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Component
@Scope(value = "singleton", proxyMode = ScopedProxyMode.TARGET_CLASS)
public class EmploymentClassifier {

    public static final String TYPE_FULL_TIME_SOCIAL = "full-time-social";
    public static final String TYPE_FULL_TIME_CAMPUS = "full-time-campus";
    public static final String TYPE_INTERN = "intern";
    public static final String TYPE_PART_TIME = "part-time";

    private static final Logger logger = LoggerFactory.getLogger(EmploymentClassifier.class);

    private static final int WEIGHT_KEYWORD = 3;
    private static final int WEIGHT_DURATION = 2;
    private static final int WEIGHT_EXPERIENCE = 3;
    private static final int WEIGHT_RAWTYPE = 4;
    private static final int WEIGHT_MANAGER = 3;

    @Value("${pelegant.upload.path}")
    private String documentLocation;

    @Value("${pelegant.employment.keywords.config}")
    private String keywordsConfigPath;

    private final ExecutorService reloadExecutor = Executors.newSingleThreadExecutor();
    private final ForkJoinPool classifyPool = new ForkJoinPool(Runtime.getRuntime().availableProcessors());

    private volatile Set<String> internKeywords = new HashSet<>();
    private volatile Set<String> campusKeywords = new HashSet<>();
    private volatile Set<String> parttimeKeywords = new HashSet<>();
    private volatile Set<String> noExperienceKeywords = new HashSet<>();
    private volatile Set<String> managerKeywords = new HashSet<>();
    private volatile Set<String> contextExclusionWords = new HashSet<>();
    private volatile Set<String> universityRecruitmentWords = new HashSet<>();
    private volatile Set<String> universityExclusionWords = new HashSet<>();
    private volatile boolean usingDefaultKeywords = true;

    private volatile Map<String, Pattern> keywordPatterns = new HashMap<>();
    private volatile Pattern universityRecruitmentPattern;
    private volatile Pattern universityExclusionPattern;

    private final Map<String, String> explicitRawTypeMapping = createExplicitRawTypeMapping();
    private final Pattern DURATION_PATTERN = Pattern.compile("\\b(\\d+)\\s*(week|month|year)s?\\b", Pattern.CASE_INSENSITIVE);
    private final Pattern EXPERIENCE_YEARS_PATTERN = Pattern.compile(
            "\\b(\\d+)\\+?\\s*(?:to|\\-)\\s*(\\d+)?\\s*(?:years|yrs|year|yr)\\.?\\b|" +
                    "\\b(?:minimum|at least|\\+)\\s*(\\d+)\\s*(?:years|yrs|year|yr)\\.?\\b|" +
                    "\\b(\\d+)\\s*\\+\\s*(?:years|yrs|year|yr)\\.?\\b",
            Pattern.CASE_INSENSITIVE);

    @PostConstruct
    public void init() {
        loadKeywordsAsync();
        log("✅ EmploymentClassifierBatchService 初始化完成，异步加载关键词中...");
    }

    @Scheduled(fixedRate = 300000)
    public void reloadKeywordsIfNeeded() {
        log("⏰ 定期刷新关键词配置...");
        loadKeywordsAsync();
    }

    private Map<String, String> createExplicitRawTypeMapping() {
        Map<String, String> mapping = new HashMap<>();
        mapping.put("intern", TYPE_INTERN);
        mapping.put("internship", TYPE_INTERN);
        mapping.put("co-op", TYPE_INTERN);
        mapping.put("coop", TYPE_INTERN);
        mapping.put("trainee", TYPE_INTERN);
        mapping.put("apprentice", TYPE_INTERN);

        mapping.put("part-time", TYPE_PART_TIME);
        mapping.put("parttime", TYPE_PART_TIME);
        mapping.put("contract", TYPE_PART_TIME);
        mapping.put("temporary", TYPE_PART_TIME);
        mapping.put("freelance", TYPE_PART_TIME);
        mapping.put("casual", TYPE_PART_TIME);

        mapping.put("campus", TYPE_FULL_TIME_CAMPUS);
        mapping.put("graduate", TYPE_FULL_TIME_CAMPUS);
        mapping.put("entry level", TYPE_FULL_TIME_CAMPUS);
        mapping.put("new grad", TYPE_FULL_TIME_CAMPUS);
        mapping.put("campus hire", TYPE_FULL_TIME_CAMPUS);
        mapping.put("recent graduate", TYPE_FULL_TIME_CAMPUS);
        return mapping;
    }

    private String getFullConfigPath() {
        return documentLocation + keywordsConfigPath;
    }

    public void loadKeywordsAsync() {
        reloadExecutor.submit(this::loadKeywordsFromConfig);
    }

    private synchronized void loadKeywordsFromConfig() {
        try {
            String content = new String(Files.readAllBytes(Paths.get(getFullConfigPath())));
            ObjectMapper mapper = new ObjectMapper();
            Map<String, List<String>> config = mapper.readValue(content,
                    new com.fasterxml.jackson.core.type.TypeReference<Map<String, List<String>>>() {});
            internKeywords = new HashSet<>(config.getOrDefault("intern_keywords", Collections.emptyList()));
            campusKeywords = new HashSet<>(config.getOrDefault("campus_keywords", Collections.emptyList()));
            parttimeKeywords = new HashSet<>(config.getOrDefault("parttime_keywords", Collections.emptyList()));
            noExperienceKeywords = new HashSet<>(config.getOrDefault("no_experience_keywords", Collections.emptyList()));
            managerKeywords = new HashSet<>(config.getOrDefault("manager_keywords", Collections.emptyList()));
            contextExclusionWords = new HashSet<>(config.getOrDefault("context_exclusion_words", Collections.emptyList()));
            universityRecruitmentWords = new HashSet<>(config.getOrDefault("university_recruitment_words", Collections.emptyList()));
            universityExclusionWords = new HashSet<>(config.getOrDefault("university_exclusion_words", Collections.emptyList()));

            compileKeywordPatterns();
            compileUniversityPatterns();
            usingDefaultKeywords = false;
            log("✅ 成功加载关键词配置: " + getFullConfigPath());
        } catch (IOException e) {
            log("⚠️ 加载失败，使用默认关键词: " + e.getMessage());
            useDefaultKeywords();
            compileKeywordPatterns();
            compileUniversityPatterns();
            usingDefaultKeywords = true;
        }
    }

    private void compileKeywordPatterns() {
        Map<String, Pattern> patterns = new HashMap<>();
        for (String kw : internKeywords) patterns.put(kw, Pattern.compile("\\b" + Pattern.quote(kw) + "\\b", Pattern.CASE_INSENSITIVE));
        for (String kw : campusKeywords) patterns.put(kw, Pattern.compile("\\b" + Pattern.quote(kw) + "\\b", Pattern.CASE_INSENSITIVE));
        for (String kw : parttimeKeywords) patterns.put(kw, Pattern.compile("\\b" + Pattern.quote(kw) + "\\b", Pattern.CASE_INSENSITIVE));
        for (String kw : noExperienceKeywords) patterns.put(kw, Pattern.compile("\\b" + Pattern.quote(kw) + "\\b", Pattern.CASE_INSENSITIVE));
        for (String kw : managerKeywords) patterns.put(kw, Pattern.compile("\\b" + Pattern.quote(kw) + "\\b", Pattern.CASE_INSENSITIVE));
        keywordPatterns = patterns;
    }

    private void compileUniversityPatterns() {
        if (!universityRecruitmentWords.isEmpty()) {
            universityRecruitmentPattern = Pattern.compile(
                    "\\buniversity\\b.*?\\b(" + String.join("|", universityRecruitmentWords) + ")\\b|" +
                            "\\b(" + String.join("|", universityRecruitmentWords) + ")\\b.*?\\buniversity\\b",
                    Pattern.CASE_INSENSITIVE
            );
        }
        if (!universityExclusionWords.isEmpty()) {
            universityExclusionPattern = Pattern.compile(
                    "\\b(" + String.join("|", universityExclusionWords) + ")\\b",
                    Pattern.CASE_INSENSITIVE
            );
        }
    }

    private void useDefaultKeywords() {
        internKeywords = new HashSet<>(Arrays.asList("intern", "internship", "summer analyst", "co-op", "coop", "placement", "off-cycle", "trainee", "apprentice", "student worker"));
        campusKeywords = new HashSet<>(Arrays.asList("graduate program", "new grad", "campus hire", "entry level", "management trainee", "college graduate", "graduate", "fresh graduate", "graduate recruitment", "early career", "recent graduate", "campus recruitment", "student program", "campus program", "graduate scheme", "young talent", "junior"));
        parttimeKeywords = new HashSet<>(Arrays.asList("part-time", "part time", "temporary", "contract", "freelance", "flexible", "hourly", "on-call", "as needed", "casual"));
        noExperienceKeywords = new HashSet<>(Arrays.asList("no experience", "fresh graduate", "new graduate", "unlimited experience", "no prior experience", "entry level", "0 years", "fresher", "recent graduate", "no experience required", "experience not required"));
        managerKeywords = new HashSet<>(Arrays.asList("manager", "director", "vp", "vice president", "head of", "chief", "lead", "supervisor", "senior", "principal", "executive"));
        contextExclusionWords = new HashSet<>(Arrays.asList("year", "years", "experience", "manager", "director", "vp", "vice president", "head of", "chief", "lead", "supervisor", "senior"));
        universityRecruitmentWords = new HashSet<>(Arrays.asList("graduate", "recruitment", "hire", "program", "campus", "career", "fair", "talent", "entry", "level", "new", "recent", "student", "placement"));
        universityExclusionWords = new HashSet<>(Arrays.asList("professor", "lecturer", "teacher", "faculty", "staff", "hospital", "medical", "research", "study", "studies", "degree", "diploma", "certificate", "alumni", "academic", "education", "teaching", "lecture"));
    }

    private boolean containsKeywordParallel(String text, Set<String> keywords) {
        return keywords.parallelStream().anyMatch(kw -> {
            Pattern p = keywordPatterns.get(kw);
            return p != null && p.matcher(text).find();
        });
    }

    /** =================== 分块批量分类 =================== */
    public List<ClassificationResult> classifyBatchChunked(List<JobData> jobs, int chunkSize) {
        if (jobs == null || jobs.isEmpty()) return Collections.emptyList();

        List<ClassificationResult> results = new ArrayList<>();
        int total = jobs.size();
        for (int start = 0; start < total; start += chunkSize) {
            int end = Math.min(start + chunkSize, total);
            List<JobData> subList = jobs.subList(start, end);
            try {
                List<ClassificationResult> chunkResult = classifyPool.submit(() ->
                        subList.parallelStream()
                                .map(this::classifyJob)
                                .collect(Collectors.toList())
                ).get();
                results.addAll(chunkResult);
            } catch (InterruptedException | ExecutionException e) {
                log("⚠️ 分块处理异常: " + e.getMessage());
            }
        }
        return results;
    }

    private ClassificationResult classifyJob(JobData job) {
        String type = classify(job);
        return new ClassificationResult(job, type);
    }

    /** =================== 单条 classify =================== */
    public String classify(JobData job) {
        String title = job.getTitle() != null ? job.getTitle().toLowerCase() : "";
        String desc = job.getDescription() != null ? job.getDescription().toLowerCase() : "";
        String combined = title + " " + desc;
        String rawType = job.getRawType();

        String classification = null;
        int weight = 0;

        if (containsKeywordParallel(combined, internKeywords)) { classification = TYPE_INTERN; weight = WEIGHT_KEYWORD; }
        if (containsKeywordParallel(combined, campusKeywords) || containsKeywordParallel(combined, noExperienceKeywords)) {
            if (weight < WEIGHT_KEYWORD || !TYPE_INTERN.equals(classification)) { classification = TYPE_FULL_TIME_CAMPUS; weight = WEIGHT_KEYWORD; }
        }
        if (containsKeywordParallel(combined, parttimeKeywords)) {
            if (weight < WEIGHT_KEYWORD || (TYPE_INTERN.equals(classification) || TYPE_FULL_TIME_CAMPUS.equals(classification))) { classification = TYPE_PART_TIME; weight = WEIGHT_KEYWORD; }
        }

        Matcher dur = DURATION_PATTERN.matcher(desc);
        if (dur.find()) {
            if (containsKeywordParallel(combined, internKeywords)) { if (weight < WEIGHT_DURATION) { classification = TYPE_INTERN; weight = WEIGHT_DURATION; } }
            else if (containsKeywordParallel(combined, parttimeKeywords)) { if (weight < WEIGHT_DURATION) { classification = TYPE_PART_TIME; weight = WEIGHT_DURATION; } }
        }

        int expYears = extractExperienceYears(combined);
        if (expYears >= 0) {
            if (expYears >= 3 && weight < WEIGHT_EXPERIENCE) { classification = TYPE_FULL_TIME_SOCIAL; weight = WEIGHT_EXPERIENCE; }
            else if (weight < WEIGHT_EXPERIENCE) { classification = TYPE_FULL_TIME_CAMPUS; weight = WEIGHT_EXPERIENCE; }
        }

        if (containsKeywordParallel(combined, managerKeywords) && weight < WEIGHT_MANAGER) { classification = TYPE_FULL_TIME_SOCIAL; weight = WEIGHT_MANAGER; }

        if (rawType != null && weight < WEIGHT_RAWTYPE) {
            String mapped = explicitRawTypeMapping.get(rawType.toLowerCase().trim());
            if (mapped != null) { classification = mapped; weight = WEIGHT_RAWTYPE; }
        }

        if (classification == null) classification = TYPE_FULL_TIME_SOCIAL;
        return classification;
    }

    /** =================== 数据结构 =================== */
    public static class JobData {
        private final String title; private final String description; private final String rawType;
        public JobData(String title, String description, String rawType) { this.title = title; this.description = description; this.rawType = rawType; }
        public String getTitle() { return title; } public String getDescription() { return description; } public String getRawType() { return rawType; }
    }

    public static class ClassificationResult {
        private final JobData job; private final String classification;
        public ClassificationResult(JobData job, String classification) { this.job = job; this.classification = classification; }
        public JobData getJob() { return job; } public String getClassification() { return classification; }
    }

    private void log(String msg) { System.out.println(msg); logger.info(msg); }

    private int extractExperienceYears(String text) {
        Matcher expMatcher = EXPERIENCE_YEARS_PATTERN.matcher(text);
        int maxYears = -1;

        while (expMatcher.find()) {
            try {
                if (expMatcher.group(1) != null && expMatcher.group(2) != null) {
                    int end = Integer.parseInt(expMatcher.group(2));
                    maxYears = Math.max(maxYears, end);
                } else if (expMatcher.group(3) != null) {
                    int years = Integer.parseInt(expMatcher.group(3));
                    maxYears = Math.max(maxYears, years);
                } else if (expMatcher.group(4) != null) {
                    int years = Integer.parseInt(expMatcher.group(4));
                    maxYears = Math.max(maxYears, years);
                }
            } catch (NumberFormatException e) {
                log("⚠️ 经验年份解析失败");
            }
        }
        return maxYears;
    }
    public void refreshKeywordsAsync() {
        CompletableFuture.runAsync(this::loadKeywordsFromConfig);
    }

}
