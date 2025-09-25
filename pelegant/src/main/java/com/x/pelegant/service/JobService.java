package com.x.pelegant.service;

import com.x.pelegant.entity.Job;
import com.x.pelegant.repository.JobRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class JobService {

    @Autowired
    private JobRepository jobRepository;

    /**
     * 岗位去重：根据职位标题和公司名称分组，保留最新创建时间的岗位，删除其他重复岗位
     */
    public Result<String> deduplicateJobs() {
        try {
            log.info("开始执行岗位去重");

            List<Job> allJobs = jobRepository.findAll();

            if (allJobs.isEmpty()) {
                return Result.success("暂无岗位数据，无需去重");
            }

            // 根据职位标题和公司名称做分组，忽略大小写和前后空格
            Map<DeduplicationKey, List<Job>> groupedJobs = allJobs.stream()
                    .collect(Collectors.groupingBy(job -> new DeduplicationKey(
                            normalize(job.getJobTitle()),
                            normalize(job.getCompanyName())
                    )));

            int deleteCount = 0;
            for (Map.Entry<DeduplicationKey, List<Job>> entry : groupedJobs.entrySet()) {
                List<Job> jobs = entry.getValue();
                if (jobs.size() > 1) {
                    // 按 createdAt 降序排序，保留第一个（最新）
                    jobs.sort((j1, j2) -> {
                        LocalDateTime c1 = parseToLocalDateTime(j1.getCreatedAt());
                        LocalDateTime c2 = parseToLocalDateTime(j2.getCreatedAt());
                        return c2.compareTo(c1);
                    });

                    log.info("重复组：{}，数量：{}", entry.getKey(), jobs.size());

                    for (int i = 1; i < jobs.size(); i++) {
                        Job jobToDelete = jobs.get(i);
                        log.info("删除岗位ID：{}, 职位：{}, 公司：{}", jobToDelete.getId(), jobToDelete.getJobTitle(), jobToDelete.getCompanyName());
                        jobRepository.deleteById(jobToDelete.getId());
                        deleteCount++;
                    }
                }
            }

            log.info("岗位去重完成，删除了 {} 条重复岗位", deleteCount);
            return Result.success("岗位去重完成，删除了 " + deleteCount + " 条重复数据");
        } catch (Exception e) {
            log.error("去重失败", e);
            return Result.fail("去重失败: " + e.getMessage());
        }
    }

    private String normalize(String s) {
        return s == null ? "" : s.trim().toLowerCase();
    }

    /**
     * 尝试将 Object 转换为 LocalDateTime，支持 LocalDateTime、String 类型，失败返回最小时间
     */
    private LocalDateTime parseToLocalDateTime(Object value) {
        if (value instanceof LocalDateTime) {
            return (LocalDateTime) value;
        }
        if (value instanceof String) {
            String str = (String) value;
            List<String> patterns = Arrays.asList(
                    "yyyy-MM-dd HH:mm:ss.SSS",
                    "yyyy-MM-dd HH:mm:ss",
                    "yyyy-MM-dd'T'HH:mm:ss",
                    "yyyy-MM-dd"
            );
            for (String pattern : patterns) {
                try {
                    return LocalDateTime.parse(str, DateTimeFormatter.ofPattern(pattern));
                } catch (DateTimeParseException ignored) {
                }
            }
            log.warn("无法解析时间字符串: {}", str);
            return LocalDateTime.MIN;
        }
        return LocalDateTime.MIN;
    }

    /**
     * 去重键：职位标题 + 公司名称（都小写去空格）
     */
    private static class DeduplicationKey {
        private final String jobTitle;
        private final String companyName;

        public DeduplicationKey(String jobTitle, String companyName) {
            this.jobTitle = jobTitle;
            this.companyName = companyName;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof DeduplicationKey)) return false;
            DeduplicationKey that = (DeduplicationKey) o;
            return Objects.equals(jobTitle, that.jobTitle) &&
                    Objects.equals(companyName, that.companyName);
        }

        @Override
        public int hashCode() {
            return Objects.hash(jobTitle, companyName);
        }

        @Override
        public String toString() {
            return "职位: '" + jobTitle + "', 公司: '" + companyName + "'";
        }
    }

    /**
     * 通用响应封装
     */
    public static class Result<T> {
        private final boolean success;
        private final T data;
        private final String message;

        private Result(boolean success, T data, String message) {
            this.success = success;
            this.data = data;
            this.message = message;
        }

        public static <T> Result<T> success(T data) {
            return new Result<>(true, data, null);
        }

        public static <T> Result<T> fail(String message) {
            return new Result<>(false, null, message);
        }

        public boolean isSuccess() {
            return success;
        }

        public T getData() {
            return data;
        }

        public String getMessage() {
            return message;
        }
    }
}
