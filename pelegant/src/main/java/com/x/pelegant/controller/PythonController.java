package com.x.pelegant.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.x.pelegant.dto.TaskInfo;
import com.x.pelegant.repository.*;
import com.x.pelegant.service.CrawlerDataService;
import com.x.pelegant.service.NewDataMigrationService;
import com.x.pelegant.service.ProjectService;
import com.x.pelegant.service.StudentService;
import com.x.pelegant.util.Deduplicate;
import com.x.pelegant.util.EmploymentClassifier;
import com.x.pelegant.util.MongoExporter;
import com.x.pelegant.util.Remedialfunction;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/python")
@Tag(name = "Python API", description = "API for Python-related operations")
public class PythonController {

    private static final Logger logger = LoggerFactory.getLogger(PythonController.class);

@Autowired
private MongoTemplate mongoTemplate;
    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private CrawlerDataService crawlerDataService;

    @Autowired
    private NewDataMigrationService newDataMigrationService;

    @Autowired
    private RedisTemplate<String, String> redisTemplate;


    @Value("${pelegant.upload.path}")
    private String documentLocation;

    @Value("${pelegant.employment.keywords.config}")
    private String keywordsConfigPath;

    private static final String HONG_KONG_REGEX = "^(HK|香港|Hong\\s?Kong|HongKong|HKSAR|Hong\\s?Kong\\s?SAR|HK\\s?SAR|香港特别行政区|香港岛|Hong\\s?Kong,\\s?Hong\\s?Kong\\s?SAR|[A-Za-z\\s&]+,\\s?(HKI|KOW|NT),\\s?HK|[A-Za-z\\s&]+,\\s?Hong\\s?Kong\\s?SAR|Remote,\\s?HK)$";

    @Autowired
    public PythonController(
            ObjectMapper objectMapper,
            CrawlerDataService crawlerDataService,
            NewDataMigrationService newDataMigrationService,
            RedisTemplate<String, String> redisTemplate) {

        this.objectMapper = objectMapper;
        this.crawlerDataService = crawlerDataService;
        this.newDataMigrationService = newDataMigrationService;
        this.redisTemplate = redisTemplate;

    }

    @PostMapping(value = "/store", consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "存储爬虫数据", description = "异步存储爬虫数据并迁移JSON数据")
    public ResponseEntity<Map<String, String>> storeAndMigrateData(@RequestBody Object rawData) {
        Map<String, String> response = new HashMap<>();
        logger.info("收到请求体: {}", rawData);

        List<Map<String, Object>> processedData;
        try {
            // 1. 判断是否是字符串，清理转义字符
            if (rawData instanceof String) {
                String jsonString = (String) rawData;
                // 清理多余的转义字符，确保JSON格式正确
                jsonString = jsonString.replace("\\\"", "\"").replace("\\\\", "\\");

                // 使用ObjectMapper解析清理后的JSON字符串
                processedData = objectMapper.readValue(jsonString, new TypeReference<List<Map<String, Object>>>() {});
            } else if (rawData instanceof List) {
                // 2. 处理直接传递的List
                List<?> outerList = (List<?>) rawData;
                if (outerList.isEmpty()) {
                    response.put("message", "任务已提交，处理中...");
                    response.put("taskId", "null_error");
                    return ResponseEntity.accepted().body(response);
                }
                if (outerList.get(0) instanceof List) {
                    processedData = new ArrayList<>();
                    for (Object innerList : outerList) {
                        if (innerList instanceof List) {
                            processedData.addAll((List<Map<String, Object>>) innerList);
                        }
                    }
                } else {
                    processedData = (List<Map<String, Object>>) rawData;
                }
            } else {
                response.put("error", "无效的 JSON 输入: 期望字符串或数组格式");
                return ResponseEntity.badRequest().body(response);
            }
        } catch (JsonProcessingException e) {
            logger.error("无效的 JSON 输入: {}", e.getMessage(), e);
            response.put("error", "无效的 JSON 输入: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        } catch (ClassCastException e) {
            logger.error("类型转换错误: {}", e.getMessage(), e);
            response.put("error", "类型转换错误: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }

        // 3. 验证处理后的数据是否为空
        if (processedData == null || processedData.isEmpty()) {
            response.put("message", "任务已提交，处理中...");
            response.put("taskId", "null_error");
            return ResponseEntity.accepted().body(response);
        }




        // 4. 限制输入大小
        if (processedData.size() > 10000) {
            response.put("error", "请求数据量过大，最大支持 10000 条记录");
            return ResponseEntity.badRequest().body(response);
        }

        // 5. 异步处理数据
        String taskId = UUID.randomUUID().toString();
        crawlerDataService.processDataAsync(processedData, taskId);

        response.put("taskId", taskId);
        response.put("message", "任务已提交，处理中...");

        // 6. 返回不带转义字符的JSON对象
        return ResponseEntity.accepted().body(response);  // Spring会自动将response转化为JSON
    }



    @GetMapping("/task/{taskId}")
    @Operation(summary = "获取任务结果", description = "获取指定任务的详细处理结果，包括每条数据的去向")
    public ResponseEntity<Map<String, Object>> getTaskResult(
            @PathVariable String taskId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size) {
        String result = redisTemplate.opsForValue().get("task:" + taskId);
        if (result == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Collections.singletonMap("error", "任务不存在或已过期"));
        }
        try {
            Map<String, Object> response = objectMapper.readValue(result, new TypeReference<Map<String, Object>>() {});
            Map<String, Object> formattedResponse = new HashMap<>();
            formattedResponse.put("taskId", response.get("taskId"));
            formattedResponse.put("migrationResult", response.get("migrationResult"));
            formattedResponse.put("totalRecords", response.get("totalRecords"));
            formattedResponse.put("jobsMigrated", response.get("jobsMigrated"));
            formattedResponse.put("passJobsMigrated", response.get("passJobsMigrated"));
            formattedResponse.put("duplicatesFound", response.get("duplicatesFound"));
            formattedResponse.put("duration", response.get("duration"));
            formattedResponse.put("batchDetails", response.get("batchDetails"));
            List<Map<String, Object>> recordDetails = (List<Map<String, Object>>) response.get("recordDetails");
            // 应用分页
            int fromIndex = Math.min(page * size, recordDetails.size());
            int toIndex = Math.min(fromIndex + size, recordDetails.size());
            formattedResponse.put("recordDetails", recordDetails.subList(fromIndex, toIndex));
            formattedResponse.put("totalRecordDetails", recordDetails.size());
            formattedResponse.put("page", page);
            formattedResponse.put("size", size);
            return ResponseEntity.ok(formattedResponse);
        } catch (JsonProcessingException e) {
            logger.error("获取任务 {} 结果失败", taskId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("error", "获取任务结果失败: " + e.getMessage()));
        }
    }



    @GetMapping("/Redis-key-all")
    @Operation(summary = "获取所有Redis任务", description = "获取所有Redis任务")
    public ResponseEntity<Map<String, TaskInfo>> getAllTasks() {
        try {
            Map<String, TaskInfo> allTasks = newDataMigrationService.getAllTasksWithTTL();
            if (allTasks.isEmpty()) {
                return ResponseEntity.ok(Collections.emptyMap());
            }
            return ResponseEntity.ok(allTasks);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Collections.emptyMap());
        }
    }


    @GetMapping("/failed-records")
@Operation(summary = "获取所有失败记录", description = "获取Redis中所有任务的无效数据和处理错误的记录")
public ResponseEntity<Map<String, Object>> getAllFailedRecords() {
    try {
        // 获取所有任务键
        Set<String> taskKeys = redisTemplate.keys("task:*");
        if (taskKeys == null || taskKeys.isEmpty()) {
            return ResponseEntity.ok(Collections.singletonMap("message", "没有找到任何任务"));
        }

        List<Map<String, Object>> allFailedRecords = new ArrayList<>();
        int totalFailedRecords = 0;

        for (String taskKey : taskKeys) {
            try {
                String taskId = taskKey.replace("task:", "");
                String result = redisTemplate.opsForValue().get(taskKey);

                if (result != null) {
                    Map<String, Object> taskResult = objectMapper.readValue(result, new TypeReference<Map<String, Object>>() {});
                    List<Map<String, Object>> recordDetails = (List<Map<String, Object>>) taskResult.get("recordDetails");

                    if (recordDetails != null && !recordDetails.isEmpty()) {
                        // 转换为RecordMigrationDetail对象列表
                        List<NewDataMigrationService.RecordMigrationDetail> details = recordDetails.stream()
                                .map(this::mapToRecordMigrationDetail)
                                .filter(Objects::nonNull)
                                .collect(Collectors.toList());

                        // 筛选出无效和错误记录
                        List<NewDataMigrationService.RecordMigrationDetail> failedRecords = newDataMigrationService.filterInvalidAndErrorRecords(details);

                        // 添加到总结果中
                        for (NewDataMigrationService.RecordMigrationDetail failedRecord : failedRecords) {
                            Map<String, Object> failedRecordMap = recordMigrationDetailToMap(failedRecord);
                            failedRecordMap.put("taskId", taskId);
                            allFailedRecords.add(failedRecordMap);
                        }

                        totalFailedRecords += failedRecords.size();
                    }
                }
            } catch (Exception e) {
                logger.warn("处理任务 {} 时出错: {}", taskKey, e.getMessage());
                // 继续处理其他任务
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("failedRecords", allFailedRecords);
        response.put("totalFailedRecords", totalFailedRecords);
        response.put("message", "成功获取所有失败记录");

        return ResponseEntity.ok(response);
    } catch (Exception e) {
        logger.error("获取所有失败记录失败", e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Collections.singletonMap("error", "获取失败记录失败: " + e.getMessage()));
    }
}

@PostMapping("/reprocess-all-failed")
@Operation(summary = "重新处理所有失败记录", description = "重新处理Redis中所有任务的无效数据和错误记录")
public ResponseEntity<Map<String, Object>> reprocessAllFailedRecords() {
    try {
        // 获取公司名称到ID的映射
        Map<String, String> companyNameToIdMap = getCompanyNameToIdMap();

        // 获取所有任务键
        Set<String> taskKeys = redisTemplate.keys("task:*");
        if (taskKeys == null || taskKeys.isEmpty()) {
            Map<String, Object> response = new HashMap<>();
            response.put("message", "没有找到任何任务");
            response.put("reprocessedCount", 0);
            response.put("successCount", 0);
            response.put("failedCount", 0);
            return ResponseEntity.ok(response);
        }

        List<NewDataMigrationService.RecordMigrationDetail> allFailedRecords = new ArrayList<>();

        // 收集所有失败记录
        for (String taskKey : taskKeys) {
            try {
                String result = redisTemplate.opsForValue().get(taskKey);

                if (result != null) {
                    Map<String, Object> taskResult = objectMapper.readValue(result, new TypeReference<Map<String, Object>>() {});
                    List<Map<String, Object>> recordDetails = (List<Map<String, Object>>) taskResult.get("recordDetails");

                    if (recordDetails != null && !recordDetails.isEmpty()) {
                        // 转换为RecordMigrationDetail对象列表
                        List<NewDataMigrationService.RecordMigrationDetail> details = recordDetails.stream()
                                .map(this::mapToRecordMigrationDetail)
                                .filter(Objects::nonNull)
                                .collect(Collectors.toList());

                        // 筛选出无效和错误记录
                        List<NewDataMigrationService.RecordMigrationDetail> failedRecords = newDataMigrationService.filterInvalidAndErrorRecords(details);
                        allFailedRecords.addAll(failedRecords);
                    }
                }
            } catch (Exception e) {
                logger.warn("处理任务 {} 时出错: {}", taskKey, e.getMessage());
                // 继续处理其他任务
            }
        }

        if (allFailedRecords.isEmpty()) {
            Map<String, Object> response = new HashMap<>();
            response.put("message", "没有需要重新处理的失败记录");
            response.put("reprocessedCount", 0);
            response.put("successCount", 0);
            response.put("failedCount", 0);
            return ResponseEntity.ok(response);
        }

        // 重新处理所有失败记录
        Map<String, Object> reprocessResult = newDataMigrationService.reprocessFailedRecords(allFailedRecords, companyNameToIdMap);

        return ResponseEntity.ok(reprocessResult);
    } catch (Exception e) {
        logger.error("重新处理所有失败记录失败", e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Collections.singletonMap("error", "重新处理失败记录失败: " + e.getMessage()));
    }
}




/**
 * 将Map转换为RecordMigrationDetail对象
 */
private NewDataMigrationService.RecordMigrationDetail mapToRecordMigrationDetail(Map<String, Object> map) {
    try {
        return new NewDataMigrationService.RecordMigrationDetail(
                (String) map.get("recordId"),
                (String) map.get("jobTitle"),
                (String) map.get("companyName"),
                (String) map.get("jobUrl"),
                (String) map.get("status"),
                (String) map.get("message")
        );
    } catch (Exception e) {
        logger.warn("转换RecordMigrationDetail时出错: {}", e.getMessage());
        return null;
    }
}

/**
 * 将RecordMigrationDetail对象转换为Map
 */
private Map<String, Object> recordMigrationDetailToMap(NewDataMigrationService.RecordMigrationDetail detail) {
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
 * 获取公司名称到ID的映射
 * 这里需要根据你的实际实现来获取公司映射数据
 */
private Map<String, String> getCompanyNameToIdMap() {
    // 实现获取公司映射的逻辑
    // 这可能需要注入相应的Repository或Service
    // 示例实现：
    List<com.x.pelegant.entity.Company> companies = mongoTemplate.findAll(com.x.pelegant.entity.Company.class);
    Map<String, String> companyNameToIdMap = new HashMap<>();
    for (com.x.pelegant.entity.Company company : companies) {
        companyNameToIdMap.put(company.getCompanyName(), company.getCompanyId());
    }
    return companyNameToIdMap;
}
// 添加到你的Controller中
// 添加到你的Controller中
@PostMapping("/test/populate-sample-data")
@Operation(summary = "填充示例数据", description = "创建包含各种状态记录的示例任务数据")
public ResponseEntity<Map<String, Object>> populateSampleData(@Parameter(description = "管理员口令") String Key) {
    if (!Key.equals("pelegant")) {
        return ResponseEntity.status(403).body(null);
    }

    Map<String, Object> response = new HashMap<>();

    try {
        String taskId = "sample-task-" + UUID.randomUUID().toString().substring(0, 8);
        String taskKey = "task:" + taskId;

        // 创建不同状态的记录
        List<NewDataMigrationService.RecordMigrationDetail> sampleRecords = new ArrayList<>();
        sampleRecords.add(new NewDataMigrationService.RecordMigrationDetail(
                "record-success-001",
                "Frontend Developer",
                "Tech Corp",
                "https://techcorp.com/job/001",
                "migrated_job",
                "成功迁移到Job集合"
        ));
        sampleRecords.add(new NewDataMigrationService.RecordMigrationDetail(
                "record-pass-001",
                "Data Analyst",
                "Unknown Company",
                "https://unknown.com/job/002",
                "migrated_passjob",
                "成功迁移到PassJob集合"
        ));
        sampleRecords.add(new NewDataMigrationService.RecordMigrationDetail(
                "record-dedup-redis-001",
                "Backend Engineer",
                "Same Company",
                "https://samecompany.com/job/003",
                "dedup_redis",
                "在Redis中检测到重复"
        ));
        sampleRecords.add(new NewDataMigrationService.RecordMigrationDetail(
                "record-dedup-db-001",
                "DevOps Specialist",
                "Repeat Company",
                "https://repeatcompany.com/job/004",
                "dedup_db",
                "在数据库中检测到重复"
        ));
        sampleRecords.add(new NewDataMigrationService.RecordMigrationDetail(
                "record-invalid-001",
                "",  // 空标题
                "",  // 空公司名
                "https://invalid.com/job/005",
                "invalid",
                "无效数据记录: 缺少必要字段"
        ));
        sampleRecords.add(new NewDataMigrationService.RecordMigrationDetail(
                "record-error-001",
                "System Administrator",
                "Error Company",
                "https://errorcompany.com/job/006",
                "error",
                "处理过程中出现错误: 模拟系统异常"
        ));

        // 创建任务结果数据结构
        Map<String, Object> taskResult = new HashMap<>();
        taskResult.put("taskId", taskId);
        taskResult.put("migrationResult", "示例任务结果: 6条记录");
        taskResult.put("totalRecords", sampleRecords.size());
        taskResult.put("jobsMigrated", 1);
        taskResult.put("passJobsMigrated", 1);
        taskResult.put("duplicatesFound", 2);
        taskResult.put("duration", "200ms");

        // 转换记录详情为Map格式
        List<Map<String, Object>> recordDetails = new ArrayList<>();
        for (NewDataMigrationService.RecordMigrationDetail record : sampleRecords) {
            Map<String, Object> map = new HashMap<>();
            map.put("recordId", record.getRecordId());
            map.put("jobTitle", record.getJobTitle());
            map.put("companyName", record.getCompanyName());
            map.put("jobUrl", record.getJobUrl());
            map.put("status", record.getStatus());
            map.put("message", record.getMessage());
            recordDetails.add(map);
        }

        taskResult.put("recordDetails", recordDetails);

        // 添加批次详情
        List<Map<String, Object>> batchDetails = new ArrayList<>();
        Map<String, Object> batchDetail = new HashMap<>();
        batchDetail.put("batch", 1);
        batchDetail.put("jobsMigrated", 1);
        batchDetail.put("passJobsMigrated", 1);
        batchDetail.put("duplicates", 2);
        batchDetails.add(batchDetail);

        taskResult.put("batchDetails", batchDetails);

        // 将任务结果序列化为JSON并保存到Redis
        String taskResultJson = objectMapper.writeValueAsString(taskResult);
        redisTemplate.opsForValue().set(taskKey, taskResultJson, 24, TimeUnit.HOURS);

        response.put("message", "示例数据填充成功");
        response.put("taskId", taskId);
        response.put("recordCount", sampleRecords.size());

        return ResponseEntity.ok(response);
    } catch (Exception e) {
        logger.error("填充示例数据失败", e);
        response.put("error", "填充示例数据失败: " + e.getMessage());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
}


}