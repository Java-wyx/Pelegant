package com.x.pelegant.util;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.temporal.TemporalAdjusters;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class export {
    @Autowired
    private MongoTemplate mongoTemplate;

    private static final String HONG_KONG_REGEX = ".*(?i)(HK|HKSAR|Hong\\s?Kong|HongKong|Hong-Kong|Hong\\s?Kong\\s?SAR|香港|香港特别行政区|香港岛|九龙|新界|旺角|荃湾|沙田|元朗|HKI|KOW|NT|SAR|Remote,\\s?HK|Tsuen\\s?Wan|Sha\\s?Tin|Yuen\\s?Long).*";

    public File exportJobCsvThisMonth() {
        // 检查 job 集合
        long jobCount = mongoTemplate.count(new Query(), "job");
        System.out.println("job 集合文档总数: " + jobCount);
        if (jobCount == 0) {
            System.out.println("job 集合为空，请确认是否已导入数据（如 job.js）");
        } else {
            // 打印样本数据
            List<org.bson.Document> sampleDocs = mongoTemplate.find(
                    new Query().limit(5), org.bson.Document.class, "job"
            );
            System.out.println("job 集合样本数据（前 5 条）：");
            sampleDocs.forEach(doc -> System.out.println("Sample Doc: _id=" + doc.get("_id") + ", createdAt=" + doc.get("createdAt") + ", jobType=" + doc.get("jobType") + ", workLocation=" + doc.get("workLocation")));
            // 打印所有 jobType 值
            List<String> jobTypes = mongoTemplate.findDistinct(new Query(), "jobType", "job", org.bson.Document.class, String.class);
            System.out.println("所有 jobType 值: " + jobTypes);
            // 调试查询：检查匹配 intern/full-time-campus
            long matchingDocs = mongoTemplate.count(
                    new Query(Criteria.where("jobType").regex("(?i)^(intern|full-time-campus)$")),
                    "job"
            );
            System.out.println("匹配 intern/full-time-campus 的文档数: " + matchingDocs);
            // 打印 intern/full-time-campus 的 workLocation
            List<String> workLocations = mongoTemplate.findDistinct(
                    new Query(Criteria.where("jobType").regex("(?i)^(intern|full-time-campus)$")),
                    "workLocation", "job", org.bson.Document.class, String.class
            );
            System.out.println("intern/full-time-campus 的 workLocation 值: " + workLocations);
        }

        // 查询：仅匹配 jobType
        Aggregation aggregation = Aggregation.newAggregation(
                Aggregation.match(
                        Criteria.where("jobType").regex("(?i)^(intern|full-time-campus)$")
                ),
                Aggregation.lookup("company", "companyId", "companyId", "companyDetails"),
                Aggregation.unwind("companyDetails", true),
                Aggregation.project()
                        .and("_id").as("id")
                        .and("jobTitle").as("title")
                        .and("companyName").as("company")
                        .and("workLocation").as("location")
                        .and("jobDescription").as("description")
                        .and("companyDetails.companyDescription").as("company_description")
                        .and("skillsRequired").as("skills")
                        .and("jobType").as("job_type")
                        .and("createdAt").as("createdAt")
        );

        List<org.bson.Document> docs;
        try {
            docs = mongoTemplate.aggregate(aggregation, "job", org.bson.Document.class)
                    .getMappedResults();
        } catch (Exception e) {
            System.err.println("Aggregation failed: " + e.getMessage());
            throw new RuntimeException("Failed to execute MongoDB aggregation", e);
        }

        System.out.println("实习或校招岗位总数: " + docs.size());
        if (docs.isEmpty()) {
            System.out.println("No documents matched the query. Possible reasons:");
            System.out.println("- No jobs with jobType 'intern' or 'full-time-campus' (case-insensitive)");
            System.out.println("- Data not imported into 'job' collection");
            System.out.println("- Invalid companyId or empty 'company' collection");
        } else {
            docs.forEach(doc -> System.out.println("Doc: _id=" + doc.get("_id") + ", createdAt=" + doc.get("createdAt") + ", jobType=" + doc.get("job_type") + ", location=" + doc.get("location")));
        }

        // 过滤香港岗位
        List<org.bson.Document> hkJobs = docs.stream()
                .filter(doc -> {
                    Object locObj = doc.get("location");
                    if (locObj == null) {
                        System.out.println("location is null for doc: " + doc.get("_id"));
                        return false;
                    }
                    if (locObj instanceof List) {
                        List<?> locList = (List<?>) locObj;
                        boolean match = locList.stream()
                                .anyMatch(loc -> loc != null && loc.toString().matches(HONG_KONG_REGEX));
                        if (!match) {
                            System.out.println("List location not match: " + locList + " for doc: " + doc.get("_id"));
                        } else {
                            System.out.println("List location matched: " + locList + " for doc: " + doc.get("_id"));
                        }
                        return match;
                    } else {
                        boolean match = locObj.toString().matches(HONG_KONG_REGEX);
                        if (!match) {
                            System.out.println("String location not match: " + locObj + " for doc: " + doc.get("_id"));
                        } else {
                            System.out.println("String location matched: location=" + locObj + " for doc: " + doc.get("_id"));
                        }
                        return match;
                    }
                })
                .collect(Collectors.toList());

        System.out.println("香港岗位数: " + hkJobs.size());
        if (hkJobs.isEmpty() && !docs.isEmpty()) {
            System.out.println("No jobs matched Hong Kong location filter. Check workLocation values in the data.");
        }

        // 写 CSV
        String[] headers = {"id", "title", "company", "location", "description", "company_description", "skills", "job_type"};
        File directory = new File("/home/ubuntu/project/JobSpy");
        if (!directory.exists()) directory.mkdirs();
        File csvFile = new File(directory, "jobs.csv");

        try (BufferedWriter writer = new BufferedWriter(new FileWriter(csvFile))) {
            writer.write(String.join(",", headers));
            writer.newLine();

            for (org.bson.Document doc : hkJobs) {
                String id = safeCsv(getIdAsString(doc));
                String title = safeCsv(doc.getString("title"));
                String company = safeCsv(doc.getString("company"));
                String location = safeCsv(doc.get("location").toString());
                String description = safeCsv(doc.getString("description"));
                String companyDesc = safeCsv(doc.getString("company_description"));
                String jobType = safeCsv(doc.getString("job_type"));

                Object skillsObj = doc.get("skills");
                String skills = "";
                if (skillsObj instanceof List) {
                    skills = ((List<?>) skillsObj).stream()
                            .map(Object::toString)
                            .collect(Collectors.joining("; "));
                }
                skills = safeCsv(skills);

                writer.write(String.join(",", id, title, company, location, description, companyDesc, skills, jobType));
                writer.newLine();
            }

            System.out.println("导出的香港岗位数: " + hkJobs.size());
        } catch (IOException e) {
            throw new RuntimeException("导出CSV失败", e);
        }

        return csvFile;
    }

    private boolean containsHongKongKeyword(String location, String[] keywords) {
        if (location == null) return false;
        return location.matches(HONG_KONG_REGEX);
    }

    private String getIdAsString(org.bson.Document doc) {
        Object idObj = doc.get("_id");
        if (idObj instanceof org.bson.types.ObjectId) {
            return ((org.bson.types.ObjectId) idObj).toHexString();
        }
        return doc.getString("_id");
    }

    private String safeCsv(String field) {
        if (field == null) return "";
        if (field.contains(",") || field.contains("\"") || field.contains("\n")) {
            field = field.replace("\"", "\"\"");
            return "\"" + field + "\"";
        }
        return field;
    }
}