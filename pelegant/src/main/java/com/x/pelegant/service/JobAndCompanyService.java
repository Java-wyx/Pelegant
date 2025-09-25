package com.x.pelegant.service;

import com.x.pelegant.dto.JobWithCompanyDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;
import org.springframework.data.mongodb.core.aggregation.UnwindOperation;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Service;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;
import java.util.HashMap;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class JobAndCompanyService {
    @Autowired
    private MongoTemplate mongoTemplate;

    private static final String HONG_KONG_REGEX = "^(HK|香港|Hong\\s?Kong|HongKong|HKSAR|Hong\\s?Kong\\s?SAR|HK\\s?SAR|香港特别行政区|香港岛|Hong\\s?Kong,\\s?Hong\\s?Kong\\s?SAR|[A-Za-z\\s&]+,\\s?HK|[A-Za-z\\s&]+,\\s?Hong\\s?Kong\\s?SAR|Remote,\\s?HK|[A-Za-z\\s&]+,\\s?Hong\\s?Kong)$";

    public HashMap<String, Object> getAllJobAndCompany() {
        UnwindOperation unwind = Aggregation.unwind("companyDetails", true);

        Aggregation aggregation = Aggregation.newAggregation(
                Aggregation.lookup(
                        "company", "companyId", "companyId", "companyDetails"
                ),
                unwind,
                Aggregation.project()
                        .and("_id").as("id")
                        .and("jobId").as("jobId")
                        .and("jobTitle").as("jobTitle")
                        .and("jobDescription").as("jobDescription")
                        .and("jobRequirements").as("jobRequirements")
                        .and("jobType").as("jobType")
                        .and("workLocation").as("workLocation")
                        .and("minSalary").as("minSalary")
                        .and("maxSalary").as("maxSalary")
                        .and("salaryUnit").as("salaryUnit")
                        .and("experienceRequired").as("experienceRequired")
                        .and("educationRequired").as("educationRequired")
                        .and("skillsRequired").as("skillsRequired")
                        .and("benefits").as("benefits")
                        .and("companyId").as("companyId")
                        .and("companyName").as("companyName")
                        .and("companyDetails.companyType").as("companyType")
                        .and("companyDetails.companySize").as("companySize")
                        .and("companyDetails.industry").as("industry")
                        .and("companyDetails.companyAddress").as("companyAddress")
                        .and("companyDetails.companyWebsite").as("companyWebsite")
                        .and("companyDetails.companyDescription").as("companyDescription")
                        .and("companyDetails.contactPhone").as("contactPhone")
                        .and("companyDetails.contactPerson").as("contactPerson")
                        .and("companyDetails.contactEmail").as("contactEmail")
                        .and("status").as("status")
                        .and("createdAt").as("createdAt")
                        .and("updatedAt").as("updatedAt")
                        .and("deadline").as("deadline")
        );

        AggregationResults<JobWithCompanyDTO> results = mongoTemplate.aggregate(
                aggregation, "job", JobWithCompanyDTO.class
        );
        HashMap<String, Object> result = new HashMap<>();
        result.put("total", results.getMappedResults().size());
        result.put("data", results.getMappedResults());

        return result;
    }

    public File exportJobCsvThisMonth() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfMonth = now.withDayOfMonth(1).with(LocalTime.MIN);
        LocalDateTime endOfMonth = now.with(TemporalAdjusters.lastDayOfMonth()).with(LocalTime.MAX);

        // 添加 job_type 过滤条件
        Aggregation aggregation = Aggregation.newAggregation(
                Aggregation.match(Criteria.where("createdAt").gte(startOfMonth).lte(endOfMonth)
                        .and("jobType").in("intern", "full-time-campus")
                        .and("workLocation").regex(HONG_KONG_REGEX, "i")),
                Aggregation.lookup(
                        "company", "companyId", "companyId", "companyDetails"
                ),
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
        );

        AggregationResults<org.bson.Document> results =
                mongoTemplate.aggregate(aggregation, "job", org.bson.Document.class);

        List<org.bson.Document> docs = results.getMappedResults();

        // 添加 job_type 到 CSV 头
        String[] headers = {"id", "title", "company", "location", "description", "company_description", "skills", "job_type"};

        File directory = new File("/home/ubuntu/project/JobSpy");
        if (!directory.exists()) {
            directory.mkdirs();
        }

        File csvFile = new File(directory, "jobs.csv");

        try (BufferedWriter writer = new BufferedWriter(new FileWriter(csvFile))) {
            writer.write(String.join(",", headers));
            writer.newLine();

            for (org.bson.Document doc : docs) {
                String id = safeCsv(getIdAsString(doc)); // 使用 getIdAsString 来处理 _id 字段
                String title = safeCsv(doc.getString("title"));
                String company = safeCsv(doc.getString("company"));
                String location = safeCsv(doc.getString("location"));
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
            System.out.println("导出的记录数: " + docs.size());
            System.out.println("Current working directory: " + System.getProperty("user.dir"));

        } catch (IOException e) {
            throw new RuntimeException("导出CSV失败", e);
        }

        return csvFile;
    }

    private String getIdAsString(org.bson.Document doc) {
        Object idObj = doc.get("_id");
        if (idObj instanceof org.bson.types.ObjectId) {
            return ((org.bson.types.ObjectId) idObj).toHexString(); // 如果是 ObjectId，转换为字符串
        }
        return doc.getString("_id"); // 否则直接返回字符串类型的 _id
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