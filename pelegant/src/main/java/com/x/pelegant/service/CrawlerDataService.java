package com.x.pelegant.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.x.pelegant.entity.Company;
import com.x.pelegant.entity.CrawlerData;
import com.x.pelegant.repository.CompanyRepository;
import com.x.pelegant.repository.CrawlerDataRepository;
import com.x.pelegant.vo.TaskStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
public class CrawlerDataService {

    @Autowired
    private MongoTemplate mongoTemplate;
    private static final Logger logger = LoggerFactory.getLogger(CrawlerDataService.class);

    private final CrawlerDataRepository crawlerDataRepository;
    private final NewDataMigrationService newDataMigrationService;
    private final CompanyRepository companyRepository;
    private final ObjectMapper objectMapper;

    private final RedisTemplate<String, String> redisTemplate;

    @Autowired
    public CrawlerDataService(
            CrawlerDataRepository crawlerDataRepository,
            NewDataMigrationService newDataMigrationService,
            CompanyRepository companyRepository,
            ObjectMapper objectMapper,
            RedisTemplate<String, String> redisTemplate) {
        this.crawlerDataRepository = crawlerDataRepository;
        this.newDataMigrationService = newDataMigrationService;
        this.companyRepository = companyRepository;
        this.objectMapper = objectMapper;
        this.redisTemplate = redisTemplate;
    }

    public String storeCrawlerData(List<Map<String, Object>> rawCrawlerData) {
        if (rawCrawlerData == null || rawCrawlerData.isEmpty()) {
            return "没有待存储的爬虫数据！";
        }
        try {
            // 清空现有的爬虫数据
            crawlerDataRepository.deleteAll();

            // 遍历原始爬虫数据并进行字段映射
            List<CrawlerData> crawlerDataList = rawCrawlerData.stream()
                    .map(this::mapFields)
                    .collect(Collectors.toList());

            // 批量保存
            crawlerDataRepository.saveAll(crawlerDataList);
            return "爬虫数据成功存储！";
        } catch (Exception e) {
            logger.error("存储爬虫数据失败", e);
            return "存储爬虫数据失败: " + e.getMessage();
        }
    }

    private CrawlerData mapFields(Map<String, Object> rawData) {
        CrawlerData data = new CrawlerData();
        if (rawData.containsKey("job_url")) {
            data.setSourceUrl((String) rawData.get("job_url"));
        }
        data.setDataType("job_postings");
        data.setCrawlerName("Pelegant_Crawler");
        data.setStatus("opening");
        data.setProcessMessage("");

        // 清理 rawData 的键，替换句点和非法字符
        Map<String, Object> sanitizedRawData = sanitizeMapKeys(rawData);
        data.setRawData(sanitizedRawData);

        data.setDataCreateTime(LocalDateTime.now());
        data.setImportTime(LocalDateTime.now());
        data.setProcessTime(LocalDateTime.now());
        data.setBatchId(generateBatchId("job_postings", "Pelegant_Crawler"));
        if (rawData.containsKey("company_url")) {
            data.setLogoImage((String) rawData.get("company_url"));
        }
        return data;
    }

    private Map<String, Object> sanitizeMapKeys(Map<String, Object> inputMap) {
        Map<String, Object> sanitizedMap = new HashMap<>();
        for (Map.Entry<String, Object> entry : inputMap.entrySet()) {
            String sanitizedKey = entry.getKey().replaceAll("[^a-zA-Z0-9_]", "_");
            Object value = entry.getValue();
            // 递归清理嵌套 map
            if (value instanceof Map) {
                value = sanitizeMapKeys((Map<String, Object>) value);
            }
            sanitizedMap.put(sanitizedKey, value);
        }
        return sanitizedMap;
    }

    private String generateBatchId(String dataType, String crawlerName) {
        String timestamp = String.valueOf(System.currentTimeMillis());
        String uuid = UUID.randomUUID().toString().substring(0, 8);
        return String.format("%s_%s_%s_%s", dataType, crawlerName, timestamp, uuid);
    }

    // 修改 processDataAsync 方法
    @Async
    public void processDataAsync(List<Map<String, Object>> rawData, String taskId) {
        Map<String, Object> response = new HashMap<>();
        long startTime = System.currentTimeMillis();
        logger.info("任务 {} 开始处理，数据量: {}", taskId, rawData.size());

        // 先保存初始任务状态到 MongoDB 和 Redis，表示"处理中"
        TaskStatus initialTaskStatus = new TaskStatus(taskId, "processing", null);
        mongoTemplate.save(initialTaskStatus);

        try {
            // 同时在 Redis 中存储初始状态
            Map<String, Object> initialResponse = new HashMap<>();
            initialResponse.put("taskId", taskId);
            initialResponse.put("status", "processing");
            initialResponse.put("message", "数据处理中...");
            String initialResultJson = objectMapper.writeValueAsString(initialResponse);
            redisTemplate.opsForValue().set("task:" + taskId, initialResultJson, 24, TimeUnit.HOURS);
        } catch (JsonProcessingException e) {
            logger.error("任务 {} 初始状态保存失败", taskId, e);
        }

        try {
            List<Company> companies = companyRepository.findAll();
            Map<String, String> companyNameToIdMap = new HashMap<>();
            for (Company company : companies) {
                companyNameToIdMap.put(company.getCompanyName(), company.getCompanyId());
            }

            String crawlerDataResult = storeCrawlerData(rawData);
            response.put("crawlerDataResult", crawlerDataResult);

            String jsonInput;
            try {
                jsonInput = objectMapper.writeValueAsString(rawData);
            } catch (JsonProcessingException e) {
                logger.error("任务 {} JSON 序列化失败", taskId, e);
                response.put("taskId", taskId);
                response.put("error", "JSON 序列化失败: " + e.getMessage());
                response.put("errors", 1);
                response.put("errorDetails", new ArrayList<String>(Arrays.asList("JSON 序列化失败: " + e.getMessage())));
                saveTaskResult(taskId, response, "failed");
                return;
            }

            int batchSize = 1000;
            Map<String, Object> migrationResult = newDataMigrationService.migrateFromJsonInBatches(jsonInput, companyNameToIdMap, batchSize);

            response.put("taskId", taskId);
            response.put("migrationResult", migrationResult.get("summary"));
            response.put("totalRecords", String.valueOf(rawData.size()));
            response.put("jobsMigrated", migrationResult.get("jobsMigrated"));
            response.put("passJobsMigrated", migrationResult.get("passJobsMigrated"));
            response.put("duplicatesFound", migrationResult.get("duplicatesFound"));
            response.put("duration", String.valueOf(System.currentTimeMillis() - startTime) + " ms");
            response.put("batchDetails", migrationResult.get("details"));
            response.put("recordDetails", migrationResult.get("recordDetails"));

            saveTaskResult(taskId, response, "completed");
        } catch (Exception e) {
            logger.error("任务 {} 处理失败", taskId, e);
            response.put("taskId", taskId);
            response.put("error", "处理失败: " + e.getMessage());
            response.put("errors", 1);
            response.put("errorDetails", new ArrayList<String>(Arrays.asList("处理失败: " + e.getMessage())));
            saveTaskResult(taskId, response, "failed");
        }
    }


    // 修改 saveTaskResult 方法
    private void saveTaskResult(String taskId, Map<String, Object> response, String status) {
        int maxRetries = 3;
        int retryCount = 0;
        boolean savedToRedis = false;

        while (retryCount < maxRetries && !savedToRedis) {
            try {
                String resultJson = objectMapper.writeValueAsString(response);
                redisTemplate.opsForValue().set("task:" + taskId, resultJson, 24, TimeUnit.HOURS);
                savedToRedis = true;

                // 更新 MongoDB 任务状态
                TaskStatus taskStatus = mongoTemplate.findById(taskId, TaskStatus.class);
                if (taskStatus == null) {
                    taskStatus = new TaskStatus(taskId, status, resultJson);
                } else {
                    taskStatus.setStatus(status);
                    taskStatus.setResult(resultJson);
                }
                taskStatus.setUpdatedAt(LocalDateTime.now());
                mongoTemplate.save(taskStatus);
            } catch (JsonProcessingException e) {
                logger.error("任务 {} 保存结果到 Redis/MongoDB 失败 (尝试 {}/{}): {}", taskId, retryCount + 1, maxRetries, e.getMessage());
                retryCount++;
                if (retryCount == maxRetries) {
                    // Fallback: 保存最小错误响应
                    response.put("error", "结果序列化失败: " + e.getMessage());
                    response.put("errorDetails", new ArrayList<String>(Arrays.asList("结果序列化失败: " + e.getMessage())));
                    try {
                        String minimalJson = "{\"taskId\":\"" + taskId + "\",\"error\":\"序列化失败\",\"errors\":1}";
                        redisTemplate.opsForValue().set("task:" + taskId, minimalJson, 24, TimeUnit.HOURS);

                        TaskStatus taskStatus = mongoTemplate.findById(taskId, TaskStatus.class);
                        if (taskStatus == null) {
                            taskStatus = new TaskStatus(taskId, "failed", minimalJson);
                        } else {
                            taskStatus.setStatus("failed");
                            taskStatus.setResult(minimalJson);
                        }
                        taskStatus.setUpdatedAt(LocalDateTime.now());
                        mongoTemplate.save(taskStatus);
                    } catch (Exception ex) {
                        logger.error("任务 {} 保存最小错误结果失败", taskId, ex);
                    }
                }
                try {
                    Thread.sleep(1000); // 重试前等待
                } catch (InterruptedException ie) {
                    logger.error("任务 {} 重试等待中断", taskId, ie);
                }
            } catch (Exception e) {
                logger.error("任务 {} 保存结果到 Redis/MongoDB 失败 (尝试 {}/{}): {}", taskId, retryCount + 1, maxRetries, e.getMessage());
                retryCount++;
                try {
                    Thread.sleep(1000);
                } catch (InterruptedException ie) {
                    logger.error("任务 {} 重试等待中断", taskId, ie);
                }
            }
        }
    }

}

