package com.x.pelegant.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mongodb.MongoWriteException;
import com.mongodb.client.result.UpdateResult;
import com.x.pelegant.dto.TaskInfo;
import com.x.pelegant.entity.CrawlerData;
import com.x.pelegant.entity.Job;
import com.x.pelegant.entity.PassJob;
import com.x.pelegant.repository.CrawlerDataRepository;
import com.x.pelegant.repository.JobRepository;
import com.x.pelegant.repository.PassJobRepository;
import com.x.pelegant.repository.StudentRepository;
import com.x.pelegant.repository.RecommendedWorkRepository;
import com.x.pelegant.util.EmploymentClassifier;
import org.bson.types.ObjectId;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.io.BufferedWriter;
import java.io.FileWriter;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
public class NewDataMigrationService {

    private static final Logger logger = LoggerFactory.getLogger(NewDataMigrationService.class);

    @Autowired
    private CrawlerDataRepository crawlerDataRepository;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private PassJobRepository passjobRepository;

    @Autowired
    private MongoTemplate mongoTemplate;

    @Autowired
    private EmploymentClassifier employmentClassifier;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private RecommendedWorkRepository recommendedWorkRepository;

    @Autowired
    private RedisTemplate<String, String> redisTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    @Value("${pelegant.upload.path}")
    private String documentLocation;

    @Value("${pelegant.log}")
    private String PathName;

    private final List<String> duplicateLogs = Collections.synchronizedList(new ArrayList<>());

    // 用于存储去重键的映射
    private final Map<String, String> jobDedupKeys = new HashMap<>();
    private final Map<String, String> passJobDedupKeys = new HashMap<>();

    /** 批次迁移入口，支持多种JSON格式 */
    public Map<String, Object> migrateFromJsonInBatches(String jsonInput, Map<String, String> companyNameToIdMap, int batchSize) {
        List<Map<String, Object>> rawJobList = parseJsonInput(jsonInput);
        Map<String, Object> result = new HashMap<>();
        List<RecordMigrationDetail> allRecordDetails = new ArrayList<>(); // Collect all record details

        if (rawJobList.isEmpty()) {
            result.put("summary", "无有效职位数据");
            result.put("jobsMigrated", 0);
            result.put("passJobsMigrated", 0);
            result.put("duplicatesFound", 0);
            result.put("details", Collections.emptyList());
            result.put("recordDetails", Collections.emptyList());
            result.put("nonSuccessfulJobRecords", Collections.emptyList()); // 添加这一行
            return result;
        }

        int totalJobsInserted = 0;
        int totalPassJobs = 0;
        int totalDuplicates = 0; // Track total duplicates
        int total = rawJobList.size();
        int pages = (total + batchSize - 1) / batchSize;

        List<Map<String, Object>> batchDetails = new ArrayList<>();

        for (int i = 0; i < pages; i++) {
            int fromIndex = i * batchSize;
            int toIndex = Math.min(fromIndex + batchSize, total);
            List<Map<String, Object>> batchList = new ArrayList<>(rawJobList.subList(fromIndex, toIndex));

            List<CrawlerData> wrappedBatch = batchList.stream().map(data -> {
                CrawlerData cd = new CrawlerData();
                cd.setId(new ObjectId().toString());
                cd.setRawData(data);
                String datePosted = (String) data.get("date_posted");
                if (datePosted == null || datePosted.isEmpty()) {
                    datePosted = (String) data.get("_date_posted");
                }
                cd.setDataCreateTime(parseDateTime(datePosted));
                cd.setImportTime(LocalDateTime.now());
                cd.setStatus("opening");
                cd.setSourceUrl((String) data.getOrDefault("job_url", ""));
                return cd;
            }).filter(cd -> cd.getDataCreateTime() != null).collect(Collectors.toList());

            Map<String, Object> batchResult = processBatchAndReturnStats(wrappedBatch, companyNameToIdMap);
            totalJobsInserted += (Integer) batchResult.getOrDefault("jobs", 0);
            totalPassJobs += (Integer) batchResult.getOrDefault("passJobs", 0);
            totalDuplicates += (Integer) batchResult.getOrDefault("duplicates", 0);
            allRecordDetails.addAll((List<RecordMigrationDetail>) batchResult.getOrDefault("recordDetails", Collections.emptyList()));

            Map<String, Object> batchDetail = new HashMap<>();
            batchDetail.put("batch", i + 1);
            batchDetail.put("jobsMigrated", batchResult.getOrDefault("jobs", 0));
            batchDetail.put("passJobsMigrated", batchResult.getOrDefault("passJobs", 0));
            batchDetail.put("duplicates", batchResult.getOrDefault("duplicates", 0));
            batchDetails.add(batchDetail);
        }

        writeDuplicateLog();

        // 筛选出未成功写入 job 的记录
        List<RecordMigrationDetail> nonSuccessfulJobRecords = filterNonSuccessfulJobRecords(allRecordDetails);

        result.put("summary", "成功迁移 Job：" + totalJobsInserted + " 条，未匹配公司 PassJob：" + totalPassJobs + " 条，重复记录：" + totalDuplicates + " 条");
        result.put("jobsMigrated", totalJobsInserted);
        result.put("passJobsMigrated", totalPassJobs);
        result.put("duplicatesFound", totalDuplicates);
        result.put("details", batchDetails);
        result.put("recordDetails", allRecordDetails); // Add per-record details
        result.put("nonSuccessfulJobRecords", nonSuccessfulJobRecords); // 添加这一行

        return result;
    }

    /** 解析多种JSON格式 */
    private List<Map<String, Object>> parseJsonInput(String jsonInput) {
        List<Map<String, Object>> rawJobList = new ArrayList<>();
        try {
            JsonNode rootNode = objectMapper.readTree(jsonInput);

            if (rootNode.isArray()) {
                // 第一种格式：直接是职位数组
                for (JsonNode node : rootNode) {
                    Map<String, Object> jobMap = objectMapper.convertValue(node, new TypeReference<Map<String, Object>>() {});
                    rawJobList.add(jobMap);
                }
            } else if (rootNode.isObject()) {
                if (rootNode.has("request")) {
                    // 第二种格式：包含request的HTTP字符串，内嵌职位数组
                    String requestStr = rootNode.get("request").asText();

                    // 提取JSON数组部分（跳过HTTP头）
                    int jsonStart = requestStr.indexOf("[");
                    int jsonEnd = requestStr.lastIndexOf("]");

                    if (jsonStart != -1 && jsonEnd != -1 && jsonEnd > jsonStart) {
                        String jsonArrayStr = requestStr.substring(jsonStart, jsonEnd + 1);
                        JsonNode arrayNode = objectMapper.readTree(jsonArrayStr);

                        if (arrayNode.isArray()) {
                            for (JsonNode node : arrayNode) {
                                Map<String, Object> jobMap = objectMapper.convertValue(node, new TypeReference<Map<String, Object>>() {});
                                rawJobList.add(jobMap);
                            }
                        }
                    }
                } else if (rootNode.has("title") && rootNode.has("company")) {
                    // 第三种格式：单个职位对象
                    Map<String, Object> jobMap = objectMapper.convertValue(rootNode, new TypeReference<Map<String, Object>>() {});
                    rawJobList.add(jobMap);
                }
            }
        } catch (IOException e) {
            logger.error("JSON解析失败: {}", e.getMessage());
        }
        return rawJobList;
    }

    /** 处理单批次 */
    private Map<String, Object> processBatchAndReturnStats(List<CrawlerData> batchData, Map<String, String> companyNameToIdMap) {
        String batchKey = "crawler:batch:" + UUID.randomUUID().toString();
        List<RecordMigrationDetail> recordDetails = new ArrayList<>();
        int duplicateCount = 0;

        try {
            // 暂存批次到Redis Hash
            for (int i = 0; i < batchData.size(); i++) {
                CrawlerData cd = batchData.get(i);
                String dataJson = objectMapper.writeValueAsString(cd);
                redisTemplate.opsForHash().put(batchKey, String.valueOf(i), dataJson);
            }

            List<Job> jobsToInsert = new ArrayList<>();
            List<PassJob> passJobsToInsert = new ArrayList<>();

            List<String> keys = redisTemplate.opsForHash().keys(batchKey)
                    .stream()
                    .map(Object::toString)
                    .collect(Collectors.toList());

            for (String idx : keys) {
                String dataJson = (String) redisTemplate.opsForHash().get(batchKey, idx);
                if (dataJson == null) continue;

                CrawlerData data = objectMapper.readValue(dataJson, CrawlerData.class);
                Object result = processOneData(data, companyNameToIdMap);

                String jobTitle = Optional.ofNullable(data.getRawData().get("title")).map(Object::toString).map(String::trim).orElse("");
                String companyName = Optional.ofNullable(data.getRawData().get("company")).map(Object::toString).map(String::trim).orElse("");
                String jobUrl = data.getSourceUrl();

                if (result == null) {
                    // Deduplicated or invalid
                    String message = duplicateLogs.isEmpty() ? "Invalid or deduplicated data" : duplicateLogs.get(duplicateLogs.size() - 1);
                    recordDetails.add(new RecordMigrationDetail(
                            data.getId(), jobTitle, companyName, jobUrl,
                            message.contains("重复") ? "dedup_redis" : "invalid", message));
                    if (message.contains("重复")) duplicateCount++;
                    redisTemplate.opsForHash().delete(batchKey, idx);
                    continue;
                }

                if (result instanceof Job) {
                    Job job = (Job) result;
                    jobsToInsert.add(job);
                    String dedupKey = buildDedupKey(job.getJobTitle(), job.getCompanyName(), job.getCreatedAt(), job.getJobUrl());
                    jobDedupKeys.put(job.getId(), dedupKey);
                    recordDetails.add(new RecordMigrationDetail(
                            data.getId(), jobTitle, companyName, jobUrl, "migrated_job", "Migrated to Job collection"));
                } else if (result instanceof PassJob) {
                    PassJob passJob = (PassJob) result;
                    passJobsToInsert.add(passJob);
                    String dedupKey = buildDedupKey(passJob.getJobTitle(), passJob.getCompanyName(), passJob.getCreatedAt(), passJob.getJobUrl());
                    passJobDedupKeys.put(passJob.getId(), dedupKey);
                    recordDetails.add(new RecordMigrationDetail(
                            data.getId(), jobTitle, companyName, jobUrl, "migrated_passjob", "Migrated to PassJob collection"));
                }
            }

            // Save jobs and pass jobs, tracking DB-level duplicates
            int jobsInserted = saveJobsBatchWithDetails(jobsToInsert, recordDetails);
            int passJobsInserted = savePassJobsBatchWithDetails(passJobsToInsert, recordDetails);

            updateCompanyUrls(batchData, companyNameToIdMap);

            Map<String, Object> resultMap = new HashMap<>();
            resultMap.put("jobs", jobsInserted);
            resultMap.put("passJobs", passJobsInserted);
            resultMap.put("duplicates", duplicateCount);
            resultMap.put("recordDetails", recordDetails);
            return resultMap;
        } catch (Exception e) {
            logger.error("批次处理异常: {}", e.getMessage(), e);
            return Collections.emptyMap();
        } finally {
            redisTemplate.delete(batchKey);
        }
    }
    /** 处理单条数据 */
    private Object processOneData(CrawlerData data, Map<String, String> companyNameToIdMap) {
        Map<String, Object> rawData = data.getRawData();
        String jobTitle = Optional.ofNullable(rawData.get("title")).map(Object::toString).map(String::trim).orElse("");
        String companyName = Optional.ofNullable(rawData.get("company")).map(Object::toString).map(String::trim).orElse("");
        String description = Optional.ofNullable(rawData.get("job_description")).map(Object::toString).map(String::trim).orElse("");
        String sourceUrl = data.getSourceUrl();
        LocalDateTime createTime = data.getDataCreateTime();

        if (companyName.isEmpty() || jobTitle.isEmpty()) {
            String message = String.format("忽略无效数据: %s, 公司: %s, URL: %s, 日期: %s", jobTitle, companyName, sourceUrl, createTime);
            duplicateLogs.add(message);
            return null;
        }

        String dedupKey = buildDedupKey(jobTitle, companyName, createTime, sourceUrl);
        String dedupRedisKey = "dedup:job:" + dedupKey;

        // Redis检查重复
        if (description.isEmpty()) {
            Boolean isNew = redisTemplate.opsForValue().setIfAbsent(dedupRedisKey, "1", 30, TimeUnit.DAYS);
            if (Boolean.FALSE.equals(isNew)) {
                String message = String.format("重复职位 (无描述): %s, 公司: %s, URL: %s, 日期: %s", jobTitle, companyName, sourceUrl, createTime);
                duplicateLogs.add(message);
                return null;
            }
        } else {
            Boolean isNew = redisTemplate.opsForValue().setIfAbsent(dedupRedisKey, "1", 30, TimeUnit.DAYS);
            if (Boolean.FALSE.equals(isNew)) {
                String existingDesc = (String) redisTemplate.opsForHash().get("dedup:descriptions", dedupKey);
                if (existingDesc == null) {
                    existingDesc = getExistingDescriptionFromDb(jobTitle, companyName, createTime, sourceUrl);
                    if (existingDesc != null && !existingDesc.isEmpty()) {
                        redisTemplate.opsForHash().put("dedup:descriptions", dedupKey, existingDesc);
                        redisTemplate.expire("dedup:descriptions", 30, TimeUnit.DAYS);
                    }
                }
                if (existingDesc == null || existingDesc.isEmpty()) {
                    return mapJobOrPassJob(data, companyNameToIdMap, description);
                }
                double similarity = calculateSimilarity(description, existingDesc);
                double threshold = description.length() < 200 ? 0.9 : 0.8;
                if (similarity >= threshold) {
                    String message = String.format("重复职位 (相似度 %.2f): %s, 公司: %s, URL: %s, 日期: %s", similarity, jobTitle, companyName, sourceUrl, createTime);
                    duplicateLogs.add(message);
                    return null;
                }
            }
            redisTemplate.opsForHash().put("dedup:descriptions", dedupKey, description);
            redisTemplate.expire("dedup:descriptions", 30, TimeUnit.DAYS);
        }

        return mapJobOrPassJob(data, companyNameToIdMap, description);
    }
/**
 * 筛选出未成功写入 job 的记录详情
 * @param recordDetails 所有记录详情列表
 * @return 未成功写入 job 的记录详情列表
 */
public List<RecordMigrationDetail> filterNonSuccessfulJobRecords(List<RecordMigrationDetail> recordDetails) {
    if (recordDetails == null || recordDetails.isEmpty()) {
        return new ArrayList<>();
    }

    return recordDetails.stream()
            .filter(detail -> detail != null)
            .filter(detail -> !"migrated_job".equals(detail.getStatus()))
            .collect(Collectors.toList());
}

    private Object mapJobOrPassJob(CrawlerData data, Map<String, String> companyNameToIdMap, String description) {
        String companyName = data.getRawData().get("company").toString().trim();
        String companyId = matchCompanyId(companyName, companyNameToIdMap);
        if (companyId != null) {
            return mapToJob(data, companyId);
        } else {
            return mapToPassJob(data);
        }
    }

    /** 构建去重键 */
    private String buildDedupKey(String title, String companyName, LocalDateTime createdAt, String jobUrl) {
        String normTitle = normalizeString(title);
        String normCompany = normalizeString(companyName);
        String dateStr = createdAt != null ? createdAt.toString() : LocalDateTime.now().toString();
        String urlPart = normalizeUrl(jobUrl);
        return normTitle + "|||" + normCompany + "|||" + dateStr + "|||" + urlPart;
    }

    /** 规范化字符串 */
    private String normalizeString(String input) {
        if (input == null) return "";
        return input.toLowerCase().replaceAll("[^a-z0-9\\s]", "").replaceAll("\\s+", " ").trim();
    }

    /** 规范化URL */
    private String normalizeUrl(String url) {
        if (url == null || url.isEmpty()) return "";
        try {
            java.net.URL urlObj = new java.net.URL(url);
            String path = urlObj.getPath();
            String query = urlObj.getQuery();
            return path + (query != null ? "?" + query.replaceAll("[&?](id|session|utm_.*)=[^&]*", "") : ""); // 移除动态参数
        } catch (Exception e) {
            return url;
        }
    }

    /** 计算相似度 (Cosine Similarity for better accuracy) */
    private double calculateSimilarity(String desc1, String desc2) {
        if (desc1 == null || desc2 == null || desc1.isEmpty() || desc2.isEmpty()) return 0.0;
        Map<String, Integer> vec1 = buildTfVector(desc1);
        Map<String, Integer> vec2 = buildTfVector(desc2);
        return cosineSimilarity(vec1, vec2);
    }

    private Map<String, Integer> buildTfVector(String text) {
        return Arrays.stream(normalizeString(text).split("\\s+"))
                .collect(Collectors.toMap(word -> word, word -> 1, Integer::sum));
    }

    private double cosineSimilarity(Map<String, Integer> vec1, Map<String, Integer> vec2) {
        Set<String> keys = new HashSet<>(vec1.keySet());
        keys.addAll(vec2.keySet());

        double dotProduct = 0.0;
        double norm1 = 0.0;
        double norm2 = 0.0;

        for (String key : keys) {
            int v1 = vec1.getOrDefault(key, 0);
            int v2 = vec2.getOrDefault(key, 0);
            dotProduct += v1 * v2;
            norm1 += v1 * v1;
            norm2 += v2 * v2;
        }

        if (norm1 == 0 || norm2 == 0) return 0.0;
        return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
    }

    /** 从DB获取现有描述 - 修改后的版本，不依赖dedupKey字段 */
    private String getExistingDescriptionFromDb(String jobTitle, String companyName, LocalDateTime createdAt, String jobUrl) {
        // 通过标题和公司名查询
        Query query = new Query(Criteria.where("jobTitle").is(jobTitle).and("companyName").is(companyName));
        Job existingJob = mongoTemplate.findOne(query, Job.class);
        if (existingJob != null) return existingJob.getJobDescription();

        PassJob existingPassJob = mongoTemplate.findOne(query, PassJob.class, "passjob");
        return existingPassJob != null ? existingPassJob.getJobDescription() : null;
    }

    /** 匹配公司ID */
    private String matchCompanyId(String companyName, Map<String, String> companyNameToIdMap) {
        if (companyName == null || companyName.isEmpty()) return null;
        String exact = companyNameToIdMap.get(companyName);
        if (exact != null) return exact;
        String lower = normalizeString(companyName);
        for (Map.Entry<String, String> entry : companyNameToIdMap.entrySet()) {
            if (normalizeString(entry.getKey()).startsWith(lower)) return entry.getValue();
        }
        return null;
    }

    /** 批量保存Job */
    private void saveJobsBatch(List<Job> jobs) {
        if (jobs.isEmpty()) return;
        try {
            jobRepository.saveAll(jobs);

            // 保存去重信息到Redis
            for (Job job : jobs) {
                String dedupKey = jobDedupKeys.get(job.getId());
                if (dedupKey != null) {
                    redisTemplate.opsForValue().set("dedup:job:" + dedupKey, "1", 30, TimeUnit.DAYS);
                    redisTemplate.opsForHash().put("dedup:descriptions", dedupKey, job.getJobDescription());
                    redisTemplate.expire("dedup:descriptions", 30, TimeUnit.DAYS);
                }
            }
        } catch (MongoWriteException e) {
            logger.warn("批量Job插入重复，尝试单条插入");
            for (Job job : jobs) {
                try {
                    jobRepository.save(job);

                    // 保存去重信息到Redis
                    String dedupKey = jobDedupKeys.get(job.getId());
                    if (dedupKey != null) {
                        redisTemplate.opsForValue().set("dedup:job:" + dedupKey, "1", 30, TimeUnit.DAYS);
                        redisTemplate.opsForHash().put("dedup:descriptions", dedupKey, job.getJobDescription());
                        redisTemplate.expire("dedup:descriptions", 30, TimeUnit.DAYS);
                    }
                } catch (MongoWriteException e1) {
                    duplicateLogs.add("重复Job: " + job.getJobTitle() + " - " + job.getCompanyName() + ", URL: " + job.getJobUrl());
                } catch (Exception e1) {
                    logger.error("保存Job失败: {}", e1.getMessage(), e1);
                }
            }
        } catch (Exception e) {
            logger.error("批量保存Job失败: {}", e.getMessage(), e);
        } finally {
            jobDedupKeys.clear();
        }
    }

    /** 批量保存PassJob */
    private void savePassJobsBatch(List<PassJob> passJobs) {
        if (passJobs.isEmpty()) return;
        try {
            mongoTemplate.insert(passJobs, "passjob");

            // 保存去重信息到Redis
            for (PassJob job : passJobs) {
                String dedupKey = passJobDedupKeys.get(job.getId());
                if (dedupKey != null) {
                    redisTemplate.opsForValue().set("dedup:job:" + dedupKey, "1", 30, TimeUnit.DAYS);
                    redisTemplate.opsForHash().put("dedup:descriptions", dedupKey, job.getJobDescription());
                    redisTemplate.expire("dedup:descriptions", 30, TimeUnit.DAYS);
                }
            }
        } catch (MongoWriteException e) {
            logger.warn("批量PassJob插入重复，尝试单条插入");
            for (PassJob job : passJobs) {
                try {
                    mongoTemplate.insert(job, "passjob");

                    // 保存去重信息到Redis
                    String dedupKey = passJobDedupKeys.get(job.getId());
                    if (dedupKey != null) {
                        redisTemplate.opsForValue().set("dedup:job:" + dedupKey, "1", 30, TimeUnit.DAYS);
                        redisTemplate.opsForHash().put("dedup:descriptions", dedupKey, job.getJobDescription());
                        redisTemplate.expire("dedup:descriptions", 30, TimeUnit.DAYS);
                    }
                } catch (MongoWriteException e1) {
                    duplicateLogs.add("重复PassJob: " + job.getJobTitle() + " - " + job.getCompanyName() + ", URL: " + job.getJobUrl());
                } catch (Exception e1) {
                    logger.error("保存PassJob失败: {}", e1.getMessage(), e1);
                }
            }
        } catch (Exception e) {
            logger.error("批量保存PassJob失败: {}", e.getMessage(), e);
        } finally {
            passJobDedupKeys.clear();
        }
    }

    private int saveJobsBatchWithDetails(List<Job> jobs, List<RecordMigrationDetail> recordDetails) {
        if (jobs.isEmpty()) return 0;
        int inserted = 0;
        try {
            jobRepository.saveAll(jobs);
            inserted = jobs.size();

            for (Job job : jobs) {
                String dedupKey = jobDedupKeys.get(job.getId());
                if (dedupKey != null) {
                    redisTemplate.opsForValue().set("dedup:job:" + dedupKey, "1", 30, TimeUnit.DAYS);
                    redisTemplate.opsForHash().put("dedup:descriptions", dedupKey, job.getJobDescription());
                    redisTemplate.expire("dedup:descriptions", 30, TimeUnit.DAYS);
                }
            }
        } catch (MongoWriteException e) {
            logger.warn("批量Job插入重复，尝试单条插入");
            for (Job job : jobs) {
                try {
                    jobRepository.save(job);
                    inserted++;

                    String dedupKey = jobDedupKeys.get(job.getId());
                    if (dedupKey != null) {
                        redisTemplate.opsForValue().set("dedup:job:" + dedupKey, "1", 30, TimeUnit.DAYS);
                        redisTemplate.opsForHash().put("dedup:descriptions", dedupKey, job.getJobDescription());
                        redisTemplate.expire("dedup:descriptions", 30, TimeUnit.DAYS);
                    }
                } catch (MongoWriteException e1) {
                    duplicateLogs.add("重复Job: " + job.getJobTitle() + " - " + job.getCompanyName() + ", URL: " + job.getJobUrl());
                    recordDetails.add(new RecordMigrationDetail(
                            job.getId(), job.getJobTitle(), job.getCompanyName(), job.getJobUrl(),
                            "dedup_db", "Duplicate in Job collection: " + job.getJobTitle() + " - " + job.getCompanyName()));
                } catch (Exception e1) {
                    logger.error("保存Job失败: {}", e1.getMessage(), e1);
                    recordDetails.add(new RecordMigrationDetail(
                            job.getId(), job.getJobTitle(), job.getCompanyName(), job.getJobUrl(),
                            "error", "Failed to save Job: " + e1.getMessage()));
                }
            }
        } catch (Exception e) {
            logger.error("批量保存Job失败: {}", e.getMessage(), e);
            for (Job job : jobs) {
                recordDetails.add(new RecordMigrationDetail(
                        job.getId(), job.getJobTitle(), job.getCompanyName(), job.getJobUrl(),
                        "error", "Batch save failed: " + e.getMessage()));
            }
        } finally {
            jobDedupKeys.clear();
        }
        return inserted;
    }

    private int savePassJobsBatchWithDetails(List<PassJob> passJobs, List<RecordMigrationDetail> recordDetails) {
        if (passJobs.isEmpty()) return 0;
        int inserted = 0;
        try {
            mongoTemplate.insert(passJobs, "passjob");
            inserted = passJobs.size();

            for (PassJob job : passJobs) {
                String dedupKey = passJobDedupKeys.get(job.getId());
                if (dedupKey != null) {
                    redisTemplate.opsForValue().set("dedup:job:" + dedupKey, "1", 30, TimeUnit.DAYS);
                    redisTemplate.opsForHash().put("dedup:descriptions", dedupKey, job.getJobDescription());
                    redisTemplate.expire("dedup:descriptions", 30, TimeUnit.DAYS);
                }
            }
        } catch (MongoWriteException e) {
            logger.warn("批量PassJob插入重复，尝试单条插入");
            for (PassJob job : passJobs) {
                try {
                    mongoTemplate.insert(job, "passjob");
                    inserted++;

                    String dedupKey = passJobDedupKeys.get(job.getId());
                    if (dedupKey != null) {
                        redisTemplate.opsForValue().set("dedup:job:" + dedupKey, "1", 30, TimeUnit.DAYS);
                        redisTemplate.opsForHash().put("dedup:descriptions", dedupKey, job.getJobDescription());
                        redisTemplate.expire("dedup:descriptions", 30, TimeUnit.DAYS);
                    }
                } catch (MongoWriteException e1) {
                    duplicateLogs.add("重复PassJob: " + job.getJobTitle() + " - " + job.getCompanyName() + ", URL: " + job.getJobUrl());
                    recordDetails.add(new RecordMigrationDetail(
                            job.getId(), job.getJobTitle(), job.getCompanyName(), job.getJobUrl(),
                            "dedup_db", "Duplicate in PassJob collection: " + job.getJobTitle() + " - " + job.getCompanyName()));
                } catch (Exception e1) {
                    logger.error("保存PassJob失败: {}", e1.getMessage(), e1);
                    recordDetails.add(new RecordMigrationDetail(
                            job.getId(), job.getJobTitle(), job.getCompanyName(), job.getJobUrl(),
                            "error", "Failed to save PassJob: " + e1.getMessage()));
                }
            }
        } catch (Exception e) {
            logger.error("批量保存PassJob失败: {}", e.getMessage(), e);
            for (PassJob job : passJobs) {
                recordDetails.add(new RecordMigrationDetail(
                        job.getId(), job.getJobTitle(), job.getCompanyName(), job.getJobUrl(),
                        "error", "Batch save failed: " + e.getMessage()));
            }
        } finally {
            passJobDedupKeys.clear();
        }
        return inserted;
    }




    /** 写重复日志 */
    private void writeDuplicateLog() {
        if (duplicateLogs.isEmpty()) return;
        try (BufferedWriter writer = new BufferedWriter(new FileWriter(documentLocation + PathName, true))) {
            for (String log : duplicateLogs) {
                writer.write(LocalDateTime.now() + " - " + log); // 添加时间戳
                writer.newLine();
            }
            duplicateLogs.clear();
        } catch (IOException e) {
            logger.error("写重复日志失败: {}", e.getMessage(), e);
        }
    }

    /** 更新公司URL */
    private void updateCompanyUrls(List<CrawlerData> batchData, Map<String, String> companyNameToIdMap) {
        Map<String, String> companyIdToUrlMap = new HashMap<>();

        for (CrawlerData data : batchData) {
            Map<String, Object> raw = data.getRawData();
            String company = Optional.ofNullable(raw.get("company")).map(Object::toString).map(String::trim).orElse("");
            if (company.isEmpty()) continue;
            String matchedId = matchCompanyId(company, companyNameToIdMap);
            if (matchedId != null) {
                String url = Optional.ofNullable(raw.get("company_url")).map(Object::toString).map(String::trim).orElse("");
                if (!url.isEmpty()) {
                    companyIdToUrlMap.putIfAbsent(matchedId, url);
                }
            }
        }

        for (Map.Entry<String, String> entry : companyIdToUrlMap.entrySet()) {
            Query query = new Query(Criteria.where("companyId").is(entry.getKey()));
            Update update = new Update().set("company_url", entry.getValue());
            try {
                mongoTemplate.updateFirst(query, update, "company");
            } catch (Exception e) {
                logger.error("更新公司URL失败: companyId={}, url={}", entry.getKey(), entry.getValue(), e);
            }
        }
    }

    /** 解析日期，支持更多格式 */
    private LocalDateTime parseDateTime(String dateStr) {
        if (dateStr == null || dateStr.isEmpty()) return null;
        try {
            // 替换下划线为连字符
            String normalizedDateStr = dateStr.replace('_', '-');
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("[yyyy-MM-dd][yyyy/MM/dd][yyyy.M.d][yyyy-M-d]");
            return LocalDate.parse(normalizedDateStr, formatter).atStartOfDay();
        } catch (Exception e) {
            logger.warn("日期解析失败: {}", dateStr, e);
            return null;
        }
    }

    private Job mapToJob(CrawlerData data, String companyId) {
        Map<String, Object> raw = data.getRawData();
        Job job = new Job();
        job.setId(data.getId());
        job.setJobId(Optional.ofNullable(raw.get("id")).map(Object::toString).orElse("JOB-" + UUID.randomUUID()));
        job.setJobTitle((String) raw.getOrDefault("title", "Unknown Title"));
        job.setCompanyName((String) raw.getOrDefault("company", "Unknown Company"));
        job.setJobDescription((String) raw.getOrDefault("job_description", "No description"));
        job.setJobRequirements((String) raw.getOrDefault("experience_range", ""));
        job.setJobType(classifyJobType(raw));
        job.setWorkLocation((String) raw.getOrDefault("location", "Unknown Location"));
        job.setMinSalary(toBigDecimal(raw.get("salary_min")));
        job.setMaxSalary(toBigDecimal(raw.get("salary_max")));
        job.setSalaryUnit((String) raw.getOrDefault("currency", "month"));
        job.setExperienceRequired((String) raw.getOrDefault("experience_range", ""));
        job.setEducationRequired((String) raw.getOrDefault("education_required", ""));
        job.setJobUrl((String) raw.getOrDefault("job_url", ""));
        job.setSkillsRequired(parseSkills(raw.get("skills")));
        job.setCompanyId(companyId);
        job.setRecruitmentCount(Optional.ofNullable(raw.get("recruitment_count")).map(o -> Integer.parseInt(o.toString())).orElse(1));
        job.setStatus(data.getStatus() != null ? data.getStatus() : "opening");

        // 处理日期字段，优先使用 date_posted，如果没有则使用 _date_posted
        String datePosted = (String) raw.get("date_posted");
        if (datePosted == null || datePosted.isEmpty()) {
            datePosted = (String) raw.get("_date_posted");
        }
        job.setCreatedAt(parseDateTime(datePosted));

        job.setUpdatedAt(data.getImportTime());
        job.setDeadline(Optional.ofNullable(job.getCreatedAt()).map(d -> d.plusDays(30)).orElse(LocalDateTime.now().plusDays(30)));
        return job;
    }

    private PassJob mapToPassJob(CrawlerData data) {
        Map<String, Object> raw = data.getRawData();
        PassJob job = new PassJob();
        job.setId(data.getId());
        job.setJobId(UUID.randomUUID().toString());
        job.setJobTitle((String) raw.getOrDefault("title", "Unknown Title"));
        job.setCompanyName((String) raw.getOrDefault("company", "Unknown Company"));
        job.setJobDescription((String) raw.getOrDefault("job_description", "No description"));
        job.setJobRequirements((String) raw.getOrDefault("experience_range", ""));
        job.setJobType(classifyJobType(raw));
        job.setWorkLocation((String) raw.getOrDefault("location", "Unknown Location"));
        job.setMinSalary(toBigDecimal(raw.get("salary_min")));
        job.setMaxSalary(toBigDecimal(raw.get("salary_max")));
        job.setSalaryUnit((String) raw.getOrDefault("currency", "month"));
        job.setExperienceRequired((String) raw.getOrDefault("experience_range", ""));
        job.setEducationRequired((String) raw.getOrDefault("education_required", ""));
        job.setSkillsRequired(parseSkills(raw.get("skills")));
        job.setCompanyId("COM_UNKNOWN");
        job.setRecruitmentCount(Optional.ofNullable(raw.get("recruitment_count")).map(o -> Integer.parseInt(o.toString())).orElse(1));
        job.setStatus(data.getStatus() != null ? data.getStatus() : "opening");

        // 处理日期字段，优先使用 date_posted，如果没有则使用 _date_posted
        String datePosted = (String) raw.get("date_posted");
        if (datePosted == null || datePosted.isEmpty()) {
            datePosted = (String) raw.get("_date_posted");
        }
        job.setCreatedAt(parseDateTime(datePosted));

        job.setUpdatedAt(data.getImportTime());
        job.setDeadline(Optional.ofNullable(job.getCreatedAt()).map(d -> d.plusDays(30)).orElse(LocalDateTime.now().plusDays(30)));
        return job;
    }

    private String classifyJobType(Map<String, Object> raw) {
        String title = Optional.ofNullable(raw.get("title")).map(Object::toString).map(String::toLowerCase).orElse("");
        String desc = Optional.ofNullable(raw.get("job_description")).map(Object::toString).map(String::toLowerCase).orElse("");
        String jobTypeRaw = Optional.ofNullable(raw.get("job_type")).map(Object::toString).map(String::toLowerCase).orElse("");
        EmploymentClassifier.JobData jobData = new EmploymentClassifier.JobData(title, desc, jobTypeRaw);
        return employmentClassifier.classify(jobData);
    }

    private BigDecimal toBigDecimal(Object obj) {
        if (obj == null) return null;
        try {
            return new BigDecimal(obj.toString().replaceAll("[^0-9.]", ""));
        } catch (Exception e) {
            logger.warn("薪资转换失败: {}", obj, e);
            return null;
        }
    }

    private List<String> parseSkills(Object skillsObj) {
        if (skillsObj == null) {
            return Collections.emptyList();
        }

        if (skillsObj instanceof String) {
            String skillsStr = (String) skillsObj;
            return Arrays.stream(skillsStr.split("[,;|]"))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .distinct()
                    .collect(Collectors.toList());
        } else if (skillsObj instanceof List) {
            // 处理列表类型
            return ((List<?>) skillsObj).stream()
                    .filter(Objects::nonNull)
                    .map(Object::toString)
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .distinct()
                    .collect(Collectors.toList());
        } else {
            logger.warn("无法解析技能要求: {}", skillsObj);
            return Collections.emptyList();
        }
    }
    /**
 * 重新处理失败的记录（无效数据和错误记录）
 * @param failedRecords 失败的记录列表
 * @param companyNameToIdMap 公司名称到ID的映射
 * @return 处理结果
 */
/**
 * 重新处理失败的记录（无效数据和错误记录）
 * @param failedRecords 失败的记录列表
 * @param companyNameToIdMap 公司名称到ID的映射
 * @return 处理结果
 */
public Map<String, Object> reprocessFailedRecords(List<RecordMigrationDetail> failedRecords, Map<String, String> companyNameToIdMap) {
    Map<String, Object> result = new HashMap<>();

    if (failedRecords == null || failedRecords.isEmpty()) {
        result.put("message", "没有需要重新处理的记录");
        result.put("reprocessedCount", 0);
        result.put("successCount", 0);
        result.put("failedCount", 0);
        return result;
    }

    try {
        // 按recordId分组，避免重复处理
        Map<String, RecordMigrationDetail> uniqueFailedRecords = failedRecords.stream()
                .filter(Objects::nonNull)
                .collect(Collectors.toMap(
                    RecordMigrationDetail::getRecordId,
                    record -> record,
                    (existing, replacement) -> existing
                ));

        // 将失败记录转换为CrawlerData列表
        List<CrawlerData> crawlerDataList = new ArrayList<>();
        for (RecordMigrationDetail detail : uniqueFailedRecords.values()) {
            try {
                // 从Redis中获取原始数据
                String redisKey = "crawler:failed:" + detail.getRecordId();
                String rawDataJson = redisTemplate.opsForValue().get(redisKey);

                if (rawDataJson != null) {
                    CrawlerData crawlerData = objectMapper.readValue(rawDataJson, CrawlerData.class);
                    crawlerDataList.add(crawlerData);
                } else {
                    // 如果Redis中没有数据，尝试从原始记录构建
                    CrawlerData crawlerData = buildCrawlerDataFromRecord(detail);
                    crawlerDataList.add(crawlerData);
                }
            } catch (Exception e) {
                logger.warn("无法恢复记录 {}: {}", detail.getRecordId(), e.getMessage());
            }
        }

        if (crawlerDataList.isEmpty()) {
            result.put("message", "没有有效的记录可以重新处理");
            result.put("reprocessedCount", 0);
            result.put("successCount", 0);
            result.put("failedCount", 0);
            return result;
        }

        // 处理数据
        List<RecordMigrationDetail> reprocessDetails = new ArrayList<>();
        List<Job> jobsToInsert = new ArrayList<>();
        List<PassJob> passJobsToInsert = new ArrayList<>();

        for (CrawlerData data : crawlerDataList) {
            try {
                Object processDataResult = processOneData(data, companyNameToIdMap);

                String jobTitle = Optional.ofNullable(data.getRawData().get("title"))
                        .map(Object::toString).map(String::trim).orElse("");
                String companyName = Optional.ofNullable(data.getRawData().get("company"))
                        .map(Object::toString).map(String::trim).orElse("");
                String jobUrl = data.getSourceUrl();

                if (processDataResult == null) {
                    reprocessDetails.add(new RecordMigrationDetail(
                            data.getId(), jobTitle, companyName, jobUrl,
                            "invalid", "重新处理后仍为无效数据"));
                } else if (processDataResult instanceof Job) {
                    Job job = (Job) processDataResult;
                    jobsToInsert.add(job);
                    reprocessDetails.add(new RecordMigrationDetail(
                            data.getId(), jobTitle, companyName, jobUrl,
                            "migrated_job", "重新处理成功，迁移到Job集合"));
                } else if (processDataResult instanceof PassJob) {
                    PassJob passJob = (PassJob) processDataResult;
                    passJobsToInsert.add(passJob);
                    reprocessDetails.add(new RecordMigrationDetail(
                            data.getId(), jobTitle, companyName, jobUrl,
                            "migrated_passjob", "重新处理成功，迁移到PassJob集合"));
                }
            } catch (Exception e) {
                String jobTitle = Optional.ofNullable(data.getRawData().get("title"))
                        .map(Object::toString).map(String::trim).orElse("");
                String companyName = Optional.ofNullable(data.getRawData().get("company"))
                        .map(Object::toString).map(String::trim).orElse("");
                String jobUrl = data.getSourceUrl();

                reprocessDetails.add(new RecordMigrationDetail(
                        data.getId(), jobTitle, companyName, jobUrl,
                        "error", "重新处理时发生错误: " + e.getMessage()));
            }
        }

        // 保存处理成功的记录
        int jobsInserted = saveJobsBatchWithDetails(jobsToInsert, reprocessDetails);
        int passJobsInserted = savePassJobsBatchWithDetails(passJobsToInsert, reprocessDetails);

        result.put("message", "重新处理完成");
        result.put("reprocessedCount", crawlerDataList.size());
        result.put("successCount", jobsInserted + passJobsInserted);
        result.put("failedCount", reprocessDetails.stream()
                .filter(detail -> "invalid".equals(detail.getStatus()) || "error".equals(detail.getStatus()))
                .count());
        result.put("details", reprocessDetails.stream()
                .map(this::recordMigrationDetailToMap)
                .collect(Collectors.toList()));

        return result;
    } catch (Exception e) {
        logger.error("重新处理失败记录时发生错误", e);
        result.put("error", "重新处理失败: " + e.getMessage());
        return result;
    }
}

/**
 * 将RecordMigrationDetail对象转换为Map
 */
private Map<String, Object> recordMigrationDetailToMap(RecordMigrationDetail detail) {
    Map<String, Object> map = new HashMap<>();
    map.put("recordId", detail.getRecordId());
    map.put("jobTitle", detail.getJobTitle());
    map.put("companyName", detail.getCompanyName());
    map.put("jobUrl", detail.getJobUrl());
    map.put("status", detail.getStatus());
    map.put("message", detail.getMessage());
    return map;
}

/**
 * 根据记录详情构建CrawlerData对象
 * @param detail 记录详情
 * @return CrawlerData对象
 */
private CrawlerData buildCrawlerDataFromRecord(RecordMigrationDetail detail) {
    CrawlerData data = new CrawlerData();
    data.setId(detail.getRecordId());

    // 构建原始数据映射
    Map<String, Object> rawData = new HashMap<>();
    rawData.put("title", detail.getJobTitle());
    rawData.put("company", detail.getCompanyName());
    rawData.put("job_url", detail.getJobUrl());

    data.setRawData(rawData);
    data.setSourceUrl(detail.getJobUrl());
    data.setDataCreateTime(LocalDateTime.now());
    data.setImportTime(LocalDateTime.now());
    data.setStatus("opening");

    return data;
}

/**
 * 筛选出无效数据和处理过程中出现错误的记录
 * @param recordDetails 所有记录详情列表
 * @return 无效数据和错误记录列表
 */
public List<RecordMigrationDetail> filterInvalidAndErrorRecords(List<RecordMigrationDetail> recordDetails) {
    if (recordDetails == null || recordDetails.isEmpty()) {
        return new ArrayList<>();
    }

    return recordDetails.stream()
            .filter(detail -> detail != null)
            .filter(detail -> "invalid".equals(detail.getStatus()) || "error".equals(detail.getStatus()))
            .collect(Collectors.toList());
}


    public Map<String, TaskInfo> getAllTasksWithTTL() {
        Map<String, TaskInfo> allTasks = new HashMap<>();
        Set<String> keys = redisTemplate.keys("task:*");
        if (keys == null || keys.isEmpty()) return allTasks;

        for (String key : keys) {
            String type = redisTemplate.type(key).code();
            Long ttl = redisTemplate.getExpire(key, TimeUnit.SECONDS);

            List<CrawlerData> dataList = new ArrayList<>();
            try {
                if ("hash".equalsIgnoreCase(type)) {
                    Map<Object, Object> entries = redisTemplate.opsForHash().entries(key);
                    dataList = entries.values().stream()
                            .map(val -> {
                                try {
                                    return objectMapper.readValue(val.toString(), CrawlerData.class);
                                } catch (Exception e) {
                                    logger.error("解析 hash task 数据失败: {}", val, e);
                                    return null;
                                }
                            })
                            .filter(Objects::nonNull)
                            .collect(Collectors.toList());
                } else if ("string".equalsIgnoreCase(type)) {
                    String val = redisTemplate.opsForValue().get(key);
                    if (val != null) {
                        try {
                            CrawlerData data = objectMapper.readValue(val, CrawlerData.class);
                            dataList.add(data);
                        } catch (Exception e) {
                            logger.error("解析 string task 数据失败: {}", val, e);
                        }
                    }
                } else {
                    logger.warn("跳过非 hash/string key: {} 类型: {}", key, type);
                    continue;
                }
            } catch (Exception e) {
                logger.error("读取 Redis key 失败: {}", key, e);
                continue;
            }

            TaskInfo taskInfo = new TaskInfo(key, ttl != null ? ttl : -1, dataList);
            allTasks.put(key, taskInfo);
        }

        return allTasks;
    }


public static class RecordMigrationDetail {
    private String recordId;
    private String jobTitle;
    private String companyName;
    private String jobUrl;
    private String status; // 状态说明:
                           // "migrated_job" - 成功迁移到Job集合
                           // "migrated_passjob" - 成功迁移到PassJob集合
                           // "dedup_redis" - 在Redis中检测到重复
                           // "dedup_db" - 在数据库中检测到重复
                           // "invalid" - 数据无效
                           // "error" - 处理过程中出现错误
    private String message; // 详细信息，如重复原因或错误详情

    public RecordMigrationDetail(String recordId, String jobTitle, String companyName, String jobUrl, String status, String message) {
        this.recordId = recordId;
        this.jobTitle = jobTitle;
        this.companyName = companyName;
        this.jobUrl = jobUrl;
        this.status = status;
        this.message = message;
    }

    // Getters and setters
    public String getRecordId() { return recordId; }
    public void setRecordId(String recordId) { this.recordId = recordId; }
    public String getJobTitle() { return jobTitle; }
    public void setJobTitle(String jobTitle) { this.jobTitle = jobTitle; }
    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }
    public String getJobUrl() { return jobUrl; }
    public void setJobUrl(String jobUrl) { this.jobUrl = jobUrl; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}




}