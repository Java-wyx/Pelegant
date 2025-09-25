package com.x.pelegant.util;

import com.mongodb.client.model.UpdateOneModel;
import com.mongodb.client.result.UpdateResult;
import com.x.pelegant.entity.Job;
import com.x.pelegant.entity.RecommendedWork;
import com.x.pelegant.repository.JobRepository;
import com.x.pelegant.repository.RecommendedWorkRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class Remedialfunction {
    @Autowired
    private MongoTemplate mongoTemplate;

    @Autowired
    private RecommendedWorkRepository recommendedWorkRepository;

    @Autowired
    private JobRepository jobRepository;

    private static final Logger logger = LoggerFactory.getLogger(Remedialfunction.class);

    public String fixRecommendedWorkJobIdsBatchWithLog() {
        List<RecommendedWork> allRecs = recommendedWorkRepository.findAll();
        int updatedCount = 0;

        // 先构建 jobTitle + companyName → 最新 JobId 映射
        Map<String, String> jobKeyToNewJobId = new HashMap<>();

        for (RecommendedWork rec : allRecs) {
            String oldJobId = rec.getJobId();
            Job oldJob = jobRepository.findById(oldJobId).orElse(null);
            if (oldJob == null) continue;

            String title = oldJob.getJobTitle();
            String company = oldJob.getCompanyName();
            String key = title + "|||" + company;

            if (!jobKeyToNewJobId.containsKey(key)) {
                Query query = new Query();
                query.addCriteria(Criteria.where("jobTitle").is(title)
                        .and("companyName").is(company));
                query.with(Sort.by(Sort.Direction.DESC, "updatedAt"));
                query.limit(1);

                Job latestJob = mongoTemplate.findOne(query, Job.class);
                if (latestJob != null) {
                    jobKeyToNewJobId.put(key, latestJob.getId());
                }
            }
        }

        // 批量更新 recommendedWork
        for (RecommendedWork rec : allRecs) {
            String oldJobId = rec.getJobId();
            Job oldJob = jobRepository.findById(oldJobId).orElse(null);
            if (oldJob == null) continue;

            String key = oldJob.getJobTitle() + "|||" + oldJob.getCompanyName();
            String newJobId = jobKeyToNewJobId.get(key);
            if (newJobId != null && !newJobId.equals(oldJobId)) {
                Update update = new Update().set("jobId", newJobId);
                Query query = new Query(Criteria.where("_id").is(rec.getId()));
                UpdateResult result = mongoTemplate.updateFirst(query, update, RecommendedWork.class);
                if (result.getModifiedCount() > 0) {
                    updatedCount++;
                    logger.info("RecommendedWork {} 的 jobId 修复: {} -> {}", rec.getId(), oldJobId, newJobId);
                }
            }
        }

        logger.info("推荐工作 JobId 修复完成，共修复 {} 条记录。", updatedCount);
        return "推荐工作 JobId 修复完成，共修复" +updatedCount+"条记录。";
    }

    public String fixRecommendedWorkJobIdsBatch() {
        List<RecommendedWork> allRecs = recommendedWorkRepository.findAll();
        int updatedCount = 0;

        // 准备批量更新的操作列表
        List<UpdateOneModel<RecommendedWork>> updates = new ArrayList<>();

        for (RecommendedWork rec : allRecs) {
            String oldJobId = rec.getJobId();
            Job job = jobRepository.findById(oldJobId).orElse(null);
            if (job == null) continue; // Job 不存在则跳过

            String currentJobId = job.getJobId();
            if (!oldJobId.equals(currentJobId)) {
                Query query = new Query(Criteria.where("_id").is(rec.getId()));
                Update update = new Update().set("jobId", currentJobId);

                // 直接执行批量更新
                UpdateResult result = mongoTemplate.updateFirst(query, update, RecommendedWork.class);
                if (result.getModifiedCount() > 0) {
                    updatedCount++;
                    logger.info("RecommendedWork {} 的 jobId 修复: {} -> {}", rec.getId(), oldJobId, currentJobId);
                }
            }
        }

        logger.info("推荐工作 JobId 批量修复完成，共修复 {} 条记录。", updatedCount);
        return "推荐工作 JobId 批量修复完成，共修复 " + updatedCount + " 条记录。";
    }

    public String fixRecommendedWorkJobIdsByTitleAndCompany() {
        List<RecommendedWork> allRecs = recommendedWorkRepository.findAll();
        int updatedCount = 0;
        int deletedCount = 0;

        for (RecommendedWork rec : allRecs) {
            String currentJobId = rec.getJobId();
            boolean jobExists = false;

            // 先根据 jobId 查找 Job 表
            if (currentJobId != null) {
                Job job = mongoTemplate.findById(currentJobId, Job.class);
                if (job != null) {
                    // jobId 对应的 Job 存在，跳过
                    continue;
                }
            }

            // jobId 不存在或无对应 Job，则根据 jobTitle + companyName 查找最新 Job
            String title = rec.getJobTitle();
            String company = rec.getCompanyName();

            if (title != null && company != null) {
                Query query = new Query();
                query.addCriteria(Criteria.where("jobTitle").is(title)
                        .and("companyName").is(company));
                query.with(Sort.by(Sort.Direction.DESC, "updatedAt"));
                query.limit(1);

                Job newJob = mongoTemplate.findOne(query, Job.class);
                if (newJob != null) {
                    String oldJobId = rec.getJobId();
                    String newJobId = newJob.getJobId();
                    if (!newJobId.equals(oldJobId)) {
                        rec.setJobId(newJobId);
                        recommendedWorkRepository.save(rec);
                        updatedCount++;
                        logger.info("RecommendedWork {} 的 jobId 修复: {} -> {}", rec.getId(), oldJobId, newJobId);
                    }
                    continue;
                }
            }

            // 如果找不到对应的 Job，则删除这条 RecommendedWork
            recommendedWorkRepository.delete(rec);
            deletedCount++;
            logger.info("RecommendedWork {} 因无对应 Job 被删除", rec.getId());
        }

        logger.info("推荐工作 JobId 修复完成，共修复 {} 条记录，删除 {} 条记录。", updatedCount, deletedCount);
        return "推荐工作 JobId 修复完成，共修复 " + updatedCount + " 条记录，删除 " + deletedCount + " 条记录。";
    }


}