package com.x.pelegant.service;

import com.x.pelegant.entity.Company;
import com.x.pelegant.entity.CrawlerData;
import com.x.pelegant.entity.Job;
import com.x.pelegant.entity.PassJob;
import com.x.pelegant.repository.CompanyRepository;
import com.x.pelegant.repository.CrawlerDataRepository;
import com.x.pelegant.repository.JobRepository;
import com.x.pelegant.repository.PassJobRepository;
import com.x.pelegant.service.industry.IndustryClassifier;
import com.x.pelegant.util.EmploymentClassifier;
import org.apache.commons.text.similarity.CosineSimilarity;
import org.apache.commons.text.similarity.JaroWinklerSimilarity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Service;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

@Service
public class DataMigrationService {

    private static final Logger logger = LoggerFactory.getLogger(DataMigrationService.class);

    private final CrawlerDataRepository crawlerDataRepository;
    private final JobRepository jobRepository;
    private final CompanyRepository companyRepository;
    private final PassJobRepository passJobRepository;

    @Autowired
    private MongoTemplate mongoTemplate;
    @Autowired
    private IndustryClassifier industryClassifier;
    @Autowired
    private EmploymentClassifier employmentClassifier;

    private final ExecutorService executor = Executors.newFixedThreadPool(
            Math.max(4, Runtime.getRuntime().availableProcessors())
    );

    private final JaroWinklerSimilarity similarity = new JaroWinklerSimilarity();
    private final CosineSimilarity cosineSimilarity = new CosineSimilarity();
    private static final double COMPANY_SIMILARITY_THRESHOLD = 0.9;
    private static final double JOB_SIMILARITY_THRESHOLD = 0.9;

    @Value("${pelegant.upload.path}")
    private String documentLocation;
    @Value("${pelegant.log}")
    private String PathName;

    public DataMigrationService(CrawlerDataRepository crawlerDataRepository,
                                JobRepository jobRepository,
                                CompanyRepository companyRepository,
                                PassJobRepository passJobRepository) {
        this.crawlerDataRepository = crawlerDataRepository;
        this.jobRepository = jobRepository;
        this.companyRepository = companyRepository;
        this.passJobRepository = passJobRepository;
    }

    // -------------------- 标准化方法 --------------------
    private String normalizeText(String text) {
        if (text == null) return "";
        return text.toLowerCase()
                .replaceAll("[^a-z0-9 ]", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private String normalizeCompanyName(String rawName) {
        if (rawName == null) return "";
        String name = rawName.trim().toLowerCase();
        name = name.replaceAll("[.,()\\-]", " ");
        name = name.replaceAll("\\bltd\\b", "limited");
        name = name.replaceAll("\\bco\\b", "company");
        name = name.replaceAll("\\bcorp\\b", "corporation");
        name = name.replaceAll("\\blimited company\\b", "limited");
        return name.replaceAll("\\s+", " ").trim();
    }

    private double computeCosineSimilarity(String s1, String s2) {
        if (s1 == null || s2 == null) return 0.0;
        CharSequence cs1 = normalizeText(s1);
        CharSequence cs2 = normalizeText(s2);
        return cosineSimilarity.cosineSimilarity(vectorize(cs1), vectorize(cs2));
    }

    private Map<CharSequence, Integer> vectorize(CharSequence text) {
        Map<CharSequence, Integer> freq = new HashMap<>();
        for (String token : text.toString().split(" ")) {
            if (!token.isEmpty()) {
                freq.put(token, freq.getOrDefault(token, 0) + 1);
            }
        }
        return freq;
    }

    // -------------------- 主方法 --------------------
    public String migrateDataOptimized(List<CrawlerData> dataList) {
        AtomicInteger newJobs = new AtomicInteger(0);
        AtomicInteger passJobs = new AtomicInteger(0);
        CopyOnWriteArrayList<String> duplicateLogs = new CopyOnWriteArrayList<>();
        ConcurrentHashMap<String, Company> companyCache = new ConcurrentHashMap<>();

        // 初始化公司缓存
        companyRepository.findAll().forEach(c -> {
            String normName = normalizeCompanyName(c.getCompanyName());
            companyCache.put(normName, c);
        });

        // 处理公司
        dataList.stream()
                .map(d -> d.getRawData().get("company"))
                .filter(Objects::nonNull)
                .map(Object::toString)
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .distinct()
                .forEach(companyName -> {
                    String normalized = normalizeCompanyName(companyName);

                    companyCache.computeIfAbsent(normalized, k -> {
                        // 模糊匹配已有公司
                        Company existing = companyCache.values().stream()
                                .filter(c -> similarity.apply(c.getCompanyNameLower(), normalized) >= COMPANY_SIMILARITY_THRESHOLD)
                                .findFirst()
                                .orElse(null);

                        if (existing != null) {
                            logger.info("模糊合并公司: {} -> {}", companyName, existing.getCompanyName());
                            return existing;
                        }

                        // 新建公司
                        Map<String, Object> rawData = dataList.stream()
                                .filter(d -> companyName.equalsIgnoreCase((String) d.getRawData().get("company")))
                                .map(CrawlerData::getRawData)
                                .findFirst()
                                .orElse(Collections.emptyMap());

                        Company newCompany = createCompany(rawData);
                        companyRepository.save(newCompany);
                        logger.info("创建新公司: {}", newCompany.getCompanyName());
                        return newCompany;
                    });
                });

        // 处理职位
        dataList.forEach(data -> {
            Map<String, Object> rawData = data.getRawData();
            String companyName = (String) rawData.get("company");
            String jobTitle = (String) rawData.get("title");

            if (companyName == null || jobTitle == null) {
                logger.warn("跳过无效职位: {}", rawData);
                return;
            }

            String normCompany = normalizeCompanyName(companyName);
            Company company = companyCache.get(normCompany);

            if (company == null) {
                // 公司不存在，写入 passjob
                PassJob passJob = mapToPassJob(data);
                passJobRepository.save(passJob);
                passJobs.incrementAndGet();
                logger.info("写入 passjob: {}", passJob.getJobTitle());
                return;
            }

            // 职位去重
            List<Job> existingJobs = jobRepository.findByCompanyId(company.getCompanyId());
            String jobDesc = normalizeText((String) rawData.get("description"));

            boolean isDuplicate = existingJobs.stream().anyMatch(j ->
                    isDuplicateJob(j, rawData, data, company));

            if (isDuplicate) {
                duplicateLogs.add("重复职位: " + jobTitle + " @ " + company.getCompanyName());
                return;
            }


            Job job = mapToJob(data, company.getCompanyId());
            jobRepository.save(job);
            newJobs.incrementAndGet();
            logger.info("创建新职位: {} @ {}", job.getJobTitle(), company.getCompanyName());
        });

        // 写重复日志
        writeDuplicateLog(duplicateLogs);

        return "成功创建职位：" + newJobs.get() + " 条，无公司职位：" + passJobs.get() + " 条";
    }

    // -------------------- 工具方法 --------------------

    private boolean isDuplicateJob(Job existingJob, Map<String, Object> rawData, CrawlerData data, Company company) {
        String newJobTitle = (String) rawData.getOrDefault("title", "");
        String newDescription = (String) rawData.getOrDefault("description", "");
        String newCompanyName = (String) rawData.getOrDefault("company", "");

        String existingTitle = existingJob.getJobTitle() != null ? existingJob.getJobTitle() : "";
        String existingDesc = existingJob.getJobDescription() != null ? existingJob.getJobDescription() : "";
        String existingCompanyName = existingJob.getCompanyName() != null ? existingJob.getCompanyName() : "";

        // 处理新职位 deadline
        LocalDateTime newUpdatedAt = data.getImportTime() != null ? data.getImportTime() : LocalDateTime.now();
        LocalDateTime newDeadline = rawData.get("deadline") != null
                ? LocalDateTime.parse(rawData.get("deadline").toString())
                : newUpdatedAt.plusDays(30);

        // 处理已有职位 deadline
        LocalDateTime existingDeadline = existingJob.getDeadline() != null
                ? existingJob.getDeadline()
                : (existingJob.getUpdatedAt() != null ? existingJob.getUpdatedAt().plusDays(30) : LocalDateTime.now().plusDays(30));

        long diffHours = Math.abs(java.time.Duration.between(existingDeadline, newDeadline).toHours());

        // ----------- 去重逻辑 -----------
        if (newDescription == null || newDescription.trim().isEmpty()) {
            // 如果 description 为空，则用 jobTitle + companyName 判断
            double titleScore = similarity.apply(existingTitle.toLowerCase(), newJobTitle.toLowerCase());
            double companyScore = similarity.apply(existingCompanyName.toLowerCase(), newCompanyName.toLowerCase());

            return titleScore >= JOB_SIMILARITY_THRESHOLD
                    && companyScore >= COMPANY_SIMILARITY_THRESHOLD
                    && diffHours < 24;
        } else {
            // 正常逻辑：description 相似度 + deadline
            String normNewDesc = normalizeText(newDescription);
            String normExistingDesc = normalizeText(existingDesc);
            double score = computeCosineSimilarity(normExistingDesc, normNewDesc);

            return score >= JOB_SIMILARITY_THRESHOLD && diffHours < 24;
        }
    }

    private Company createCompany(Map<String, Object> rawData) {
        Company company = new Company();
        String companyName = rawData.get("company").toString().trim();
        String description = (String) rawData.getOrDefault("description", "");

        IndustryClassifier.IndustryResult industry = industryClassifier.classify(company);

        company.setCompanyId("COM-" + UUID.randomUUID());
        company.setCompanyName(companyName);
        company.setCompanyNameLower(normalizeCompanyName(companyName));
        company.setCompanyType("未知");
        company.setCompanySize("未知");
        company.setSector(industry.getSector() != null ? industry.getSector() : "未知");
        company.setIndustryCategory(industry.getIndustry() != null ? industry.getIndustry() : "未知");
        company.setSubIndustry(industry.getSubIndustry() != null ? industry.getSubIndustry() : "未知");
        company.setIndustry("未知");
        company.setCompanyAddress((String) rawData.getOrDefault("location", "未知地址"));
        company.setCompanyWebsite("");
        company.setCompanyDescription(description);
        company.setContactPhone("");
        company.setContactPerson("");
        company.setContactEmail("");
        company.setStatus("active");
        company.setSource("crawler");

        return company;
    }

    private Job mapToJob(CrawlerData data, String companyId) {
        Map<String, Object> rawData = data.getRawData();
        Job job = new Job();
        job.setId(data.getId());
        job.setJobId(rawData.get("id") != null ? rawData.get("id").toString() : "JOB-" + UUID.randomUUID());
        job.setJobTitle((String) rawData.getOrDefault("title", "Unknown Title"));
        job.setCompanyName((String) rawData.getOrDefault("company", "Unknown Company"));
        job.setJobDescription((String) rawData.getOrDefault("description", "No description"));
        job.setJobRequirements((String) rawData.getOrDefault("experience_range", ""));
        job.setJobType(classifyJobType(rawData));
        job.setWorkLocation((String) rawData.getOrDefault("location", "Unknown Location"));
        job.setMinSalary(toBigDecimal(rawData.get("salary_min")));
        job.setMaxSalary(toBigDecimal(rawData.get("salary_max")));
        job.setSalaryUnit((String) rawData.getOrDefault("currency", "month"));
        job.setSkillsRequired(parseSkills((String) rawData.get("skills")));
        job.setCompanyId(companyId);
        job.setRecruitmentCount(1);
        job.setStatus(data.getStatus() != null ? data.getStatus() : "opening");
        job.setCreatedAt(data.getDataCreateTime());
        job.setUpdatedAt(data.getImportTime());
        job.setDeadline(job.getUpdatedAt() != null ? job.getUpdatedAt().plusDays(30) : LocalDateTime.now().plusDays(30));
        return job;
    }

    private PassJob mapToPassJob(CrawlerData data) {
        Map<String, Object> rawData = data.getRawData();
        PassJob job = new PassJob();
        job.setId(data.getId());
        job.setJobId(UUID.randomUUID().toString());
        job.setJobTitle((String) rawData.getOrDefault("title", "Unknown Title"));
        job.setCompanyName((String) rawData.getOrDefault("company", "Unknown Company"));
        job.setJobDescription((String) rawData.getOrDefault("description", "No description"));
        job.setJobRequirements((String) rawData.getOrDefault("experience_range", ""));
        job.setJobType(classifyJobType(rawData));
        job.setWorkLocation((String) rawData.getOrDefault("location", "Unknown Location"));
        job.setMinSalary(toBigDecimal(rawData.get("salary_min")));
        job.setMaxSalary(toBigDecimal(rawData.get("salary_max")));
        job.setSalaryUnit((String) rawData.getOrDefault("currency", "month"));
        job.setSkillsRequired(parseSkills((String) rawData.get("skills")));
        job.setCompanyId("COM_UNKNOWN");
        job.setRecruitmentCount(1);
        job.setStatus(data.getStatus() != null ? data.getStatus() : "opening");
        job.setCreatedAt(data.getDataCreateTime());
        job.setUpdatedAt(data.getImportTime());
        job.setDeadline(job.getUpdatedAt() != null ? job.getUpdatedAt().plusDays(30) : LocalDateTime.now().plusDays(30));
        return job;
    }

    private String classifyJobType(Map<String, Object> rawData) {
        String title = rawData.get("title") != null ? ((String) rawData.get("title")).toLowerCase() : "";
        String desc = rawData.get("description") != null ? ((String) rawData.get("description")).toLowerCase() : "";
        String typeRaw = rawData.get("job_type") != null ? ((String) rawData.get("job_type")).toLowerCase() : "";
        EmploymentClassifier.JobData jobData = new EmploymentClassifier.JobData(title, desc, typeRaw);
        return employmentClassifier.classify(jobData);
    }

    private BigDecimal toBigDecimal(Object obj) {
        if (obj instanceof Number) return new BigDecimal(obj.toString());
        if (obj instanceof String) {
            try {
                return new BigDecimal(((String) obj).trim());
            } catch (Exception ignored) {}
        }
        return BigDecimal.ZERO;
    }

    private List<String> parseSkills(String skillsStr) {
        if (skillsStr == null || skillsStr.isEmpty()) return Collections.emptyList();
        return Arrays.stream(skillsStr.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }

    private void writeDuplicateLog(List<String> duplicateLogs) {
        if (duplicateLogs.isEmpty()) return;
        try {
            String logFilePath = documentLocation.endsWith("/") || documentLocation.endsWith("\\")
                    ? documentLocation + PathName
                    : documentLocation + "/" + PathName;

            File logFile = new File(logFilePath);
            File parentDir = logFile.getParentFile();
            if (parentDir != null && !parentDir.exists()) parentDir.mkdirs();

            try (BufferedWriter writer = new BufferedWriter(new FileWriter(logFile, true))) {
                for (String log : duplicateLogs) {
                    writer.write(log);
                    writer.newLine();
                }
            }
        } catch (IOException e) {
            logger.error("写重复日志失败: {}", e.getMessage());
        }
    }
}
