package com.x.pelegant.util;

import org.bson.Document;
import org.bson.types.ObjectId;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

@Component
public class Deduplicate {

    private static final Logger logger = LoggerFactory.getLogger(Deduplicate.class);

    @Autowired
    private MongoTemplate mongoTemplate;

    /**
     * 一键删除 job 和 passjob 的重复数据
     */
    public String cleanupJobAndPassJob() {
        String jobResult = removeDuplicatesOptimized("job");
        String passJobResult = removeDuplicatesOptimized("passjob");
        return jobResult + "\n" + passJobResult;
    }

    /**
     * 优化版：根据 jobTitle、companyId、jobDescription、jobType、createdAt 删除重复数据
     */
    private String removeDuplicatesOptimized(String collectionName) {
        // 聚合生成去重键
        List<Map> duplicates = mongoTemplate.getCollection(collectionName)
                .aggregate(Arrays.asList(
                        new Document("$project", new Document("key", new Document()
                                .append("jobTitle", new Document("$replaceAll", new Document()
                                        .append("input", "$jobTitle")
                                        .append("find", " ")
                                        .append("replacement", "")))
                                .append("companyId", "$companyId")
                                .append("jobDescription", new Document("$replaceAll", new Document()
                                        .append("input", "$jobDescription")
                                        .append("find", " ")
                                        .append("replacement", "")))
                                .append("jobType", "$jobType")
                                .append("createdAt", "$createdAt"))),
                        new Document("$group", new Document("_id", "$key")
                                .append("ids", new Document("$push", "$_id"))
                                .append("count", new Document("$sum", 1))),
                        new Document("$match", new Document("count", new Document("$gt", 1)))
                ), Map.class)
                .into(new ArrayList<>());

        int totalDeleted = 0;

        // 每组重复数据只保留第一条，其余删除
        for (Map group : duplicates) {
            List<ObjectId> ids = (List<ObjectId>) group.get("ids");
            if (ids.size() > 1) {
                List<ObjectId> idsToDelete = ids.subList(1, ids.size());
                Query query = new Query(Criteria.where("_id").in(idsToDelete));
                long deleted = mongoTemplate.remove(query, collectionName).getDeletedCount();
                totalDeleted += deleted;
            }
        }

        logger.info("已删除 {} 表中重复数据 {} 条", collectionName, totalDeleted);
        return "已删除 " + collectionName + " 表中重复数据 " + totalDeleted + " 条";
    }
}