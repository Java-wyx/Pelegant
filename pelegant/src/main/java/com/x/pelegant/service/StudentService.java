/*
 * @Author: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @Date: 2025-07-02 20:29:27
 * @LastEditors: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @LastEditTime: 2025-07-08 17:59:52
 * @FilePath: \新建文件夹\Pelegant\src\main\java\com\x\pelegant\service\StudentService.java
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
package com.x.pelegant.service;

import com.mongodb.client.MongoDatabase;
import com.x.pelegant.common.Result;
import com.x.pelegant.entity.*;
import com.x.pelegant.repository.*;
import com.x.pelegant.dto.StudentProfileUpdateRequest;
import com.x.pelegant.dto.LoginResponse;
import com.x.pelegant.dto.JobSearchResponse;
import com.x.pelegant.util.JwtUtil;
import com.x.pelegant.config.JwtConfig;

import com.x.pelegant.util.PasswordUtil;
import lombok.extern.slf4j.Slf4j;
import org.bson.Document;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;

import javax.annotation.PostConstruct;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.Optional;
import java.util.concurrent.TimeUnit;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * 学生服务类
 */
@Service
@Slf4j
public class StudentService {

    @Autowired
    private MongoTemplate mongoTemplate;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private StudentActivityRepository activityRepository;

    @Autowired
    private JobRepository jobRepository;
    @Autowired
    private SchoolRepository schoolRepository;

    @Autowired
    private RecommendedWorkRepository recommendedWorkRepository;

    private static final String RESET_KEY_PREFIX = "student_reset_token:";
    @Autowired
    private StringRedisTemplate redisTemplate;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private JwtConfig jwtConfig;

    @Autowired
    private CozeAIService cozeAIService;

    @Autowired
    private EmailServices emailServices;

    @Value("${pelegant.upload.path}")
    private String uploadPath;

    // 简历文件存储路径
    private String RESUME_UPLOAD_PATH;

    // 头像文件存储路径
    private String AVATAR_UPLOAD_PATH;

    // 简历api路径，/api/files和文件名之间的部分。
    private String RESUME_API_PATH = "/uploads/resumes/";

    // 头像api路径，/api/files和文件名之间的部分。
    private String AVATAR_API_PATH = "/uploads/avatars/";

    // 定义正则表达式常量
    private static final String HONG_KONG_REGEX = "^(HK|香港|Hong\\s?Kong|HongKong|HKSAR|Hong\\s?Kong\\s?SAR|HK\\s?SAR|香港特别行政区|香港岛|Hong\\s?Kong,\\s?Hong\\s?Kong\\s?SAR|[A-Za-z\\s&]+,\\s?HK|[A-Za-z\\s&]+,\\s?Hong\\s?Kong\\s?SAR|Remote,\\s?HK|[A-Za-z\\s&]+,\\s?Hong\\s?Kong)$";

    @Autowired
    private CompanyRepository companyRepository;

    @PostConstruct
    public void init() {
        RESUME_UPLOAD_PATH = uploadPath + "resumes/";
        AVATAR_UPLOAD_PATH = uploadPath + "avatars/";
        log.info("Upload Path: {}", uploadPath);
        log.info("Resume Upload Path: {}", RESUME_UPLOAD_PATH);
        log.info("Avatar Upload Path: {}", AVATAR_UPLOAD_PATH);
    }

    /**
     * 学生登录验证
     */
    public Result<LoginResponse> login(String email, String password) {
        try {
            log.info("学生登录尝试: {}", email);

            // 根据邮箱查找学生
            Optional<Student> studentOpt = studentRepository.findByEmail(email);
            String storedHash = studentOpt.get().getPassword();
            boolean result = PasswordUtil.checkPassword(password, storedHash);

            if (studentOpt.isPresent()) {
                Student student = studentOpt.get();
                // 验证密码
                if (result) {
                    // 生成JWT Token
                    String token = jwtUtil.generateToken(
                            student.getId(),
                            student.getFullName(),
                            JwtConfig.UserRole.STUDENT.getValue());

                    // 计算过期时间
                    long expiresAt = System.currentTimeMillis() + jwtConfig.getExpiration();

                    // 创建登录响应
                    student.setPassword(null); // 不返回密码
                    LoginResponse loginResponse = new LoginResponse(
                            token,
                            student.getId(),
                            student.getFullName(),
                            JwtConfig.UserRole.STUDENT.getValue(),
                            expiresAt,
                            student,
                            student.getIsFirstLogin(),
                            student.getHasChangedPassword(),
                            student.getHasCompletedProfile());


                    StudentActivity activity = new StudentActivity();
                    activity.setStudentId(student.getStudentId());
                    activity.setActivityType("login");
                    activity.setCreatedAt(LocalDateTime.now());
                    activityRepository.save(activity);

                    log.info("学生登录成功: {} - {}", student.getFullName(), student.getStudentId());
                    return Result.success(loginResponse, "登录成功");
                } else {
                    log.warn("学生登录失败: {} - 密码错误", email);
                    return Result.fail("密码错误");
                }
            } else {
                log.warn("学生登录失败: {} - 邮箱不存在", email);
                return Result.fail("邮箱不存在");
            }
        } catch (Exception e) {
            log.error("学生登录过程中发生错误", e);
            return Result.fail("登录失败: " + e.getMessage());
        }
    }

    /**
     * 学生上传简历
     */
    public Result<Map<String, String>> uploadResume(String studentId, MultipartFile file) {
        try {
            log.info("学生上传简历: 学生ID={}, 文件名={}", studentId, file.getOriginalFilename());

            // 数据验证
            if (studentId == null || studentId.trim().isEmpty()) {
                return Result.fail("学生ID不能为空");
            }

            // 验证学生是否存在
            Optional<Student> studentOpt = studentRepository.findById(studentId);
            if (!studentOpt.isPresent()) {
                return Result.fail("学生不存在");
            }

            Student student = studentOpt.get();

            // 验证账户状态
            if ("inactive".equals(student.getStatus())) {
                return Result.fail("账户已被禁用，无法上传简历");
            }

            // 验证文件
            if (file.isEmpty()) {
                return Result.fail("请选择要上传的简历文件");
            }

            String originalFilename = file.getOriginalFilename();
            if (originalFilename == null || !originalFilename.toLowerCase().endsWith(".pdf")) {
                return Result.fail("只支持PDF格式的简历文件");
            }

            // 验证文件大小（最大10MB）
            if (file.getSize() > 10 * 1024 * 1024) {
                return Result.fail("简历文件大小不能超过10MB");
            }

            // 构建学生目录路径
            Path studentDir = Paths.get(RESUME_UPLOAD_PATH, studentId);
            if (!Files.exists(studentDir)) {
                Files.createDirectories(studentDir);
            }

            // 删除旧简历文件（如有）
            if (student.getResumePath() != null && !student.getResumePath().isEmpty()) {
                deleteOldResumeFile(student.getResumePath());
            }

            // 构建文件完整路径（保留原始文件名）
            Path filePath = studentDir.resolve(originalFilename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            log.info("文件保存成功，路径: {}", filePath);

            // 构建简历API访问路径（用于前端访问）
            String fileUrl = RESUME_API_PATH + studentId + "/" + originalFilename;
            student.setResumePath(fileUrl);
            studentRepository.save(student);

            // 异步调用Coze AI解析简历
            try {
                log.info("开始调用Coze AI解析简历: 学生ID={}", studentId);
                cozeAIService.parseResume(studentId, fileUrl);
            } catch (Exception e) {
                log.warn("简历解析调用失败，但不影响上传结果: 学生ID={}, 错误={}", studentId, e.getMessage());
            }

            log.info("简历上传成功: 学生ID={}, 文件路径={}", studentId, fileUrl);
            Map<String, String> result = new HashMap<>();
            result.put("fileUrl", fileUrl);
            result.put("message", "简历上传成功，AI解析中");
            result.put("aiStatus", "pending");

            return Result.success(result);

        } catch (IOException e) {
            log.error("简历上传失败: 学生ID={}", studentId, e);
            return Result.fail("文件上传失败: " + e.getMessage());
        } catch (Exception e) {
            log.error("简历上传过程中发生错误: 学生ID={}", studentId, e);
            return Result.fail("上传失败: " + e.getMessage());
        }
    }

    /**
     * 更新学生简历（替换现有简历）
     */
    public Result<Map<String, String>> updateResume(String studentId, MultipartFile file) {
        try {
            log.info("学生更新简历: 学生ID={}, 文件名={}", studentId, file.getOriginalFilename());

            // 调用相同的上传逻辑，会自动替换旧简历
            return uploadResume(studentId, file);

        } catch (Exception e) {
            log.error("更新简历失败: 学生ID={}", studentId, e);
            return Result.fail("更新简历失败: " + e.getMessage());
        }
    }

    /**
     * 获取学生简历信息
     */
    public Result<Map<String, Object>> getStudentResume(String studentId) {
        try {
            log.info("获取学生简历信息: 学生ID={}", studentId);

            // 数据验证
            if (studentId == null || studentId.trim().isEmpty()) {
                return Result.fail("学生ID不能为空");
            }

            // 验证学生是否存在
            Optional<Student> studentOpt = studentRepository.findById(studentId);
            if (!studentOpt.isPresent()) {
                return Result.fail("学生不存在");
            }

            Student student = studentOpt.get();

            Map<String, Object> resumeInfo = new HashMap<>();
            resumeInfo.put("hasResume", student.getResumePath() != null && !student.getResumePath().isEmpty());
            resumeInfo.put("resumePath", "/api/files" + student.getResumePath());

            if (student.getResumePath() != null && !student.getResumePath().isEmpty()) {
                // 检查文件是否存在
                String fileName = student.getResumePath().substring(RESUME_API_PATH.length());
                Path filePath = Paths.get(RESUME_UPLOAD_PATH + fileName);
                boolean fileExists = Files.exists(filePath);

                resumeInfo.put("fileExists", fileExists);

                if (fileExists) {
                    try {
                        resumeInfo.put("fileSize", Files.size(filePath));
                        resumeInfo.put("lastModified", Files.getLastModifiedTime(filePath).toString());
                    } catch (IOException e) {
                        log.warn("获取简历文件信息失败: {}", e.getMessage());
                    }
                } else {
                    log.warn("简历文件不存在: {}", filePath.toAbsolutePath());
                }
            } else {
                resumeInfo.put("fileExists", false);
            }

            resumeInfo.put("studentName", student.getFullName());
            resumeInfo.put("major", student.getMajor());

            // 获取简历解析数据
            try {
                Optional<ResumeData> resumeDataOpt = cozeAIService.getResumeData(studentId);
                if (resumeDataOpt.isPresent()) {
                    ResumeData resumeData = resumeDataOpt.get();
                    resumeInfo.put("parseStatus", resumeData.getParseStatus());
                    resumeInfo.put("parseError", resumeData.getErrorMessage());

                    if ("success".equals(resumeData.getParseStatus())) {
                        // 添加解析后的数据
                        resumeInfo.put("parsedData", resumeData.getData());
                        resumeInfo.put("name", resumeData.getName());
                        resumeInfo.put("email", resumeData.getEmail());
                        resumeInfo.put("gender", resumeData.getGender());
                        resumeInfo.put("mobile", resumeData.getMobile());
                        resumeInfo.put("awardList", resumeData.getAwardList());
                        resumeInfo.put("educationList", resumeData.getEducationList());
                        resumeInfo.put("workExperienceList", resumeData.getWorkExperienceList());
                        resumeInfo.put("projectList", resumeData.getProjectList());
                        resumeInfo.put("skillList", resumeData.getSkillList());
                        resumeInfo.put("selfEvaluation", resumeData.getSelfEvaluation());
                    }
                } else {
                    resumeInfo.put("parseStatus", "not_parsed");
                }
            } catch (Exception e) {
                log.warn("获取简历解析数据失败: 学生ID={}, 错误={}", studentId, e.getMessage());
                resumeInfo.put("parseStatus", "error");
                resumeInfo.put("parseError", e.getMessage());
            }

            log.info("获取简历信息成功: 学生ID={}, 有简历={}", studentId, resumeInfo.get("hasResume"));
            return Result.success(resumeInfo, "简历信息获取成功");

        } catch (Exception e) {
            log.error("获取简历信息失败: 学生ID={}", studentId, e);
            return Result.fail("获取简历信息失败: " + e.getMessage());
        }
    }

    /**
     * 删除旧简历文件
     */
    private void deleteOldResumeFile(String resumePath) {
        try {
            // resumePath 是 /api/resumes/20240001/简历.pdf，需要去掉前缀
            if (resumePath.startsWith(RESUME_API_PATH)) {
                String relativePath = resumePath.substring(RESUME_API_PATH.length()); // 得到 20240001/简历.pdf
                Path oldFilePath = Paths.get(RESUME_UPLOAD_PATH, relativePath); // 拼成绝对路径
                if (Files.exists(oldFilePath)) {
                    Files.delete(oldFilePath);
                    log.info("已删除旧简历文件: {}", oldFilePath);
                } else {
                    log.warn("旧简历文件不存在: {}", oldFilePath);
                }
            } else {
                log.warn("简历路径不以 RESUME_API_PATH 开头: {}", resumePath);
            }
        } catch (Exception e) {
            log.warn("删除旧简历文件失败: {}", resumePath, e);
        }
    }


    /**
     * 修改学生个人信息
     */
    public Result<Student> updateProfile(String studentId, StudentProfileUpdateRequest request) {
        try {
            log.info("学生修改个人信息: ID={}", studentId);

            // 数据验证
            if (studentId == null || studentId.trim().isEmpty()) {
                return Result.fail("学生ID不能为空");
            }

            // 查找学生
            Optional<Student> studentOpt = studentRepository.findById(studentId);
            if (!studentOpt.isPresent()) {
                return Result.fail("学生不存在");
            }

            Student student = studentOpt.get();

            // 如果修改邮箱，检查邮箱是否已被其他学生使用
            if (request.getEmail() != null && !request.getEmail().trim().isEmpty() &&
                    !request.getEmail().equals(student.getEmail())) {
                Optional<Student> existingStudent = studentRepository.findByEmail(request.getEmail());
                if (existingStudent.isPresent() && !existingStudent.get().getId().equals(studentId)) {
                    return Result.fail("邮箱已被其他学生使用");
                }
                student.setEmail(request.getEmail().trim());
            }

            // 昵称允许重复，不再校验唯一性
            if (request.getNickname() != null && !request.getNickname().trim().isEmpty()) {
                student.setNickname(request.getNickname().trim());
            }

            // 更新基本信息
            if (request.getFullName() != null && !request.getFullName().trim().isEmpty()) {
                student.setFullName(request.getFullName().trim());
            }
            if (request.getMajor() != null && !request.getMajor().trim().isEmpty()) {
                student.setMajor(request.getMajor().trim());
            }
            if (request.getEnrollmentYear() != null) {
                student.setEnrollmentYear(request.getEnrollmentYear());
            }
            if (request.getSchoolId() != null && !request.getSchoolId().trim().isEmpty()) {
                student.setSchoolId(request.getSchoolId().trim());
            }

            // 更新新增字段
            if (request.getGender() != null && !request.getGender().trim().isEmpty()) {
                if (isValidGender(request.getGender())) {
                    student.setGender(request.getGender());
                } else {
                    return Result.fail("性别值无效，支持的值：Male（男性）、Female（女性）、Other（其他）");
                }
            }
            if (request.getBio() != null) {
                if (request.getBio().length() > 500) {
                    return Result.fail("个人简介不能超过500字符");
                }
                student.setBio(request.getBio().trim());
            }
            if (request.getStatus() != null && !request.getStatus().trim().isEmpty()) {
                if (isValidStatus(request.getStatus())) {
                    student.setStatus(request.getStatus());
                } else {
                    return Result.fail("状态值无效，支持的值：active（活跃）、inactive（非活跃）");
                }
            }

            // 保存更新
            Student updatedStudent = studentRepository.save(student);
            updatedStudent.setPassword(null); // 不返回密码

            log.info("学生信息更新成功: {} (ID: {})", updatedStudent.getFullName(), studentId);
            return Result.success(updatedStudent, "信息更新成功");

        } catch (Exception e) {
            log.error("更新学生信息失败: 学生ID={}", studentId, e);
            return Result.fail("更新失败: " + e.getMessage());
        }
    }


    /**
     * 验证性别值是否有效
     */
    private boolean isValidGender(String gender) {
        return "Male".equals(gender) || "Female".equals(gender) || "Other".equals(gender);
    }

    /**
     * 验证状态值是否有效
     */
    private boolean isValidStatus(String status) {
        return "active".equals(status) || "inactive".equals(status);
    }

    /**
     * 学生上传头像
     */
    public Result<String> uploadAvatar(String studentId, MultipartFile file) {
        try {
            log.info("学生上传头像: 学生ID={}, 文件名={}", studentId, file.getOriginalFilename());

            // 数据验证
            if (studentId == null || studentId.trim().isEmpty()) {
                return Result.fail("学生ID不能为空");
            }

            // 验证学生是否存在
            Optional<Student> studentOpt = studentRepository.findById(studentId);
            if (!studentOpt.isPresent()) {
                return Result.fail("学生不存在");
            }

            Student student = studentOpt.get();

            // 验证账户状态
            if ("inactive".equals(student.getStatus())) {
                return Result.fail("账户已被禁用，无法上传头像");
            }

            // 验证文件
            if (file.isEmpty()) {
                return Result.fail("请选择要上传的头像文件");
            }

            String originalFilename = file.getOriginalFilename();
            if (originalFilename == null) {
                return Result.fail("文件名无效");
            }

            // 验证文件类型
            String fileExtension = getFileExtension(originalFilename);
            if (!isValidImageFormat(fileExtension)) {
                return Result.fail("只支持 JPG、JPEG、PNG、GIF 格式的图片文件");
            }

            // 验证文件大小（最大5MB）
            if (file.getSize() > 5 * 1024 * 1024) {
                return Result.fail("头像文件大小不能超过5MB");
            }

            // 创建上传目录
            File uploadDir = new File(AVATAR_UPLOAD_PATH);
            if (!uploadDir.exists()) {
                uploadDir.mkdirs();
            }

            // 删除旧头像文件
            if (student.getAvatarPath() != null && !student.getAvatarPath().isEmpty()) {
                deleteOldAvatarFile(student.getAvatarPath());
            }

            // 生成唯一文件名
            String fileName = studentId + "_avatar_" + System.currentTimeMillis() + "." + fileExtension;
            Path filePath = Paths.get(AVATAR_UPLOAD_PATH + fileName);

            // 保存文件
            Files.copy(file.getInputStream(), filePath);

            // 更新学生头像路径,这个就是用短的，不能用AVATAR_UPLOAD_PATH
            String avatarUrl = AVATAR_API_PATH + fileName;
            student.setAvatarPath(avatarUrl);
            studentRepository.save(student);

            log.info("头像上传成功: 学生ID={}, 文件路径={}", studentId, avatarUrl);
            return Result.success(avatarUrl, "头像上传成功");

        } catch (IOException e) {
            log.error("头像上传失败: 学生ID={}", studentId, e);
            return Result.fail("文件上传失败: " + e.getMessage());
        } catch (Exception e) {
            log.error("头像上传过程中发生错误: 学生ID={}", studentId, e);
            return Result.fail("上传失败: " + e.getMessage());
        }
    }

    /**
     * 获取文件扩展名
     */
    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();
    }

    /**
     * 验证图片格式是否有效
     */
    private boolean isValidImageFormat(String extension) {
        String[] validFormats = { "jpg", "jpeg", "png", "gif" };
        for (String format : validFormats) {
            if (format.equals(extension)) {
                return true;
            }
        }
        return false;
    }

    /**
     * 删除旧头像文件
     */
    private void deleteOldAvatarFile(String avatarPath) {
        try {
            if (avatarPath.startsWith(AVATAR_UPLOAD_PATH)) {
                String fileName = avatarPath.substring(AVATAR_API_PATH.length());
                Path oldFilePath = Paths.get(AVATAR_UPLOAD_PATH + fileName);
                if (Files.exists(oldFilePath)) {
                    Files.delete(oldFilePath);
                    log.info("已删除旧头像文件: {}", oldFilePath);
                }
            }
        } catch (Exception e) {
            log.warn("删除旧头像文件失败: {}", avatarPath, e);
        }
    }

    /**
     * 收藏职位
     */
    public Result<String> bookmarkJob(String studentId, String jobId, String note) {
        try {
            log.info("学生收藏职位: 学生ID={}, 职位ID={}", studentId, jobId);

            // 数据验证
            if (studentId == null || studentId.trim().isEmpty()) {
                return Result.fail("学生ID不能为空");
            }
            if (jobId == null || jobId.trim().isEmpty()) {
                return Result.fail("职位ID不能为空");
            }

            // 验证学生是否存在
            Optional<Student> studentOpt = studentRepository.findById(studentId);
            if (!studentOpt.isPresent()) {
                return Result.fail("学生不存在");
            }

            Student student = studentOpt.get();
            if ("inactive".equals(student.getStatus())) {
                return Result.fail("账户已被禁用，无法收藏职位");
            }

            // 检查是否已经收藏
            if (student.getBookmarkedJobs().contains(jobId)) {
                return Result.fail("您已经收藏过这个职位了");
            }

            // 验证职位或推荐工作是否存在
            Optional<Job> jobOpt = jobRepository.findById(jobId);
            Optional<RecommendedWork> recommendedWorkOpt = recommendedWorkRepository.findById(jobId);


            String jobTitle = "未知职位";
            if (jobOpt.isPresent()) {
                // 是真实职位
                Job job = jobOpt.get();
                jobTitle = job.getJobTitle();
                log.info("收藏真实职位: 学生={}, 职位={}", student.getFullName(), jobTitle);
            } else if (recommendedWorkOpt.isPresent()) {
                // 是推荐工作
                RecommendedWork recommendedWork = recommendedWorkOpt.get();
                jobTitle = recommendedWork.getJobTitle();
                log.info("收藏推荐工作: 学生={}, 职位={}", student.getFullName(), jobTitle);
            } else {
                // 既不是真实职位也不是推荐工作，但仍允许收藏（可能是外部数据）
                log.warn("收藏未知类型职位: 学生={}, 职位ID={}", student.getFullName(), jobId);
            }

            // 添加到收藏列表
            student.getBookmarkedJobs().add(jobId);
            studentRepository.save(student);

            log.info("职位收藏成功: 学生={}, 职位={}", student.getFullName(), jobTitle);
            return Result.success("收藏成功");

        } catch (Exception e) {
            log.error("收藏职位失败: 学生ID={}, 职位ID={}", studentId, jobId, e);
            return Result.fail("收藏失败: " + e.getMessage());
        }
    }

    /**
     * 获取学生收藏的职位列表
     */
    public Result<List<Job>> getBookmarkedJobs(String studentId) {
        try {
            log.info("获取学生收藏职位列表: 学生ID={}", studentId);

            // 数据验证
            if (studentId == null || studentId.trim().isEmpty()) {
                return Result.fail("学生ID不能为空");
            }

            // 验证学生是否存在
            Optional<Student> studentOpt = studentRepository.findById(studentId);
            if (!studentOpt.isPresent()) {
                return Result.fail("学生不存在");
            }

            Student student = studentOpt.get();
            List<String> bookmarkedJobIds = student.getBookmarkedJobs();

            List<Job> bookmarkedJobs = new ArrayList<>();
            Set<String> companyIds = new HashSet<>();

            for (String jobId : bookmarkedJobIds) {
                Optional<Job> jobOpt = jobRepository.findById(jobId);
                if (jobOpt.isPresent()) {
                    Job job = jobOpt.get();
//                    job.setId(jobId);
                    bookmarkedJobs.add(job);
                    if (job.getCompanyId() != null) {
                        companyIds.add(job.getCompanyId());
                    }
                } else {
                    Optional<RecommendedWork> recommendedWorkOpt = recommendedWorkRepository.findByJobId(jobId);
                    if (recommendedWorkOpt.isPresent()) {
                        Job convertedJob = convertRecommendedWorkToJob(recommendedWorkOpt.get());
//                        convertedJob.setId(jobId);
                        bookmarkedJobs.add(convertedJob);
                        if (convertedJob.getCompanyId() != null) {
                            companyIds.add(convertedJob.getCompanyId());
                        }
                    } else {
                        log.warn("收藏的职位ID不存在: {}", jobId);
                    }
                }
            }

            // 批量查询 company 的 logoImage
            Query companyQuery = Query.query(Criteria.where("companyId").in(companyIds));
            List<Company> companyList = mongoTemplate.find(companyQuery, Company.class);
            Map<String, String> companyLogoMap = new HashMap<>();
            for (Company company : companyList) {
                companyLogoMap.put(company.getCompanyId(), company.getLogoImage());
            }

            // 设置每个 job 的 logoImage
            for (Job job : bookmarkedJobs) {
                String logoImage = companyLogoMap.get(job.getCompanyId());
                job.setLogoImage(logoImage);
            }

            // 按照职位的创建时间（或其他时间字段）进行排序，假设字段名为 createdAt
//            bookmarkedJobs.sort(Comparator.comparing(Job::getCreatedAt).reversed());
            // 将结果倒序
            Collections.reverse(bookmarkedJobs);

            log.info("获取收藏职位列表成功: 学生ID={}, 收藏数量={}", studentId, bookmarkedJobs.size());

            return Result.success(bookmarkedJobs, String.format("您共收藏了%d个职位", bookmarkedJobs.size()));

        } catch (Exception e) {
            log.error("获取收藏职位列表失败: 学生ID={}", studentId, e);
            return Result.fail("获取收藏列表失败: " + e.getMessage());
        }
    }



    /**
     * 将推荐工作转换为Job格式
     */
    private Job convertRecommendedWorkToJob(RecommendedWork recommendedWork) {
        Job job = new Job();
        job.setId(recommendedWork.getId()); // 使用推荐工作的ID
        job.setJobId(recommendedWork.getId()); // 职位编号也使用推荐工作的ID
        job.setJobTitle(recommendedWork.getJobTitle());
        job.setCompanyName(recommendedWork.getCompanyName());
        job.setJobDescription("AI推荐职位 - " + recommendedWork.getJobTitle());
        job.setJobRequirements("根据您的简历匹配推荐");
        job.setJobType("AI推荐");
        job.setWorkLocation("待确认");
        job.setSalaryUnit("面议");
        job.setStatus("open");
        job.setCompanyId("AI_RECOMMENDATION"); // 标记为AI推荐
        job.setRecruitmentCount(1);

        return job;
    }

    /**
     * 取消收藏职位
     */
    public Result<String> unbookmarkJob(String studentId, String jobId) {
        try {
            log.info("学生取消收藏职位: 学生ID={}, 职位ID={}", studentId, jobId);

            // 数据验证
            if (studentId == null || studentId.trim().isEmpty()) {
                return Result.fail("学生ID不能为空");
            }
            if (jobId == null || jobId.trim().isEmpty()) {
                return Result.fail("职位ID不能为空");
            }

            // 验证学生是否存在
            Optional<Student> studentOpt = studentRepository.findById(studentId);
            if (!studentOpt.isPresent()) {
                return Result.fail("学生不存在");
            }

            Student student = studentOpt.get();
            if ("inactive".equals(student.getStatus())) {
                return Result.fail("账户已被禁用，无法操作收藏");
            }

            // 检查是否已经收藏
            if (!student.getBookmarkedJobs().contains(jobId)) {
                return Result.fail("您还没有收藏这个职位");
            }

            // 从收藏列表中移除
            student.getBookmarkedJobs().remove(jobId);
            studentRepository.save(student);

            log.info("职位取消收藏成功: 学生={}, 职位ID={}", student.getFullName(), jobId);
            return Result.success("取消收藏成功");

        } catch (Exception e) {
            log.error("取消收藏职位失败: 学生ID={}, 职位ID={}", studentId, jobId, e);
            return Result.fail("取消收藏失败: " + e.getMessage());
        }
    }
    public Result<String> unbookmarkAllJobs(String studentId) {
        try {
            log.info("学生清空所有收藏: 学生ID={}", studentId);

            // 数据验证
            if (studentId == null || studentId.trim().isEmpty()) {
                return Result.fail("学生ID不能为空");
            }

            // 验证学生是否存在
            Optional<Student> studentOpt = studentRepository.findById(studentId);
            if (!studentOpt.isPresent()) {
                return Result.fail("学生不存在");
            }

            Student student = studentOpt.get();
            if ("inactive".equals(student.getStatus())) {
                return Result.fail("账户已被禁用，无法操作收藏");
            }

            // 如果本来就没有收藏
            if (student.getBookmarkedJobs() == null || student.getBookmarkedJobs().isEmpty()) {
                return Result.success("当前没有收藏，无需清空");
            }

            // 清空收藏
            student.getBookmarkedJobs().clear();
            studentRepository.save(student);

            log.info("学生所有收藏已清空: 学生={}", student.getFullName());
            return Result.success("已清空所有收藏");

        } catch (Exception e) {
            log.error("清空所有收藏失败: 学生ID={}", studentId, e);
            return Result.fail("清空所有收藏失败: " + e.getMessage());
        }
    }

    /**
     * 检查职位是否已被学生收藏
     */
    public Result<Boolean> isJobBookmarked(String studentId, String jobId) {
        try {
            if (studentId == null || jobId == null) {
                return Result.success(false);
            }

            Optional<Student> studentOpt = studentRepository.findById(studentId);
            if (!studentOpt.isPresent()) {
                return Result.success(false);
            }

            Student student = studentOpt.get();
            return Result.success(student.getBookmarkedJobs().contains(jobId));

        } catch (Exception e) {
            log.error("检查职位收藏状态失败: 学生ID={}, 职位ID={}", studentId, jobId, e);
            return Result.success(false);
        }
    }

    public Result<Map<String, Boolean>> areJobsBookmarked(String studentId, List<String> jobIds) {
        try {
            if (studentId == null || jobIds == null || jobIds.isEmpty()) {
                // 返回所有职位都未收藏
                Map<String, Boolean> emptyMap = new HashMap<>();
                for (String jobId : jobIds) {
                    emptyMap.put(jobId, false);
                }
                return Result.success(emptyMap);
            }

            Optional<Student> studentOpt = studentRepository.findById(studentId);
            if (!studentOpt.isPresent()) {
                // 学生不存在，全部返回false
                Map<String, Boolean> emptyMap = new HashMap<>();
                for (String jobId : jobIds) {
                    emptyMap.put(jobId, false);
                }
                return Result.success(emptyMap);
            }

            Student student = studentOpt.get();

            // 获取收藏的职位集合
            Set<String> bookmarkedJobs = new HashSet<>(student.getBookmarkedJobs());

            // 构造返回结果
            Map<String, Boolean> resultMap = new HashMap<>();
            for (String jobId : jobIds) {
                resultMap.put(jobId, bookmarkedJobs.contains(jobId));
            }

            return Result.success(resultMap);

        } catch (Exception e) {
            log.error("批量检查职位收藏状态失败: 学生ID={}, 职位IDs={}, 异常信息={}", studentId, jobIds, e);
            // 出错则返回全部false
            Map<String, Boolean> errorMap = new HashMap<>();
            for (String jobId : jobIds) {
                errorMap.put(jobId, false);
            }
            return Result.success(errorMap);
        }
    }


    /**
     * 申请职位
     */
    public Result<String> applyForJob(String studentId, String jobId, String coverLetter) {
        try {
            log.info("学生申请职位: 学生ID={}, 职位ID={}", studentId, jobId);

            // 数据验证
            if (studentId == null || studentId.trim().isEmpty()) {
                return Result.fail("学生ID不能为空");
            }
            if (jobId == null || jobId.trim().isEmpty()) {
                return Result.fail("职位ID不能为空");
            }

            // 验证学生是否存在
            Optional<Student> studentOpt = studentRepository.findById(studentId);
            if (!studentOpt.isPresent()) {
                return Result.fail("学生不存在");
            }

            Student student = studentOpt.get();
            if ("inactive".equals(student.getStatus())) {
                return Result.fail("账户已被禁用，无法申请职位");
            }

            // 检查是否有简历
            if (student.getResumePath() == null || student.getResumePath().isEmpty()) {
                return Result.fail("申请职位前请先上传简历");
            }

            // 验证职位是否存在
            Optional<Job> jobOpt = jobRepository.findById(jobId);
            if (!jobOpt.isPresent()) {
                return Result.fail("职位不存在");
            }

            Job job = jobOpt.get();

            // 检查职位状态
            if (!"opening".equals(job.getStatus())) {
                return Result.fail("该职位已不接受申请");
            }

            // 检查是否已经申请过
            if (student.getAppliedJobs().contains(jobId)) {
                return Result.fail("您已经申请过这个职位了，请勿重复申请");
            }

            // 添加到学生的申请列表
            student.getAppliedJobs().add(jobId);
            studentRepository.save(student);

            log.info("职位申请成功: 学生={}, 职位={}, 企业={}",
                    student.getFullName(), job.getJobTitle(), job.getCompanyName());

            return Result.success("The website is about to be redirected.");

        } catch (Exception e) {
            log.error("申请职位失败: 学生ID={}, 职位ID={}", studentId, jobId, e);
            return Result.fail("申请失败: " + e.getMessage());
        }
    }

    /**
     * 获取学生的申请记录列表
     */
    public Result<List<Job>> getJobApplications(String studentId) {
        try {
            log.info("获取学生申请记录: 学生ID={}", studentId);

            // 数据验证
            if (studentId == null || studentId.trim().isEmpty()) {
                return Result.fail("学生ID不能为空");
            }

            // 验证学生是否存在
            Optional<Student> studentOpt = studentRepository.findById(studentId);
            if (!studentOpt.isPresent()) {
                return Result.fail("学生不存在");
            }

            Student student = studentOpt.get();

            List<Job> appliedJobs = new ArrayList<>();
            Set<String> companyIds = new HashSet<>();

            for (String jobId : student.getAppliedJobs()) {
                Optional<Job> jobOpt = jobRepository.findById(jobId);
                if (jobOpt.isPresent()) {
                    Job job = jobOpt.get();
//                    job.setId(jobId); // 显式设置 ID
                    appliedJobs.add(job);
                    if (job.getCompanyId() != null) {
                        companyIds.add(job.getCompanyId());
                    }
                }
            }

            // 批量查询所有 company 的 logoImage
            Query companyQuery = Query.query(Criteria.where("companyId").in(companyIds));
            List<Company> companyList = mongoTemplate.find(companyQuery, Company.class);
            Map<String, String> companyLogoMap = new HashMap<>();
            for (Company company : companyList) {
                companyLogoMap.put(company.getCompanyId(), company.getLogoImage());
            }

            // 设置 job 的 logoImage
            for (Job job : appliedJobs) {
                String logoImage = companyLogoMap.get(job.getCompanyId());
                job.setLogoImage(logoImage);
            }

            // 倒序排列应用的职位记录
            Collections.reverse(appliedJobs);  // 将职位申请记录倒序排列

            log.info("获取申请记录成功: 学生ID={}, 申请数量={}", studentId, appliedJobs.size());
            return Result.success(appliedJobs, String.format("您共申请了%d个职位", appliedJobs.size()));

        } catch (Exception e) {
            log.error("获取申请记录失败: 学生ID={}", studentId, e);
            return Result.fail("获取申请记录失败: " + e.getMessage());
        }
    }



    /**
     * 检查职位是否已被学生申请
     */
    public Result<Boolean> isJobApplied(String studentId, String jobId) {
        try {
            if (studentId == null || jobId == null) {
                return Result.success(false);
            }

            Optional<Student> studentOpt = studentRepository.findById(studentId);
            if (!studentOpt.isPresent()) {
                return Result.success(false);
            }

            Student student = studentOpt.get();
            boolean isApplied = student.getAppliedJobs().contains(jobId);
            return Result.success(isApplied);

        } catch (Exception e) {
            log.error("检查职位申请状态失败: 学生ID={}, 职位ID={}", studentId, jobId, e);
            return Result.success(false);
        }
    }

    /**
     * 修改学生密码
     */
    public Result<String> changePassword(String studentId, String oldPassword, String newPassword) {
        try {
            log.info("学生修改密码: ID={}", studentId);

            // 数据验证
            if (studentId == null || studentId.trim().isEmpty()) {
                return Result.fail("学生ID不能为空");
            }
            if (oldPassword == null || oldPassword.trim().isEmpty()) {
                return Result.fail("原密码不能为空");
            }
            if (newPassword == null || newPassword.trim().isEmpty()) {
                return Result.fail("新密码不能为空");
            }

            String oldPasswordHash = PasswordUtil.encryptPassword(oldPassword);
            String newPasswordHash = PasswordUtil.encryptPassword(newPassword);

            // 查找学生
            Optional<Student> studentOpt = studentRepository.findById(studentId);
            if (!studentOpt.isPresent()) {
                return Result.fail("学生不存在");
            }

            Student student = studentOpt.get();

            // 验证账户状态
            if ("inactive".equals(student.getStatus())) {
                return Result.fail("账户已被禁用，无法修改密码");
            }

            Boolean result = PasswordUtil.checkPassword(oldPassword, student.getPassword());

            // 验证旧密码
            if (!result) {
                log.warn("学生密码修改失败: ID={} - 原密码错误", studentId);
                return Result.fail("原密码错误");
            }

            // 验证新密码强度
            Result<String> passwordValidation = validatePasswordStrength(newPassword);
            if (!passwordValidation.isSuccess()) {
                return passwordValidation;
            }


            // 检查新密码是否与旧密码相同
            if (newPasswordHash.equals(oldPasswordHash)) {
                return Result.fail("新密码不能与原密码相同");
            }

            // 更新密码 (TODO: 在生产环境中应该加密存储)
            student.setPassword(newPasswordHash);

            // 如果是首次修改密码，更新标识
            // 添加空值检查，确保向后兼容
            Boolean isFirstLogin = student.getIsFirstLogin();
            Boolean hasChangedPassword = student.getHasChangedPassword();

            if (isFirstLogin == null) {
                student.setIsFirstLogin(false); // 对于现有用户，设为false
            }
            if (hasChangedPassword == null) {
                student.setHasChangedPassword(false); // 初始化为false
            }

            if (Boolean.TRUE.equals(student.getIsFirstLogin())
                    && !Boolean.TRUE.equals(student.getHasChangedPassword())) {
                student.setHasChangedPassword(true);
                log.info("学生首次修改密码: ID={}", studentId);
            }

            Student savedStudent = studentRepository.save(student);

            log.info("学生密码修改成功: ID={}, 学生={}", studentId, savedStudent.getFullName());
            return Result.success("密码修改成功");

        } catch (Exception e) {
            log.error("修改密码失败: 学生ID={}", studentId, e);
            return Result.fail("密码修改失败: " + e.getMessage());
        }
    }

    /**
     * 完成个人资料设置
     */
    public Result<String> completeProfileSetup(String studentId, String nickname, String gender,
                                               MultipartFile avatarFile, MultipartFile resumeFile) {
        try {
            log.info("学生完成个人资料设置: ID={}", studentId);

            // 数据验证
            if (studentId == null || studentId.trim().isEmpty()) {
                return Result.fail("学生ID不能为空");
            }

            // 查找学生
            Optional<Student> studentOpt = studentRepository.findById(studentId);
            if (!studentOpt.isPresent()) {
                return Result.fail("学生不存在");
            }

            Student student = studentOpt.get();

            // 验证账户状态
            if ("inactive".equals(student.getStatus())) {
                return Result.fail("账户已被禁用，无法设置资料");
            }

            // 更新昵称
            if (nickname != null && !nickname.trim().isEmpty()) {
                student.setNickname(nickname.trim());
            }

            // 更新性别
            if (gender != null && !gender.trim().isEmpty()) {
                student.setGender(gender);
            }

            // 上传头像
            if (avatarFile != null && !avatarFile.isEmpty()) {
                Result<String> avatarResult = uploadAvatar(studentId, avatarFile);
                if (!avatarResult.isSuccess()) {
                    return Result.fail("头像上传失败: " + avatarResult.getMessage());
                }
                student.setAvatarPath(avatarResult.getData());
            }

            // 上传简历
            Result<Map<String, String>> resumeResult = uploadResume(studentId, resumeFile);
            if (!resumeResult.isSuccess()) {
                return Result.fail("简历上传失败: " + resumeResult.getMessage());
            }
            Map<String, String> data = resumeResult.getData();
            student.setResumePath(data.get("fileUrl"));

            // 标记为已完成个人资料设置
            student.setHasCompletedProfile(true);
            student.setIsFirstLogin(false);

            // 如果密码也已修改，则标记为非首次登录
            if (Boolean.TRUE.equals(student.getHasChangedPassword())) {
                student.setIsFirstLogin(false);
                log.info("学生完成首次登录设置: ID={}", studentId);
            }

            Student savedStudent = studentRepository.save(student);
            log.info("学生个人资料设置完成: ID={}, 学生={}", studentId, savedStudent.getFullName());

            return Result.success("个人资料设置完成");
        } catch (Exception e) {
            log.error("完成个人资料设置失败: 学生ID={}", studentId, e);
            return Result.fail("个人资料设置失败: " + e.getMessage());
        }
    }

    /**
     * 验证密码强度（简化版本）
     */
    private Result<String> validatePasswordStrength(String password) {
        // 只检查基本长度要求
        if (password.length() < 1) {
            return Result.fail("密码不能为空");
        }
        if (password.length() > 50) {
            return Result.fail("密码长度不能超过50位");
        }

        return Result.success("密码强度验证通过");
    }

    /**
     * 获取学生个人信息
     */
    public Result<Student> getStudentProfile(String studentId) {
        try {
            log.info("获取学生个人信息: ID={}", studentId);

            Optional<Student> studentOpt = studentRepository.findById(studentId);
            if (!studentOpt.isPresent()) {
                return Result.fail("学生不存在");
            }

            Student student = studentOpt.get();
            student.setPassword(null); // 不返回密码信息

            return Result.success(student);

        } catch (Exception e) {
            log.error("获取学生信息失败", e);
            return Result.fail("获取信息失败: " + e.getMessage());
        }
    }

    /**
     * 获取所有学生 - 保留原有方法，供教师端使用
     */
    public Result<List<Student>> getAllStudents() {
        try {
            log.info("开始查询所有学生数据...");

            // 直接从正确的数据库查询
            MongoDatabase pelegantDb = mongoTemplate.getMongoDbFactory().getMongoDatabase("Pelegant");

            // 统计文档数量
            long count = pelegantDb.getCollection("student").countDocuments();
            log.info("Pelegant数据库中student集合文档数量: {}", count);

            if (count == 0) {
                log.warn("Pelegant数据库中student集合无数据");
                return Result.success(new ArrayList<>(), 0L);
            }

            // 获取所有文档并转换为Student对象
            List<Student> students = new ArrayList<>();
            List<Document> documents = new ArrayList<>();
            pelegantDb.getCollection("student").find().into(documents);

            log.info("从数据库获取到 {} 个原始文档", documents.size());

            for (int i = 0; i < documents.size(); i++) {
                Document doc = documents.get(i);
                try {
                    log.info("处理第 {} 个文档: {}", i + 1, doc.toJson());

                    Student student = new Student();

                    // 安全地获取ID
                    if (doc.getObjectId("_id") != null) {
                        student.setId(doc.getObjectId("_id").toString());
                    }

                    // 安全地获取字符串字段，处理可能的数字类型
                    student.setFullName(getStringValue(doc, "fullName"));
                    student.setEmail(getStringValue(doc, "email"));
                    student.setPassword(getStringValue(doc, "password"));
                    student.setStudentId(getStringValue(doc, "studentId"));
                    student.setMajor(getStringValue(doc, "major"));

                    // 安全地获取数字字段
                    student.setEnrollmentYear(getIntegerValue(doc, "enrollmentYear"));

                    students.add(student);
                    log.info("成功转换学生: {}", student.getFullName());

                } catch (Exception ex) {
                    log.error("转换第 {} 个文档失败: {}, 错误: {}", i + 1, doc.toJson(), ex.getMessage(), ex);
                }
            }

            log.info("成功查询到 {} 个学生", students.size());
            return Result.success(students, (long) students.size());

        } catch (Exception e) {
            log.error("获取学生列表失败", e);
            return Result.fail("获取学生列表失败: " + e.getMessage());
        }
    }

    /**
     * 安全地从Document中获取字符串值，处理数字类型转换
     */
    private String getStringValue(Document doc, String fieldName) {
        Object value = doc.get(fieldName);
        if (value == null) {
            return null;
        }
        if (value instanceof String) {
            return (String) value;
        }
        if (value instanceof Number) {
            // 处理科学计数法的数字
            Number num = (Number) value;
            if (num instanceof Double) {
                Double d = (Double) num;
                // 如果是整数，返回整数格式
                if (d == Math.floor(d) && !Double.isInfinite(d)) {
                    return String.valueOf(d.longValue());
                }
            }
            return num.toString();
        }
        return value.toString();
    }

    /**
     * 安全地从Document中获取整数值
     */
    private Integer getIntegerValue(Document doc, String fieldName) {
        Object value = doc.get(fieldName);
        if (value == null) {
            return null;
        }
        if (value instanceof Integer) {
            return (Integer) value;
        }
        if (value instanceof Number) {
            return ((Number) value).intValue();
        }
        if (value instanceof String) {
            try {
                return Integer.parseInt((String) value);
            } catch (NumberFormatException e) {
                log.warn("无法将字符串 '{}' 转换为整数", value);
                return null;
            }
        }
        return null;
    }

    // ==================== 职位相关方法 ====================

    /**
     * 根据ID获取职位详情
     */
    public Result<Job> getJobById(String jobId) {
        log.info("开始获取职位详情: 职位ID={}", jobId);

        try {
            Optional<Job> jobOptional = jobRepository.findById(jobId);

            // Java 8: 使用 !isPresent()
            if (!jobOptional.isPresent()) {
                log.warn("职位不存在: 职位ID={}", jobId);
                return Result.fail("职位不存在");
            }

            Job job = jobOptional.get();
            log.debug("找到职位: MongoDB ID={}, 业务ID={}, 标题={}",
                    job.getId(),
                    job.getJobId(),
                    job.getJobTitle());

            String companyId = job.getCompanyId();

            // 安全获取公司信息（Java 8 Optional 用法）
            Optional<Company> companyOptional = companyRepository.findByCompanyId(companyId);
            String logoImage = companyOptional.map(new Function<Company, String>() {
                @Override
                public String apply(Company company) {
                    return company.getLogoImage();
                }
            }).orElse("");

            String companyUrl = companyOptional.map(new Function<Company, String>() {
                @Override
                public String apply(Company company) {
                    return company.getCompanyUrl();
                }
            }).orElse("");

            // ✅ 修复重点：根据你的实体结构调整！
            // 如果前端期望 id = jobId，则取消下面这行注释：
            // job.setId(job.getJobId());

            job.setLogoImage(logoImage);
            job.setCompanyUrl(companyUrl);

            log.info("获取职位详情成功: 职位ID={}, 职位名称={}", jobId, job.getJobTitle());
            return Result.success(job, "获取职位详情成功");

        } catch (Exception e) {
            log.error("获取职位详情失败: 职位ID={}", jobId, e);
            return Result.fail("获取职位详情失败: " + e.getMessage());
        }
    }

    /**
     * 搜索职位
     */
    public Result<JobSearchResponse> searchJobs(String keyword, String employmentType) {
        try {
            Query query = new Query();

            // 构建搜索条件
            if (StringUtils.hasText(keyword)) {
                Criteria keywordCriteria = new Criteria().orOperator(
                        Criteria.where("jobTitle").regex(keyword, "i"),
                        Criteria.where("jobDescription").regex(keyword, "i"),
                        Criteria.where("skillsRequired").regex(keyword, "i"),
                        Criteria.where("companyName").regex(keyword, "i"));
                query.addCriteria(keywordCriteria);
            }

            if (StringUtils.hasText(employmentType) && !"All".equals(employmentType)) {
                // 根据回传的数字解析为对应的文本
                List<String> translatedTypes = new ArrayList<>();

                switch (employmentType) {
                    case "1":
                        translatedTypes.add("full-time-campus");
                        break;
                    case "0":
                        // 包含 "full-time-campus" 和 "intern" 的合集
                        translatedTypes.addAll(Arrays.asList("full-time-campus", "intern"));
                        break;
                    case "2":
                        translatedTypes.add("intern");
                        break;
                    default:
                        // 默认包含 "full-time-campus" 和 "intern"
                        translatedTypes.addAll(Arrays.asList("full-time-campus", "intern"));
                        break;
                }

                // 添加查询条件
                if (!translatedTypes.isEmpty()) {
                    query.addCriteria(Criteria.where("jobType").in(translatedTypes));
                }
            }

            // 只查询状态为"opening"的职位
            query.addCriteria(Criteria.where("status").is("opening"));

            //只查询地址为香港的职位
            query.addCriteria(Criteria.where("workLocation").regex(HONG_KONG_REGEX, "i"));


            // 排序：按创建时间降序（最新的职位排在前面）
            query.with(Sort.by(Sort.Order.desc("createdAt")));

            // 执行查询
            List<Job> jobs = mongoTemplate.find(query, Job.class);
            long total = mongoTemplate.count(query, Job.class);

            // 预加载所有相关公司数据，避免 N 次查询，提升效率
            Set<String> companyIds = jobs.stream()
                    .map(Job::getCompanyId)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toSet());

            Query companyQuery = Query.query(Criteria.where("companyId").in(companyIds));
            List<Company> companyList = mongoTemplate.find(companyQuery, Company.class);

            // 建立 companyId -> logoImage 映射
            Map<String, String> companyLogoMap = new HashMap<>();
            for (Company company : companyList) {
                companyLogoMap.put(company.getCompanyId(), company.getLogoImage());
            }

            // 设置 job 的 id 和 logoImage
            for (Job job : jobs) {
//                job.setId(job.getJobId()); // 修改id为jobId
                String logoImage = companyLogoMap.get(job.getCompanyId());
                job.setLogoImage(logoImage); // 设置 logoImage
            }

            log.info("搜索职位成功: 关键词={}, 就业类型={}, 结果数量={}", keyword, employmentType, jobs.size());

            JobSearchResponse response = new JobSearchResponse(jobs, total);
            return Result.success(response, "搜索职位成功");
        } catch (Exception e) {
            log.error("搜索职位失败: 关键词={}, 就业类型={}, 错误={}", keyword, employmentType, e.getMessage());
            return Result.fail("搜索职位失败: " + e.getMessage());
        }
    }


// 取消申请职位
    public Result<String> cancelApplyForJob(String studentId, String jobId) {
        try {
            Optional<Student> jobOptional = studentRepository.findById(studentId);

            if (jobOptional.isPresent()) {
                Student student = jobOptional.get();
                // 判断是否申请了该职位
                if (student.getAppliedJobs().contains(jobId)) {
                    student.getAppliedJobs().remove(jobId); // 移除申请记录
                    studentRepository.save(student); // 保存修改

                    log.info("取消申请职位成功: 学生ID={}, 职位ID={}", studentId, jobId);
                    return Result.success("取消申请职位成功");
                } else {
                    log.warn("学生未申请该职位: 学生ID={}, 职位ID={}", studentId, jobId);
                    return Result.fail("学生未申请该职位");
                }
            } else {
                log.warn("未找到学生记录: 学生ID={}", studentId);
                return Result.fail("未找到该学生信息");
            }
        } catch (Exception e) {
            log.error("取消申请职位失败: 学生ID={}, 职位ID={}, 错误={}", studentId, jobId, e.getMessage(), e);
            return Result.fail("取消申请职位失败: " + e.getMessage());
        }
    }

    public Result<List<Job>> getAllJobs() {
        log.info("开始获取最新 30 条香港地区的全职/实习职位");

        try {
            Date now = new Date();

            Criteria criteria = Criteria.where("jobType").in("full-time-campus", "intern")
                    .and("workLocation").regex(HONG_KONG_REGEX, "i")
                    .orOperator(
                            Criteria.where("deadline").is(null),
                            Criteria.where("deadline").gt(now)   // ✅ 用 Date 类型
                    );

//            // ✅ 获取当前时间，并格式化成和数据库完全一致的字符串格式
//            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS");
//            String nowStr = LocalDateTime.now().format(formatter);
//            log.info("当前时间（字符串格式）: {}", nowStr);
//
//            // ✅ 构建查询条件 —— 全部用字符串比较
//            Criteria criteria = Criteria.where("jobType").in("full-time-campus", "intern")
//                    .and("workLocation").regex(HONG_KONG_REGEX, "i")
//                    .orOperator(
//                            Criteria.where("deadline").is(null),           // 允许无截止时间
//                            Criteria.where("deadline").gt(nowStr)         // 字符串比较，必须格式一致！
//                    );

            Aggregation aggregation = Aggregation.newAggregation(
                    Aggregation.match(criteria),
                    Aggregation.sort(Sort.Direction.DESC, "createdAt"),
                    Aggregation.limit(30),
                    Aggregation.lookup("company", "companyId", "companyId", "companyInfo")
            );

            AggregationResults<JobWithCompany> results =
                    mongoTemplate.aggregate(aggregation, "job", JobWithCompany.class);
            List<JobWithCompany> jobWithCompanyList = results.getMappedResults();

            log.info("聚合查询返回 {} 条记录", jobWithCompanyList.size());

            List<Job> jobs = jobWithCompanyList.stream().map(jwc -> {
                Job job = new Job();
                BeanUtils.copyProperties(jwc, job);

                if (jwc.getCompanyInfo() != null && !jwc.getCompanyInfo().isEmpty()) {
                    Company company = jwc.getCompanyInfo().get(0);
                    job.setLogoImage(company.getLogoImage());
                    job.setCompanyUrl(company.getCompanyUrl());
                }

                return job;
            }).collect(Collectors.toList());

            log.info("成功获取 {} 条职位", jobs.size());
            return Result.success(jobs);

        } catch (Exception e) {
            log.error("获取职位列表失败", e);
            return Result.fail("获取职位列表失败: " + e.getMessage());
        }
    }
    // 辅助 DTO 类，用于聚合映射
    public static class JobWithCompany extends  Job {

        private List<Company> companyInfo;



        public List<Company> getCompanyInfo() {
            return companyInfo;
        }

        public void setCompanyInfo(List<Company> companyInfo) {
            this.companyInfo = companyInfo;
        }
    }


    public Result<String> forgetPasswordEmail(String email) {
        try {
            Optional<Student> studentOptional = studentRepository.findByEmail(email);
            if (!studentOptional.isPresent()) {
                return Result.fail("Student information does not exist.");
            }

            Student student = studentOptional.get();
            School school = schoolRepository.findBySchoolId(student.getSchoolId()).get();

            // 生成 token 并缓存 5 分钟
            String token = UUID.randomUUID().toString();
            redisTemplate.opsForValue().set(RESET_KEY_PREFIX + token, student.getStudentId(), 5, TimeUnit.MINUTES);

            // 构建重置链接
            String resetLink = "http://pelegant.info:8080/page/student-reset-password?token=" + token;

            // 异步发送邮件
            emailServices.sendEmailAsync(
                    student.getEmail(),
                    student.getFullName(),
                   school.getUniversityName(),
                    null,
                    EmailServices.EmailType.STUDENT_PASSWORD_RESET_LINK,
                    null,
                    resetLink
            );

            log.info("已异步发送学生忘记密码邮件: {}", student.getEmail());
            return Result.success("发送忘记密码邮件成功");

        } catch (Exception e) {
            log.error("发送忘记密码邮件失败: {}", e.getMessage(), e);
            return Result.fail("发送忘记密码邮件失败: " + e.getMessage());
        }
    }



    public Result<String> validateToken(@RequestParam String token) {
        String teacherId = redisTemplate.opsForValue().get(RESET_KEY_PREFIX + token);
        if (teacherId == null) {
            return Result.fail("The link has expired or is invalid.");
        }
        return Result.success(teacherId, "Link is valid");
    }

    /**
     * 链接重置账号
     */
    public Result<String> resetstudentPassword(String token, String newPassword,String confirmPassword) {
        if (!newPassword.equals(confirmPassword)) {
            return Result.fail("The new password and the confirmed password do not match.");
        }

        String studentId = redisTemplate.opsForValue().get(RESET_KEY_PREFIX + token);
        if (studentId == null) {
            return Result.fail("The link has expired or is invalid.");
        }

        Optional<Student> studentOpt = studentRepository.findByStudentId(studentId);
        if (!studentOpt.isPresent()) {
            return Result.fail("Student information does not exist.");
        }

        Student student = studentOpt.get();
        String newPasswordHash = PasswordUtil.encryptPassword(newPassword);
        student.setPassword(newPasswordHash);
        studentRepository.save(student);

        // 删除 Redis token，防止重复使用
        redisTemplate.delete(RESET_KEY_PREFIX + token);

        return Result.success("Password reset successful");
    }


}