//package com.x.pelegant.service;
//
//import com.fasterxml.jackson.databind.JsonNode;
//import com.fasterxml.jackson.databind.ObjectMapper;
//import com.mongodb.client.result.UpdateResult;
//import com.x.pelegant.entity.ResumeData;
//import com.x.pelegant.entity.RecommendedWork;
//import com.x.pelegant.entity.Job;
//import com.x.pelegant.entity.Company;
//import com.x.pelegant.repository.ResumeDataRepository;
//import com.x.pelegant.repository.RecommendedWorkRepository;
//import com.x.pelegant.repository.JobRepository;
//import com.x.pelegant.repository.CompanyRepository;
//import lombok.extern.slf4j.Slf4j;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.beans.factory.annotation.Value;
//import org.springframework.data.mongodb.core.MongoTemplate;
//import org.springframework.data.mongodb.core.query.Criteria;
//import org.springframework.data.mongodb.core.query.Query;
//import org.springframework.data.mongodb.core.query.Update;
//import org.springframework.http.*;
//import org.springframework.stereotype.Service;
//import org.springframework.web.client.HttpClientErrorException;
//import org.springframework.web.client.RestTemplate;
//
//import java.time.LocalDateTime;
//import java.util.*;
//import com.fasterxml.jackson.core.type.TypeReference;
//
///**
// * Coze AI工作流集成服务
// */
//@Service
//@Slf4j
//public class CozeAIService {
//
//    @Value("${coze.api.url:https://api.coze.cn/v1/workflow/run}")
//    private String cozeApiUrl;
//
//    @Value("${coze.api.token:pat_7afLlKLu8UcXEXpgXqDoaPDYuiT0pYzceKu38W4wK1I1fZqbMdEclBCbOpGrx4qV}")
//    private String cozeApiToken;
//
//    @Value("${coze.app.id:7515373428439105576}")
//    private String cozeAppId;
//
//    @Value("${coze.workflow.id:7523409802166009906}")
//    private String cozeWorkflowId;
//
//    @Value("${coze.recommendation.workflow.id:7524298319712944179}")
//    private String cozeRecommendationWorkflowId;
//
//    @Value("${coze.public.url}")
//    private String cozePublicUrl;
//    @Autowired
//    private MongoTemplate mongoTemplate;
//    @Autowired
//    private ResumeDataRepository resumeDataRepository;
//
//    @Autowired
//    private RecommendedWorkRepository recommendedWorkRepository;
//
//    @Autowired
//    private JobRepository jobRepository;
//
//    @Autowired
//    private CompanyRepository companyRepository;
//
//    @Autowired
//    private RestTemplate restTemplate;
//
//    private final ObjectMapper objectMapper = new ObjectMapper();
//
//    /**
//     * 调用Coze AI工作流解析简历
//     */
//    public ResumeData parseResume(String studentId, String resumePath) {
//        try {
//            log.info("开始解析简历: 学生ID={}, 简历路径={}", studentId, resumePath);
//
//            // 删除学生旧解析记录
//            resumeDataRepository.deleteByStudentId(studentId);
//            log.info("已删除旧解析记录: 学生ID={}", studentId);
//
//            // 创建新解析记录
//            ResumeData resumeData = new ResumeData();
//            resumeData.setStudentId(studentId);
//            resumeData.setResumePath(resumePath);
//            resumeData.setParseStatus("pending");
//            resumeData = resumeDataRepository.save(resumeData);
//
//            // 验证 API 令牌
//            if (cozeApiToken == null || cozeApiToken.trim().isEmpty()) {
//                log.error("Coze API 令牌为空或未配置: 学生ID={}", studentId);
//                resumeData.setParseStatus("failed");
//                resumeData.setErrorMessage("Coze API 令牌为空或未配置");
//                return resumeDataRepository.save(resumeData);
//            }
//
//            // 构建请求体
//            Map<String, Object> requestBody = new HashMap<>();
//            requestBody.put("app_id", cozeAppId);
//            requestBody.put("workflow_id", cozeWorkflowId);
//
//            // 构建文件访问 URL
//            String fullFileUrl = cozePublicUrl + "/api/files" + resumePath;
//            log.debug("文件访问 URL: {}", fullFileUrl);
//
//            // 设置 parameters
//            Map<String, String> parameters = new HashMap<>();
//            parameters.put("input", fullFileUrl);
//            requestBody.put("parameters", parameters);
//
//            // 设置请求头
//            HttpHeaders headers = new HttpHeaders();
//            headers.setContentType(MediaType.APPLICATION_JSON);
//            headers.set("Authorization", "Bearer " + cozeApiToken);
//
//            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
//
//            // 调用 Coze API，增加重试逻辑
//            int maxRetries = 3;
//            int retryCount = 0;
//            ResponseEntity<String> response = null;
//
//            while (retryCount < maxRetries) {
//                try {
//                    response = restTemplate.postForEntity(cozeApiUrl, request, String.class);
//                    break; // 成功则退出重试
//                } catch (HttpClientErrorException e) {
//                    if (e.getStatusCode() == HttpStatus.UNAUTHORIZED) {
//                        retryCount++;
//                        if (retryCount == maxRetries) {
//                            log.error("Coze API 调用失败，达到最大重试次数: 学生ID={}, HTTP 状态码={}, 错误={}",
//                                    studentId, e.getStatusCode(), e.getMessage());
//                            resumeData.setParseStatus("failed");
//                            resumeData.setErrorMessage("API 调用失败: 401 Unauthorized");
//                            return resumeDataRepository.save(resumeData);
//                        }
//                        log.warn("Coze API 401 Unauthorized，第 {} 次重试: 学生ID={}", retryCount, studentId);
//                        Thread.sleep(1000 * retryCount); // 指数退避
//                        // 可选：尝试刷新令牌（需实现 refreshToken 方法）
//                        // cozeApiToken = refreshToken();
//                        continue;
//                    } else {
//                        throw e; // 其他 HTTP 错误直接抛出
//                    }
//                }
//            }
//
//            if (response != null && response.getStatusCode() == HttpStatus.OK) {
//                String responseBody = response.getBody();
//                log.debug("Coze API 响应: {}", responseBody);
//
//                // 解析响应
//                JsonNode responseJson = objectMapper.readTree(responseBody);
//
//                // 检查 API 是否返回错误
//                boolean hasError = false;
//                String errorMsg = "";
//
//                if (responseJson.has("status_code") && responseJson.get("status_code").asInt() != 0) {
//                    hasError = true;
//                    errorMsg = responseJson.has("message") ? responseJson.get("message").asText() : "未知错误";
//                    log.warn("Coze API 返回错误: status_code={}, message={}",
//                            responseJson.get("status_code").asInt(), errorMsg);
//                } else if (responseJson.has("code") && responseJson.get("code").asInt() != 0) {
//                    hasError = true;
//                    errorMsg = responseJson.has("msg") ? responseJson.get("msg").asText() : "未知错误";
//                    log.warn("Coze API 返回错误: code={}, msg={}",
//                            responseJson.get("code").asInt(), errorMsg);
//                }
//
//                if (hasError) {
//                    resumeData.setParseStatus("failed");
//                    resumeData.setErrorMessage("Coze API 错误: " + errorMsg);
//                } else {
//                    // 查找数据字段
//                    JsonNode dataNode = null;
//
//                    if (responseJson.has("data")) {
//                        JsonNode rawDataNode = responseJson.get("data");
//                        if (rawDataNode.isTextual()) {
//                            try {
//                                String dataString = rawDataNode.asText();
//                                dataNode = objectMapper.readTree(dataString);
//                            } catch (Exception e) {
//                                dataNode = rawDataNode;
//                            }
//                        } else {
//                            dataNode = rawDataNode;
//                        }
//                    } else if (responseJson.has("result")) {
//                        dataNode = responseJson.get("result");
//                    } else if (responseJson.has("output")) {
//                        dataNode = responseJson.get("output");
//                    }
//
//                    if (dataNode != null && !dataNode.isNull()) {
//                        if (dataNode.has("output") && dataNode.get("output").isNull()) {
//                            resumeData.setParseStatus("failed");
//                            resumeData.setErrorMessage("Coze AI 工作流返回空结果，可能是 PDF 文件无法解析或格式不支持");
//                        } else {
//                            // 保存日志 ID
//                            if (responseJson.has("log_id")) {
//                                resumeData.setLogId(responseJson.get("log_id").asText());
//                            }
//
//                            // 解析并保存数据
//                            parseAndSaveResumeData(resumeData, dataNode);
//                            log.info("简历解析成功: 学生ID={}, ResumeData={}", studentId, resumeData);
//                            resumeData.setParseStatus("success");
//
//                            // 自动生成 AI 职位推荐
//                            try {
//                                log.info("开始生成 AI 职位推荐: 学生ID={}", studentId);
//                                generateJobRecommendations(studentId);
//                                log.info("AI 职位推荐生成完成: 学生ID={}", studentId);
//                            } catch (Exception e) {
//                                log.warn("生成 AI 职位推荐失败: 学生ID={}, 错误={}", studentId, e.getMessage());
//                            }
//                        }
//                    } else {
//                        resumeData.setParseStatus("failed");
//                        resumeData.setErrorMessage("API 响应中没有有效的数据字段");
//                    }
//                }
//            } else {
//                resumeData.setParseStatus("failed");
//                resumeData.setErrorMessage("API 调用失败: HTTP " + (response != null ? response.getStatusCode() : "未知"));
//            }
//
//            return resumeDataRepository.save(resumeData);
//
//        } catch (Exception e) {
//            log.error("简历解析失败: 学生ID={}, 错误={}", studentId, e.getMessage());
//            ResumeData resumeData = resumeDataRepository.findByStudentIdAndResumePath(studentId, resumePath)
//                    .orElse(new ResumeData());
//            resumeData.setStudentId(studentId);
//            resumeData.setResumePath(resumePath);
//            resumeData.setParseStatus("failed");
//            resumeData.setErrorMessage(e.getMessage());
//            return resumeDataRepository.save(resumeData);
//        }
//    }
//
//    /**
//     * 保存Coze AI解析的简历数据
//     */
//    private void parseAndSaveResumeData(ResumeData resumeData, JsonNode dataNode) {
//        try {
//            TypeReference<Map<String, Object>> mapType = new TypeReference<Map<String, Object>>() {};
//            Map<String, Object> fullData = objectMapper.convertValue(dataNode, mapType);
//            resumeData.setData(fullData);
//            resumeData.setParseStatus("success");
//            resumeDataRepository.save(resumeData);
//        } catch (Exception e) {
//            log.error("保存简历数据失败: {}", e.getMessage(), e);
//            resumeData.setParseStatus("failed");
//        }
//    }
//
//    /**
//     * 获取学生的简历解析数据
//     */
//    public Optional<ResumeData> getResumeData(String studentId) {
//        return resumeDataRepository.findTopByStudentIdOrderByCreatedAtDesc(studentId);
//    }
//
//    /**
//     * 删除学生的简历解析数据
//     */
//    public void deleteResumeData(String studentId) {
//        resumeDataRepository.deleteByStudentId(studentId);
//    }
//
//    /**
//     * 为学生生成AI职位推荐
//     */
//    public List<RecommendedWork> generateJobRecommendations(String studentId) {
//        try {
//            log.info("开始为学生生成AI职位推荐: studentId={}", studentId);
//
//            // 1. 获取学生的简历数据
//            Optional<ResumeData> resumeOpt = resumeDataRepository.findTopByStudentIdOrderByCreatedAtDesc(studentId);
//            if (!resumeOpt.isPresent()) {
//                log.warn("学生简历数据不存在，使用默认数据: studentId={}", studentId);
//                // 如果没有简历数据，使用空的数据结构
//                ResumeData emptyResumeData = new ResumeData();
//                emptyResumeData.setStudentId(studentId);
//                emptyResumeData.setData(new HashMap<>());
//                resumeOpt = Optional.of(emptyResumeData);
//            }
//
//            ResumeData resumeData = resumeOpt.get();
//
//            // 2. 调用Coze AI推荐工作流
//            List<RecommendedWork> recommendations = callRecommendationWorkflow(studentId, resumeData);
//
//            // 3. 保存推荐结果到数据库
//            saveRecommendations(studentId, recommendations);
//
//            log.info("成功生成AI职位推荐: studentId={}, 推荐数量={}", studentId, recommendations.size());
//            return recommendations;
//
//        } catch (Exception e) {
//            log.error("生成AI职位推荐失败: studentId={}", studentId, e);
//            throw new RuntimeException("生成AI职位推荐失败: " + e.getMessage(), e);
//        }
//    }
//
//    /**
//     * 调用Coze AI推荐工作流
//     */
//    private List<RecommendedWork> callRecommendationWorkflow(String studentId, ResumeData resumeData) throws Exception {
//        // 构建请求体
//        Map<String, Object> requestBody = new HashMap<>();
//        requestBody.put("workflow_id", cozeRecommendationWorkflowId);
//        requestBody.put("app_id", cozeAppId);
//
//        // 构建参数
//        Map<String, Object> parameters = new HashMap<>();
//        // 直接使用简历数据，如果为空则传空对象
//        Object resumeDataObj = resumeData.getData();
//        if (resumeDataObj == null) {
//            resumeDataObj = new HashMap<>();
//        }
//        parameters.put("Resume", resumeDataObj);
//        requestBody.put("parameters", parameters);
//
//        // 设置请求头
//        HttpHeaders headers = new HttpHeaders();
//        headers.setContentType(MediaType.APPLICATION_JSON);
//        headers.set("Authorization", "Bearer " + cozeApiToken);
//
//        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
//
//        log.info("调用Coze AI推荐工作流: workflow_id={}", cozeRecommendationWorkflowId);
//
//        // 调用API
//        ResponseEntity<String> response = restTemplate.postForEntity(cozeApiUrl, request, String.class);
//
//        if (!response.getStatusCode().is2xxSuccessful()) {
//            throw new RuntimeException("Coze AI推荐工作流调用失败: " + response.getStatusCode());
//        }
//
//        // 解析真实的AI响应
//        return parseAIRecommendations(studentId, response.getBody());
//    }
//
//    /**
//     * 解析AI推荐响应
//     */
//    private List<RecommendedWork> parseAIRecommendations(String studentId, String responseBody) throws Exception {
//        log.info("解析AI推荐响应: {}", responseBody);
//
//        List<RecommendedWork> recommendations = new ArrayList<>();
//        JsonNode rootNode = objectMapper.readTree(responseBody);
//
//        try {
//            // 检查是否有data字段
//            if (rootNode.has("data")) {
//                JsonNode dataNode = rootNode.get("data");
//
//                // 检查data是否为字符串，如果是则需要再次解析
//                if (dataNode.isTextual()) {
//                    String dataString = dataNode.asText();
//                    log.debug("解析data字符串: {}", dataString);
//                    dataNode = objectMapper.readTree(dataString);
//                }
//
//                // 查找推荐结果，预期data字段包含jobID数组
//                JsonNode recommendationsNode = null;
//                if (dataNode.has("data")) {
//                    JsonNode innerDataNode = dataNode.get("data");
//                    if (innerDataNode.isTextual()) {
//                        String innerDataString = innerDataNode.asText();
//                        log.debug("解析内层data字符串: {}", innerDataString);
//                        recommendationsNode = objectMapper.readTree(innerDataString);
//                    } else if (innerDataNode.isArray()) {
//                        recommendationsNode = innerDataNode;
//                    }
//                } else if (dataNode.isArray()) {
//                    recommendationsNode = dataNode;
//                }
//
//                if (recommendationsNode != null && recommendationsNode.isArray()) {
//                    for (JsonNode recNode : recommendationsNode) {
//                        // 获取AI返回的id（这是AI返回的工作ID）
//                        if (recNode.has("id")) {
//                            String aiJobId = recNode.get("id").asText();
//                            System.out.println("aiJobId: " + aiJobId);
//                            if (!aiJobId.isEmpty()) {
//                                RecommendedWork recommendation = new RecommendedWork();
//                                recommendation.setStudentId(studentId);
//
//                                // 使用aiJobId去本地数据库查询对应职位的详细信息
//                                Optional<Job> jobOpt = matchJobByJobId(aiJobId);  // 根据AI返回的id去查询job表
//                                System.out.println("jobOpt: " + jobOpt);
//                                if (jobOpt.isPresent()) {
//                                    Job job = jobOpt.get();
//                                    recommendation.setJobTitle(job.getJobTitle());
//                                    recommendation.setJobId(job.getJobId());  // 使用本地数据库中的jobId
//                                    recommendation.setCompanyName(job.getCompanyName());
//                                    recommendation.setCompanyId(job.getCompanyId());
//                                    recommendations.add(recommendation);  // 将正确的推荐记录添加到列表
//                                    log.debug("解析到推荐: 公司={}, 职位={}, jobId={}",
//                                            job.getCompanyName(), job.getJobTitle(), job.getJobId());
//                                } else {
//                                    log.warn("未找到岗位: jobId={}", aiJobId);
//                                }
//                            }
//                        }
//                    }
//                } else {
//                    log.warn("AI响应中没有找到推荐结果数组，响应格式可能不符合预期");
//                    log.debug("完整的AI响应: {}", responseBody);
//                }
//            } else {
//                log.warn("AI响应中没有data字段，响应格式可能不符合预期");
//                log.debug("完整的AI响应: {}", responseBody);
//            }
//
//            // 如果没有解析到推荐结果，记录警告
//            if (recommendations.isEmpty()) {
//                log.warn("AI响应中没有找到推荐结果，响应格式可能不符合预期");
//                log.debug("完整的AI响应: {}", responseBody);
//            }
//
//        } catch (Exception e) {
//            log.error("解析AI推荐响应失败: {}", e.getMessage());
//            log.debug("响应内容: {}", responseBody);
//            throw new RuntimeException("解析AI推荐响应失败: " + e.getMessage(), e);
//        }
//
//        log.info("成功解析AI推荐: {} 个职位", recommendations.size());
//        return recommendations;
//    }
//
//    /**
//     * 覆盖式保存推荐结果到数据库
//     * 删除旧数据，重新写入新的推荐结果
//     */
//    private void saveRecommendations(String studentId, List<RecommendedWork> recommendations) {
//        try {
//            // 1. 更新该 studentId 的旧记录为 history = true
//            Query query = new Query(
//                    Criteria.where("studentId").is(studentId)
//                            .orOperator(
//                                    Criteria.where("history").is("false"),
//                                    Criteria.where("history").exists(false)  // 没有 history 字段的情况
//                            )
//            );
//            Update update = new Update().set("history", "true");
//            UpdateResult result = mongoTemplate.updateMulti(query, update, RecommendedWork.class);
//
//            log.info("已将 studentId={} 的 {} 条旧推荐记录标记为历史", studentId, result.getModifiedCount());
//
//            // 2. 插入新的推荐记录
//            int successCount = 0;
//            int skippedCount = 0;
//
//            for (RecommendedWork recommendation : recommendations) {
//                if (validateAndEnrichRecommendation(recommendation)) {
//                    recommendation.setStudentId(studentId);
//                    recommendation.setInsertTime(String.valueOf(LocalDateTime.now())); // 插入时间
//                    recommendation.setHistory("false");
//                    mongoTemplate.insert(recommendation);  // 使用 insert
//                    successCount++;
//                    log.debug("插入推荐记录: 公司={}, 职位={}, jobId={}, companyId={}, 插入时间={}",
//                            recommendation.getCompanyName(), recommendation.getJobTitle(),
//                            recommendation.getJobId(), recommendation.getCompanyId(),
//                            recommendation.getInsertTime());
//                } else {
//                    skippedCount++;
//                    log.warn("跳过推荐记录（未找到匹配公司/职位）: 公司={}, 职位={}, jobId={}",
//                            recommendation.getCompanyName(), recommendation.getJobTitle(), recommendation.getJobId());
//                }
//            }
//
//            log.info("成功插入AI推荐记录: studentId={}, 插入成功={}, 跳过={}, AI推荐总数={}",
//                    studentId, successCount, skippedCount, recommendations.size());
//
//        } catch (Exception e) {
//            log.error("插入AI推荐记录失败: studentId={}", studentId, e);
//            throw new RuntimeException("插入AI推荐记录失败", e);
//        }
//    }
//
//
//    /**
//     * 验证并丰富推荐工作数据：只有当本地数据库中存在对应的职位和公司时才返回true
//     */
//    private boolean validateAndEnrichRecommendation(RecommendedWork recommendation) {
//        try {
//            // 根据jobId查找职位
//            Optional<Job> jobOpt = matchJobByJobid(recommendation.getJobId());
//            if (!jobOpt.isPresent()) {
//                log.debug("未找到岗位: jobId={}", recommendation.getJobId());
//                return false;
//            }
//
//            Job job = jobOpt.get();
//
//            // 验证公司是否存在
//            Optional<Company> companyOpt = companyRepository.findByCompanyId(job.getCompanyId());
//            if (!companyOpt.isPresent()) {
//                log.debug("未找到公司: companyId={}", job.getCompanyId());
//                return false;
//            }
//
//            // 确保推荐数据中的companyId与job中的一致
//            recommendation.setCompanyId(job.getCompanyId());
//            recommendation.setCompanyName(job.getCompanyName());
//            recommendation.setJobTitle(job.getJobTitle());
//
//            log.debug("验证成功: companyId={}, jobId={}", job.getCompanyId(), job.getJobId());
//            return true;
//
//        } catch (Exception e) {
//            log.warn("验证推荐失败: jobId={}, 错误={}", recommendation.getJobId(), e.getMessage());
//            return false;
//        }
//    }
//
//    /**
//     * 根据jobId查询本地数据库中的职位
//     */
//    private Optional<Job> matchJobByJobId(String id) {
//        if (id == null || id.trim().isEmpty()) {
//            return Optional.empty();
//        }
//        Optional<Job> jobOpt = jobRepository.findById(id);
//        log.debug("查询职位: jobId={}", id);
//        if (!jobOpt.isPresent()) {
//            log.warn("未找到岗位: jobId={}", id);
//        } else {
//            Job job = jobOpt.get();
//            log.debug("找到岗位: {} - {}", job.getJobTitle(), job.getJobId());
//        }
//        return jobOpt;
//    }
//
//    private Optional<Job> matchJobByJobid(String id) {
//        if (id == null || id.trim().isEmpty()) {
//            return Optional.empty();
//        }
//        Optional<Job> jobOpt = jobRepository.findByJobId(id);
//        log.debug("查询职位: jobId={}", id);
//        if (!jobOpt.isPresent()) {
//            log.warn("未找到岗位: jobId={}", id);
//        } else {
//            Job job = jobOpt.get();
//            log.debug("找到岗位: {} - {}", job.getJobTitle(), job.getJobId());
//        }
//        return jobOpt;
//    }
//
//}







package com.x.pelegant.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mongodb.client.result.UpdateResult;
import com.x.pelegant.entity.ResumeData;
import com.x.pelegant.entity.RecommendedWork;
import com.x.pelegant.entity.Job;
import com.x.pelegant.repository.ResumeDataRepository;
import com.x.pelegant.repository.RecommendedWorkRepository;
import com.x.pelegant.repository.JobRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;
import com.fasterxml.jackson.core.type.TypeReference;

/**
 * Coze AI工作流集成服务
 */
@Service
@Slf4j
public class CozeAIService {

    @Value("${coze.api.url:https://api.coze.cn/v1/workflow/run}")
    private String cozeApiUrl;

    @Value("${coze.api.token:pat_7afLlKLu8UcXEXpgXqDoaPDYuiT0pYzceKu38W4wK1I1fZqbMdEclBCbOpGrx4qV}")
    private String cozeApiToken;

    @Value("${coze.app.id:7515373428439105576}")
    private String cozeAppId;

    @Value("${coze.workflow.id:7523409802166009906}")
    private String cozeWorkflowId;

    @Value("${coze.recommendation.workflow.id:7524298319712944179}")
    private String cozeRecommendationWorkflowId;

    @Value("${coze.public.url}")
    private String cozePublicUrl;
    @Autowired
    private MongoTemplate mongoTemplate;
    @Autowired
    private ResumeDataRepository resumeDataRepository;

    @Autowired
    private RecommendedWorkRepository recommendedWorkRepository;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private RestTemplate restTemplate;

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * 调用Coze AI工作流解析简历
     */
    public ResumeData parseResume(String studentId, String resumePath) {
        try {
            log.info("开始解析简历: 学生ID={}, 简历路径={}", studentId, resumePath);

            // 删除学生旧解析记录
            resumeDataRepository.deleteByStudentId(studentId);
            log.info("已删除旧解析记录: 学生ID={}", studentId);

            // 创建新解析记录
            ResumeData resumeData = new ResumeData();
            resumeData.setStudentId(studentId);
            resumeData.setResumePath(resumePath);
            resumeData.setParseStatus("pending");
            resumeData = resumeDataRepository.save(resumeData);

            // 验证 API 令牌
            if (cozeApiToken == null || cozeApiToken.trim().isEmpty()) {
                log.error("Coze API 令牌为空或未配置: 学生ID={}", studentId);
                resumeData.setParseStatus("failed");
                resumeData.setErrorMessage("Coze API 令牌为空或未配置");
                return resumeDataRepository.save(resumeData);
            }

            // 构建请求体
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("app_id", cozeAppId);
            requestBody.put("workflow_id", cozeWorkflowId);

            // 构建文件访问 URL
            String fullFileUrl = cozePublicUrl + "/api/files" + resumePath;
            log.debug("文件访问 URL: {}", fullFileUrl);

            // 设置 parameters
            Map<String, String> parameters = new HashMap<>();
            parameters.put("input", fullFileUrl);
            requestBody.put("parameters", parameters);

            // 设置请求头
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + cozeApiToken);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            // 调用 Coze API，增加重试逻辑
            int maxRetries = 3;
            int retryCount = 0;
            ResponseEntity<String> response = null;

            while (retryCount < maxRetries) {
                try {
                    response = restTemplate.postForEntity(cozeApiUrl, request, String.class);
                    break; // 成功则退出重试
                } catch (HttpClientErrorException e) {
                    if (e.getStatusCode() == HttpStatus.UNAUTHORIZED) {
                        retryCount++;
                        if (retryCount == maxRetries) {
                            log.error("Coze API 调用失败，达到最大重试次数: 学生ID={}, HTTP 状态码={}, 错误={}",
                                    studentId, e.getStatusCode(), e.getMessage());
                            resumeData.setParseStatus("failed");
                            resumeData.setErrorMessage("API 调用失败: 401 Unauthorized");
                            return resumeDataRepository.save(resumeData);
                        }
                        log.warn("Coze API 401 Unauthorized，第 {} 次重试: 学生ID={}", retryCount, studentId);
                        Thread.sleep(1000 * retryCount); // 指数退避
                        // 可选：尝试刷新令牌（需实现 refreshToken 方法）
                        // cozeApiToken = refreshToken();
                        continue;
                    } else {
                        throw e; // 其他 HTTP 错误直接抛出
                    }
                }
            }

            if (response != null && response.getStatusCode() == HttpStatus.OK) {
                String responseBody = response.getBody();
                log.debug("Coze API 响应: {}", responseBody);

                // 解析响应
                JsonNode responseJson = objectMapper.readTree(responseBody);

                // 检查 API 是否返回错误
                boolean hasError = false;
                String errorMsg = "";

                if (responseJson.has("status_code") && responseJson.get("status_code").asInt() != 0) {
                    hasError = true;
                    errorMsg = responseJson.has("message") ? responseJson.get("message").asText() : "未知错误";
                    log.warn("Coze API 返回错误: status_code={}, message={}",
                            responseJson.get("status_code").asInt(), errorMsg);
                } else if (responseJson.has("code") && responseJson.get("code").asInt() != 0) {
                    hasError = true;
                    errorMsg = responseJson.has("msg") ? responseJson.get("msg").asText() : "未知错误";
                    log.warn("Coze API 返回错误: code={}, msg={}",
                            responseJson.get("code").asInt(), errorMsg);
                }

                if (hasError) {
                    resumeData.setParseStatus("failed");
                    resumeData.setErrorMessage("Coze API 错误: " + errorMsg);
                } else {
                    // 查找数据字段
                    JsonNode dataNode = null;

                    if (responseJson.has("data")) {
                        JsonNode rawDataNode = responseJson.get("data");
                        if (rawDataNode.isTextual()) {
                            try {
                                String dataString = rawDataNode.asText();
                                dataNode = objectMapper.readTree(dataString);
                            } catch (Exception e) {
                                dataNode = rawDataNode;
                            }
                        } else {
                            dataNode = rawDataNode;
                        }
                    } else if (responseJson.has("result")) {
                        dataNode = responseJson.get("result");
                    } else if (responseJson.has("output")) {
                        dataNode = responseJson.get("output");
                    }

                    if (dataNode != null && !dataNode.isNull()) {
                        if (dataNode.has("output") && dataNode.get("output").isNull()) {
                            resumeData.setParseStatus("failed");
                            resumeData.setErrorMessage("Coze AI 工作流返回空结果，可能是 PDF 文件无法解析或格式不支持");
                        } else {
                            // 保存日志 ID
                            if (responseJson.has("log_id")) {
                                resumeData.setLogId(responseJson.get("log_id").asText());
                            }

                            // 解析并保存数据
                            parseAndSaveResumeData(resumeData, dataNode);
                            log.info("简历解析成功: 学生ID={}, ResumeData={}", studentId, resumeData);
                            resumeData.setParseStatus("success");

                            // 自动生成 AI 职位推荐
                            try {
                                log.info("开始生成 AI 职位推荐: 学生ID={}", studentId);
                                generateJobRecommendations(studentId);
                                log.info("AI 职位推荐生成完成: 学生ID={}", studentId);
                            } catch (Exception e) {
                                log.warn("生成 AI 职位推荐失败: 学生ID={}, 错误={}", studentId, e.getMessage());
                            }
                        }
                    } else {
                        resumeData.setParseStatus("failed");
                        resumeData.setErrorMessage("API 响应中没有有效的数据字段");
                    }
                }
            } else {
                resumeData.setParseStatus("failed");
                resumeData.setErrorMessage("API 调用失败: HTTP " + (response != null ? response.getStatusCode() : "未知"));
            }

            return resumeDataRepository.save(resumeData);

        } catch (Exception e) {
            log.error("简历解析失败: 学生ID={}, 错误={}", studentId, e.getMessage());
            ResumeData resumeData = resumeDataRepository.findByStudentIdAndResumePath(studentId, resumePath)
                    .orElse(new ResumeData());
            resumeData.setStudentId(studentId);
            resumeData.setResumePath(resumePath);
            resumeData.setParseStatus("failed");
            resumeData.setErrorMessage(e.getMessage());
            return resumeDataRepository.save(resumeData);
        }
    }

    /**
     * 保存Coze AI解析的简历数据
     */
    private void parseAndSaveResumeData(ResumeData resumeData, JsonNode dataNode) {
        try {
            TypeReference<Map<String, Object>> mapType = new TypeReference<Map<String, Object>>() {};
            Map<String, Object> fullData = objectMapper.convertValue(dataNode, mapType);
            resumeData.setData(fullData);
            resumeData.setParseStatus("success");
            resumeDataRepository.save(resumeData);
        } catch (Exception e) {
            log.error("保存简历数据失败: {}", e.getMessage(), e);
            resumeData.setParseStatus("failed");
        }
    }

    /**
     * 获取学生的简历解析数据
     */
    public Optional<ResumeData> getResumeData(String studentId) {
        return resumeDataRepository.findTopByStudentIdOrderByCreatedAtDesc(studentId);
    }

    /**
     * 删除学生的简历解析数据
     */
    public void deleteResumeData(String studentId) {
        resumeDataRepository.deleteByStudentId(studentId);
    }

    /**
     * 为学生生成AI职位推荐
     */
    public List<RecommendedWork> generateJobRecommendations(String studentId) {
        try {
            log.info("开始为学生生成AI职位推荐: studentId={}", studentId);

            // 1. 获取学生的简历数据
            Optional<ResumeData> resumeOpt = resumeDataRepository.findTopByStudentIdOrderByCreatedAtDesc(studentId);
            if (!resumeOpt.isPresent()) {
                log.warn("学生简历数据不存在，使用默认数据: studentId={}", studentId);
                // 如果没有简历数据，使用空的数据结构
                ResumeData emptyResumeData = new ResumeData();
                emptyResumeData.setStudentId(studentId);
                emptyResumeData.setData(new HashMap<>());
                resumeOpt = Optional.of(emptyResumeData);
            }

            ResumeData resumeData = resumeOpt.get();

            // 2. 调用Coze AI推荐工作流
            List<RecommendedWork> recommendations = callRecommendationWorkflow(studentId, resumeData);

            // 3. 保存推荐结果到数据库
            saveRecommendations(studentId, recommendations);

            log.info("成功生成AI职位推荐: studentId={}, 推荐数量={}", studentId, recommendations.size());
            return recommendations;

        } catch (Exception e) {
            log.error("生成AI职位推荐失败: studentId={}", studentId, e);
            throw new RuntimeException("生成AI职位推荐失败: " + e.getMessage(), e);
        }
    }

    /**
     * 调用Coze AI推荐工作流
     */
    private List<RecommendedWork> callRecommendationWorkflow(String studentId, ResumeData resumeData) throws Exception {
        // 构建请求体
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("workflow_id", cozeRecommendationWorkflowId);
        requestBody.put("app_id", cozeAppId);

        // 构建参数
        Map<String, Object> parameters = new HashMap<>();
        // 直接使用简历数据，如果为空则传空对象
        Object resumeDataObj = resumeData.getData();
        if (resumeDataObj == null) {
            resumeDataObj = new HashMap<>();
        }
        parameters.put("Resume", resumeDataObj);
        requestBody.put("parameters", parameters);

        // 设置请求头
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + cozeApiToken);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

        log.info("调用Coze AI推荐工作流: workflow_id={}", cozeRecommendationWorkflowId);

        // 调用API
        ResponseEntity<String> response = restTemplate.postForEntity(cozeApiUrl, request, String.class);

        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new RuntimeException("Coze AI推荐工作流调用失败: " + response.getStatusCode());
        }

        // 解析真实的AI响应
        return parseAIRecommendations(studentId, response.getBody());
    }

    /**
     * 解析AI推荐响应
     */
    private List<RecommendedWork> parseAIRecommendations(String studentId, String responseBody) throws Exception {
        log.info("解析AI推荐响应: {}", responseBody);

        List<RecommendedWork> recommendations = new ArrayList<>();
        JsonNode rootNode = objectMapper.readTree(responseBody);

        try {
            // 检查是否有data字段
            if (rootNode.has("data")) {
                JsonNode dataNode = rootNode.get("data");

                // 检查data是否为字符串，如果是则需要再次解析
                if (dataNode.isTextual()) {
                    String dataString = dataNode.asText();
                    log.debug("解析data字符串: {}", dataString);
                    dataNode = objectMapper.readTree(dataString);
                }

                // 查找推荐结果，预期data字段包含jobID数组
                JsonNode recommendationsNode = null;
                if (dataNode.has("data")) {
                    JsonNode innerDataNode = dataNode.get("data");
                    if (innerDataNode.isTextual()) {
                        String innerDataString = innerDataNode.asText();
                        log.debug("解析内层data字符串: {}", innerDataString);
                        recommendationsNode = objectMapper.readTree(innerDataString);
                    } else if (innerDataNode.isArray()) {
                        recommendationsNode = innerDataNode;
                    }
                } else if (dataNode.isArray()) {
                    recommendationsNode = dataNode;
                }

                if (recommendationsNode != null && recommendationsNode.isArray()) {
                    for (JsonNode recNode : recommendationsNode) {
                        // 获取AI返回的id（这是AI返回的工作ID）
                        if (recNode.has("id")) {
                            String aiJobId = recNode.get("id").asText();
                            System.out.println("aiJobId: " + aiJobId);
                            if (!aiJobId.isEmpty()) {
                                RecommendedWork recommendation = new RecommendedWork();
                                recommendation.setStudentId(studentId);

                                // 使用aiJobId去本地数据库查询对应职位的详细信息
                                Optional<Job> jobOpt = matchJobByid(aiJobId);  // 根据AI返回的id去查询job表
                                System.out.println("jobOpt: " + jobOpt);
                                if (jobOpt.isPresent()) {
                                    Job job = jobOpt.get();
                                    recommendation.setJobKey(job.getId());
                                    recommendation.setJobTitle(job.getJobTitle());
                                    recommendation.setJobId(job.getJobId());  // 使用本地数据库中的jobId
                                    recommendation.setCompanyName(job.getCompanyName());
                                    recommendation.setCompanyId(job.getCompanyId());
                                    recommendations.add(recommendation);  // 将正确的推荐记录添加到列表
                                    log.debug("解析到推荐: 公司={}, 职位={}, jobId={}",
                                            job.getCompanyName(), job.getJobTitle(), job.getJobId());
                                } else {
                                    log.warn("未找到岗位: jobId={}", aiJobId);
                                }
                            }
                        }
                    }
                } else {
                    log.warn("AI响应中没有找到推荐结果数组，响应格式可能不符合预期");
                    log.debug("完整的AI响应: {}", responseBody);
                }
            } else {
                log.warn("AI响应中没有data字段，响应格式可能不符合预期");
                log.debug("完整的AI响应: {}", responseBody);
            }

            // 如果没有解析到推荐结果，记录警告
            if (recommendations.isEmpty()) {
                log.warn("AI响应中没有找到推荐结果，响应格式可能不符合预期");
                log.debug("完整的AI响应: {}", responseBody);
            }

        } catch (Exception e) {
            log.error("解析AI推荐响应失败: {}", e.getMessage());
            log.debug("响应内容: {}", responseBody);
            throw new RuntimeException("解析AI推荐响应失败: " + e.getMessage(), e);
        }

        log.info("成功解析AI推荐: {} 个职位", recommendations.size());
        return recommendations;
    }

    /**
     * 覆盖式保存推荐结果到数据库
     * 删除旧数据，重新写入新的推荐结果
     */
    private void saveRecommendations(String studentId, List<RecommendedWork> recommendations) {
        try {
            // 1. 先将该 studentId 下的所有记录的 history 字段标记为 true
            Query updateQuery = new Query(Criteria.where("studentId").is(studentId).and("history").is("false"));
            Update update = new Update().set("history", "true");
            UpdateResult updateResult = mongoTemplate.updateMulti(updateQuery, update, RecommendedWork.class);
            log.info("已将 studentId={} 下的 {} 条推荐记录标记为历史", studentId, updateResult.getModifiedCount());

            // 2. 插入新的推荐记录并标记为 false
            int successCount = 0;
            int skippedCount = 0;

            for (RecommendedWork recommendation : recommendations) {
                recommendation.setStudentId(studentId);
                recommendation.setInsertTime(String.valueOf(LocalDateTime.now())); // 插入时间
                recommendation.setHistory("false");  // 设置为新的记录
                mongoTemplate.insert(recommendation);  // 插入新的记录
                successCount++;
                log.debug("插入推荐记录: 公司={}, 职位={}, jobId={}, companyId={}, 插入时间={}",
                        recommendation.getCompanyName(), recommendation.getJobTitle(),
                        recommendation.getJobId(), recommendation.getCompanyId(),
                        recommendation.getInsertTime());
            }

            // 3. 删除 jobKey 相同的旧记录（即 history = true 的记录）
            for (RecommendedWork recommendation : recommendations) {
                // 删除新插入的记录的 jobKey 对应的历史记录
                Query deleteQuery = new Query(
                        Criteria.where("studentId").is(studentId)
                                .and("jobKey").is(recommendation.getJobKey()) // 使用 jobKey 匹配
                                .and("history").is("true")  // 删除标记为历史的记录
                );
                mongoTemplate.remove(deleteQuery, RecommendedWork.class);  // 删除历史记录
                log.info("已删除 jobKey={} 的历史推荐记录: studentId={}", recommendation.getJobKey(), studentId);
            }

            log.info("成功插入AI推荐记录: studentId={}, 插入成功={}, 跳过={}, AI推荐总数={}",
                    studentId, successCount, skippedCount, recommendations.size());

        } catch (Exception e) {
            log.error("插入AI推荐记录失败: studentId={}", studentId, e);
            throw new RuntimeException("插入AI推荐记录失败", e);
        }
    }



    /**
     * 验证并丰富推荐工作数据：不再验证公司是否存在，只验证职位是否存在
     */
//    private boolean validateAndEnrichRecommendation(RecommendedWork recommendation) {
//        try {
//            // 根据jobId查找职位
//            Optional<Job> jobOpt = matchJobByJobid(recommendation.getJobId());
//            if (!jobOpt.isPresent()) {
//                log.debug("未找到岗位: jobId={}", recommendation.getJobId());
//                return false;
//            }
//
//            Job job = jobOpt.get();
//
//            // 直接使用职位中的公司信息，不再验证公司是否存在
//            recommendation.setCompanyId(job.getCompanyId());
//            recommendation.setCompanyName(job.getCompanyName());
//            recommendation.setJobTitle(job.getJobTitle());
//
//            log.debug("验证成功: companyId={}, jobId={}", job.getCompanyId(), job.getJobId());
//            return true;
//
//        } catch (Exception e) {
//            log.warn("验证推荐失败: jobId={}, 错误={}", recommendation.getJobId(), e.getMessage());
//            return false;
//        }
//    }

    /**
     * 根据jobId查询本地数据库中的职位
     */
    private Optional<Job> matchJobByid(String id) {
        if (id == null || id.trim().isEmpty()) {
            return Optional.empty();
        }
        Optional<Job> jobOpt = jobRepository.findById(id);
        log.debug("查询职位: jobId={}", id);
        if (!jobOpt.isPresent()) {
            log.warn("未找到岗位: jobId={}", id);
        } else {
            Job job = jobOpt.get();
            log.debug("找到岗位: {} - {}", job.getJobTitle(), job.getJobId());
        }
        return jobOpt;
    }

    private Optional<Job> matchJobByJobid(String id) {
        if (id == null || id.trim().isEmpty()) {
            return Optional.empty();
        }
        Optional<Job> jobOpt = jobRepository.findByJobId(id);
        log.debug("查询职位: jobId={}", id);
        if (!jobOpt.isPresent()) {
            log.warn("未找到岗位: jobId={}", id);
        } else {
            Job job = jobOpt.get();
            log.debug("找到岗位: {} - {}", job.getJobTitle(), job.getJobId());
        }
        return jobOpt;
    }

}