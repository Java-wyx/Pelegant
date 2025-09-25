package com.x.pelegant.service;

import com.x.pelegant.common.Result;
import com.x.pelegant.entity.RecommendedWork;
import com.x.pelegant.entity.Job;
import com.x.pelegant.entity.Company;
import com.x.pelegant.entity.Student;
import com.x.pelegant.repository.RecommendedWorkRepository;
import com.x.pelegant.repository.JobRepository;
import com.x.pelegant.repository.CompanyRepository;
import com.x.pelegant.repository.StudentRepository;
import com.x.pelegant.dto.RecommendedJobResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * 推荐工作服务类
 */
@Service
@Slf4j
public class RecommendedWorkService {

    @Autowired
    private RecommendedWorkRepository recommendedWorkRepository;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private StudentRepository studentRepository;

    private static final String HONG_KONG_REGEX = "^(HK|香港|Hong\\s?Kong|HongKong|HKSAR|Hong\\s?Kong\\s?SAR|HK\\s?SAR|香港特别行政区|香港岛|Hong\\s?Kong,\\s?Hong\\s?Kong\\s?SAR|[A-Za-z\\s&]+,\\s?HK|[A-Za-z\\s&]+,\\s?Hong\\s?Kong\\s?SAR|Remote,\\s?HK|[A-Za-z\\s&]+,\\s?Hong\\s?Kong)$";
    private static final Pattern HONG_KONG_PATTERN = Pattern.compile(HONG_KONG_REGEX, Pattern.CASE_INSENSITIVE);

    /**
     * 获取学生的推荐工作列表
     */
    public Result<List<RecommendedJobResponse>> getRecommendedJobs(String studentId) {
        try {
            log.info("获取学生推荐工作列表: studentId={}", studentId);

            Optional<Student> studentOpt = studentRepository.findById(studentId);
            if (!studentOpt.isPresent()) {
                return Result.fail("学生信息不存在");
            }

            Student student = studentOpt.get();

            // 获取学生已申请的职位ID列表
            List<String> appliedJobIds = student.getAppliedJobs();
            Set<String> appliedJobIdSet = appliedJobIds != null ?
                    new HashSet<>(appliedJobIds) : new HashSet<>();

            log.info("学生已申请的工作数量: {}", appliedJobIdSet.size());
            log.info("学生已申请的工作ID: {}", appliedJobIdSet);

            List<RecommendedWork> recommendations = recommendedWorkRepository.findByStudentId(studentId);
            log.info("找到 {} 个推荐工作记录", recommendations.size());

            if (recommendations.isEmpty()) {
                return Result.success(Collections.emptyList(), "暂无推荐数据");
            }

            // 收集 jobId 批量查询
            Set<String> jobIdSet = new HashSet<>();
            for (RecommendedWork rec : recommendations) {
                if (rec.getJobKey() != null) {
                    jobIdSet.add(rec.getJobKey());
                    log.debug("推荐记录 {} 包含 jobId: {}", rec.getId(), rec.getJobKey());
                }
            }

            log.info("需要查询的 jobId 数量: {}", jobIdSet.size());
            log.info("jobId 列表: {}", jobIdSet);

            List<Job> jobs = jobRepository.findByIdIn(new ArrayList<>(jobIdSet));
            log.info("查询到的 Job 记录数量: {}", jobs.size());

            // 记录找到的 jobId
            for (Job job : jobs) {
                log.debug("找到 Job: {}", job.getId());
            }

            // 从 Job 中收集 companyId 批量查询
            Set<String> companyIdSet = new HashSet<>();
            for (Job job : jobs) {
                if (job.getCompanyId() != null) {
                    companyIdSet.add(job.getCompanyId());
                    log.debug("Job {} 包含 companyId: {}", job.getId(), job.getCompanyId());
                }
            }

            log.info("需要查询的 companyId 数量: {}", companyIdSet.size());
            log.info("companyId 列表: {}", companyIdSet);

            List<Company> companies = companyRepository.findByCompanyIdIn(new ArrayList<>(companyIdSet));
            log.info("查询到的 Company 记录数量: {}", companies.size());

            // 记录找到的 companyId
            for (Company company : companies) {
                log.debug("找到 Company: {}", company.getCompanyId());
            }

            Map<String, Job> jobMap = jobs.stream().collect(Collectors.toMap(Job::getId, j -> j));
            Map<String, Company> companyMap = companies.stream().collect(Collectors.toMap(Company::getCompanyId, c -> c));

            // 如果Company查询返回空，尝试使用推荐记录中的companyId作为备用
            if (companies.isEmpty() && !companyIdSet.isEmpty()) {
                log.warn("批量查询Company失败，尝试使用推荐记录中的companyId作为备用");

                // 收集推荐记录中的companyId
                Set<String> recommendedCompanyIds = new HashSet<>();
                for (RecommendedWork rec : recommendations) {
                    if (rec.getCompanyId() != null) {
                        recommendedCompanyIds.add(rec.getCompanyId());
                    }
                }

                if (!recommendedCompanyIds.isEmpty()) {
                    List<Company> backupCompanies = companyRepository.findByCompanyIdIn(new ArrayList<>(recommendedCompanyIds));
                    log.info("备用查询到的 Company 记录数量: {}", backupCompanies.size());

                    for (Company company : backupCompanies) {
                        companyMap.put(company.getCompanyId(), company);
                        log.debug("找到备用 Company: {}", company.getCompanyId());
                    }
                }
            }

            // 分组：新推荐（history=false）和历史推荐（history != false）
            List<RecommendedWork> newRecommendations = new ArrayList<>();
            List<RecommendedWork> historyRecommendations = new ArrayList<>();
            for (RecommendedWork rec : recommendations) {
                if ("false".equalsIgnoreCase(rec.getHistory())) {
                    newRecommendations.add(rec);
                } else {
                    historyRecommendations.add(rec);
                }
            }

            // 历史推荐按时间从近到远排序
            historyRecommendations.sort((o1, o2) -> {
                if (o1.getInsertTime() == null) return 1;
                if (o2.getInsertTime() == null) return -1;
                LocalDateTime t1 = LocalDateTime.parse(o1.getInsertTime(), DateTimeFormatter.ISO_LOCAL_DATE_TIME);
                LocalDateTime t2 = LocalDateTime.parse(o2.getInsertTime(), DateTimeFormatter.ISO_LOCAL_DATE_TIME);
                return t2.compareTo(t1); // 越近的在前
            });

            // 合并新推荐和历史推荐
            List<RecommendedWork> targetRecommendations = new ArrayList<>();
            targetRecommendations.addAll(newRecommendations);
            targetRecommendations.addAll(historyRecommendations);

            List<RecommendedJobResponse> responseList = new ArrayList<>();
            LocalDateTime now = LocalDateTime.now();

            for (RecommendedWork rec : targetRecommendations) {
                RecommendedJobResponse response = new RecommendedJobResponse();


                Job job = jobMap.get(rec.getJobKey());
                Company company = null;

                // 检查是否已申请此工作
                boolean isApplied = appliedJobIdSet.contains(rec.getJobKey());
                if (isApplied) {
                    log.debug("跳过已申请的工作: jobId={}", rec.getJobKey());
                    continue; // 跳过已申请的工作
                }

                if (job != null) {
                    // 首先尝试使用Job中的companyId查询Company
                    company = companyMap.get(job.getCompanyId());

                    // 如果找不到，尝试使用推荐记录中的companyId作为备用
                    if (company == null && rec.getCompanyId() != null) {
                        company = companyMap.get(rec.getCompanyId());
                        if (company != null) {
                            log.debug("使用推荐记录中的companyId找到Company: {}", rec.getCompanyId());
                        }
                    }

                    // 香港地区正则过滤
                    String location = job.getWorkLocation();
                    if (location == null || !HONG_KONG_PATTERN.matcher(location.trim()).matches()) {
                        log.debug("跳过不符合香港地区要求的 Job: {}", job.getId());
                        continue;
                    }

                    // deadline 过滤
                    if (job.getDeadline() != null && job.getDeadline().isBefore(now)) {
                        log.debug("跳过已过期的 Job: {}", job.getId());
                        continue;
                    }

                }

                // 记录处理情况
                if (job == null) {
                    log.debug("推荐记录 {} 的 jobId {} 未找到对应 Job", rec.getId(), job.getId());
                } else if (company == null) {
                    log.debug("Job {} 的 companyId {} 未找到对应 Company", job.getId(), job.getCompanyId());
                }

                if (job == null || company == null) {
                    continue;
                } else {
                    // 正常情况：job和company都存在
                    response.setRecommendationId(job.getId());
                    response.setJobId(job.getJobId());
                    response.setJobTitle(job.getJobTitle());
                    response.setCompanyName(company.getCompanyName());
                    response.setCompanyId(company.getCompanyId());
                    response.setLocation(job.getWorkLocation());

                    String salaryRange = (job.getMinSalary() != null && job.getMaxSalary() != null)
                            ? job.getMinSalary() + "-" + job.getMaxSalary() + " " + job.getSalaryUnit()
                            : "";
                    response.setSalaryRange(salaryRange);

                    response.setEmploymentType(job.getJobType());
                    response.setJobDescription(job.getJobDescription());

                    String skillsRequired = (job.getSkillsRequired() != null && !job.getSkillsRequired().isEmpty())
                            ? String.join(", ", job.getSkillsRequired())
                            : "";
                    response.setSkillsRequired(skillsRequired);

                    response.setExperienceLevel(job.getExperienceRequired());
                    response.setEducationLevel(job.getEducationRequired());
                    response.setJobStatus(job.getStatus());
                    response.setLogoImage(company.getLogoImage());
                    response.setIsSaved(false);
                    response.setIsApplied(false); // 设置为false，因为我们已经过滤了已申请的工作
                }

                responseList.add(response);
            }

            log.info("成功构建 {} 个推荐工作响应", responseList.size());
            return Result.success(responseList, "获取推荐工作列表成功");

        } catch (Exception e) {
            log.error("获取推荐工作列表失败", e);
            return Result.fail("获取推荐工作列表失败: " + e.getMessage());
        }
    }
    /**
     * 获取推荐工作统计
     */
    public Result<Long> getRecommendedWorkCount(String studentId) {
        try {
            long count = recommendedWorkRepository.countByStudentId(studentId);
            return Result.success(count, "获取推荐工作统计成功");
        } catch (Exception e) {
            log.error("获取推荐工作统计失败", e);
            return Result.fail("获取推荐工作统计失败: " + e.getMessage());
        }
    }



    private Optional<Company> resolveCompany(RecommendedWork recommendation) {
        if (recommendation.getCompanyId() != null && !recommendation.getCompanyId().isEmpty()) {
            return companyRepository.findByCompanyId(recommendation.getCompanyId());
        }

        String rawName = recommendation.getCompanyName().trim();
        String lowerName = rawName.toLowerCase();

        Optional<Company> companyOpt = companyRepository.findByCompanyName(rawName);
        if (companyOpt.isPresent()) return companyOpt;

        companyOpt = companyRepository.findByCompanyNameLower(lowerName);
        if (companyOpt.isPresent()) return companyOpt;

        if (lowerName.length() >= 3) {
            String prefix = lowerName.substring(0, 3);
            companyOpt = companyRepository.findFirstByCompanyNameLowerStartingWithIgnoreCase(prefix);
            if (companyOpt.isPresent()) return companyOpt;
        }

        log.warn("无法匹配公司: {}", rawName);
        return Optional.empty();
    }

    private Optional<Job> resolveJob(RecommendedWork recommendation, Optional<Company> companyOpt) {
        if (recommendation.getJobId() != null && !recommendation.getJobId().isEmpty()) {
            return jobRepository.findByJobId(recommendation.getJobId());
        }

        String jobTitle = recommendation.getJobTitle();
        if (companyOpt.isPresent()) {
            return jobRepository.findFirstByCompanyIdAndJobTitleIgnoreCase(
                    companyOpt.get().getCompanyId(), jobTitle);
        }

        return jobRepository.findByCompanyNameAndJobTitle(
                recommendation.getCompanyName(), jobTitle);
    }

}
