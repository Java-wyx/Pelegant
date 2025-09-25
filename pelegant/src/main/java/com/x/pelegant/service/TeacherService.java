package com.x.pelegant.service;

import com.x.pelegant.common.Result;
import com.x.pelegant.entity.Student;
import com.x.pelegant.entity.Teacher;
import com.x.pelegant.entity.School;
import com.x.pelegant.entity.Job;
import com.x.pelegant.entity.Company;
import com.x.pelegant.entity.TRole;
import com.x.pelegant.repository.StudentRepository;
import com.x.pelegant.repository.TeacherRepository;
import com.x.pelegant.repository.SchoolRepository;
import com.x.pelegant.repository.JobRepository;
import com.x.pelegant.repository.CompanyRepository;
import com.x.pelegant.repository.TRoleRepository;
import com.x.pelegant.dto.LoginResponse;
import com.x.pelegant.dto.StudentApplicationStatsResponse;
import com.x.pelegant.dto.CompanyApplicationStatsResponse;
import com.x.pelegant.dto.UpdateTeacherProfileRequest;
import com.x.pelegant.dto.ChangePasswordRequest;
import com.x.pelegant.dto.StudentExcelImportRequest;
import com.x.pelegant.dto.StudentBatchImportResponse;
import com.x.pelegant.dto.RoleCreateRequest;
import com.x.pelegant.dto.RoleUpdateRequest;
import com.x.pelegant.dto.CreateTeacherRequest;
import com.x.pelegant.dto.UpdateTeacherRequest;
import com.x.pelegant.util.EducationSystemCalculator;
import com.x.pelegant.util.JwtUtil;
import com.x.pelegant.config.JwtConfig;
import com.x.pelegant.util.PasswordUtil;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.RandomStringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.time.Year;
import java.io.InputStream;
import java.io.IOException;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.poi.hssf.usermodel.HSSFWorkbook;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;

import com.x.pelegant.dto.AddStudentRequest;

import javax.annotation.PostConstruct;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Criteria;

/**
 * 教师服务类
 */
@Service
@Slf4j
public class TeacherService {

    @Autowired
    private TeacherRepository teacherRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private SchoolRepository schoolRepository;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private TRoleRepository tRoleRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private EmailServices emailServices;

    @Autowired
    private EducationSystemCalculator educationSystemCalculator;

    @Autowired
    private JwtConfig jwtConfig;

    // 头像文件存储路径
    private String AVATAR_UPLOAD_PATH;

    // 头像api路径，/api/files和文件名之间的部分。
    private String AVATAR_API_PATH = "/uploads/avatars/";

    @Value("${pelegant.upload.path}")
    private String uploadPath;

    @Autowired
    private MongoTemplate mongoTemplate;

    @Autowired
    private StringRedisTemplate redisTemplate;
    private static final String RESET_KEY_PREFIX = "teacher_reset_token:";

    // 定义正则表达式常量
    private static final String HONG_KONG_REGEX = "^(HK|香港|Hong\\s?Kong|HongKong|HKSAR|Hong\\s?Kong\\s?SAR|HK\\s?SAR|香港特别行政区|香港岛|Hong\\s?Kong,\\s?Hong\\s?Kong\\s?SAR|[A-Za-z\\s&]+,\\s?HK|[A-Za-z\\s&]+,\\s?Hong\\s?Kong\\s?SAR|Remote,\\s?HK|[A-Za-z\\s&]+,\\s?Hong\\s?Kong)$";


    @PostConstruct
    public void init() {
        AVATAR_UPLOAD_PATH = uploadPath + "avatars/";
        log.info("Upload Path: {}", uploadPath);
        log.info("Avatar Upload Path: {}", AVATAR_UPLOAD_PATH);
    }

    /**
     * 教师登录验证
     */
    public Result<LoginResponse> login(String email, String password) {
        try {
            log.info("教师登录尝试: {}", email);

            // 根据邮箱查找教师

            Optional<Teacher> teacherOpt = teacherRepository.findByEmail(email);
            String storedHash = teacherOpt.get().getPassword();
            boolean result = PasswordUtil.checkPassword(password, storedHash);



            if (result) {
                Teacher teacher = teacherOpt.get();

                // 生成JWT Token
                String token = jwtUtil.generateToken(
                        teacher.getTeacherId(),
                        teacher.getName(),
                        JwtConfig.UserRole.TEACHER.getValue());

                // 计算过期时间
                long expiresAt = System.currentTimeMillis() + jwtConfig.getExpiration();

                // 创建登录响应
                teacher.setPassword(null); // 不返回密码
                LoginResponse loginResponse = new LoginResponse(
                        token,
                        teacher.getTeacherId(),
                        teacher.getName(),
                        JwtConfig.UserRole.TEACHER.getValue(),
                        expiresAt,
                        teacher);

                log.info("教师登录成功: {} - {}", teacher.getName(), teacher.getRole());
                return Result.success(loginResponse, "login successfully");
            } else {
                log.warn("教师登录失败: {} - 邮箱或密码错误", email);
                return Result.fail("The email or password is incorrect");
            }
        } catch (Exception e) {
            log.error("教师登录过程中发生错误", e);
            return Result.fail("登录失败: " + e.getMessage());
        }
    }

    /**
     * 教师添加学生（仅核心字段，自动生成密码）
     */
    public Result<Student> addStudent(AddStudentRequest request, String teacherId) {
        try {
            log.info("教师添加学生(核心字段): {}", request.getFullName());

            // 获取教师信息
            Optional<Teacher> teacherOpt = teacherRepository.findByTeacherId(teacherId);
            if (!teacherOpt.isPresent()) {
                return Result.fail("The teacher information does not exist. Please log in again");
            }
            Teacher teacher = teacherOpt.get();
            String schoolId = teacher.getSchoolId();

            if (schoolId == null || schoolId.trim().isEmpty()) {
                return Result.fail("The teacher is not associated with a school. Please contact the administrator");
            }

            Optional<School> schoolOpt = schoolRepository.findBySchoolId(schoolId);
            if (!schoolOpt.isPresent()) {
                return Result.fail("The school associated with the teacher does not exist. Please contact the administrator");
            }

            if (studentRepository.findByEmail(request.getEmail()).isPresent()) {
                return Result.fail("The mailbox already exists.");
            }

            String rawStudentId = request.getStudentId();
            if (rawStudentId == null || rawStudentId.trim().isEmpty()) {
                return Result.fail("The student number cannot be empty");
            }
            String dbStudentId = schoolId + "_" + rawStudentId;
            if (studentRepository.findByStudentIdAndSchoolId(dbStudentId, schoolId).isPresent()) {
                return Result.fail("This student number already exists in our school. Please re-enter it");
            }

            // 自动生成初始密码
            String initPassword = PasswordUtil.generateRandomPassword(8);
            String passwordHash = PasswordUtil.encryptPassword(initPassword);

            Student student = new Student();
            student.setFullName(request.getFullName());
            student.setStudentId(dbStudentId);
            student.setEmail(request.getEmail());
            student.setMajor(request.getMajor());
            student.setEnrollmentYear(request.getEnrollmentYear());
            student.setPassword(passwordHash);
            student.setSchoolId(schoolId.trim());
            student.setAvatarPath("/uploads/avatars/defaultavatarnull.png");
            student.setIsMaster(request.getIsMaster());
            student.setIsPhd(request.getIsPhd());

            Student savedStudent = studentRepository.save(student);
            log.info("学生添加成功: {} - {}", savedStudent.getFullName(), savedStudent.getStudentId());

            // 异步发送初始密码邮件
            School school = schoolOpt.get();
            emailServices.sendEmailAsync(
                    savedStudent.getEmail(),
                    savedStudent.getFullName(),
                    school.getUniversityName(),
                    initPassword,
                    EmailServices.EmailType.STUDENT_INITIAL_PASSWORD,
                    null,
                    null
            );

            String message = "The student has been successfully added and the initial password has been generated (email will be sent asynchronously)";
            return Result.success(savedStudent, message);

        } catch (Exception e) {
            log.error("添加学生失败", e);
            return Result.fail("Failed to add a student: " + e.getMessage());
        }
    }



    private String generateStudentId(String enrollmentYear) {
        // 查询该年份已存在的学号
        List<Student> studentsOfYear = studentRepository.findByStudentIdStartingWith(enrollmentYear);

        // 提取该年份的最大序号
        int maxNumber = studentsOfYear.stream()
                .map(Student::getStudentId)
                .map(id -> id.substring(enrollmentYear.length())) // 去掉年份部分
                .mapToInt(Integer::parseInt)
                .max()
                .orElse(0);

        // 下一个序号
        int nextNumber = maxNumber + 1;

        // 根据长度动态生成学号，不足6位补0
        int length = Math.max(6, String.valueOf(nextNumber).length());
        String numberPart = String.format("%0" + length + "d", nextNumber);

        return enrollmentYear + numberPart;
    }


    /**
     * 教师查看本学校所有学生
     */
    public Result<List<Student>> getAllStudents(String teacherId) {
        try {
            log.info("教师查看本学校学生列表: {}", teacherId);

            Optional<Teacher> teacherOpt = teacherRepository.findByTeacherId(teacherId);
            if (!teacherOpt.isPresent()) {
                return Result.fail("Teacher information does not exist");
            }

            Teacher teacher = teacherOpt.get();
            String schoolId = teacher.getSchoolId();

            List<Student> students = studentRepository.findBySchoolId(schoolId);


            students.forEach(student -> {
                student.setPassword(null);

                // 去掉 studentId 的 schoolId_ 前缀
                String sid = student.getStudentId();
                if (sid != null && sid.contains("_")) {
                    student.setStudentId(sid.substring(sid.indexOf("_") + 1));
                }

                Boolean isMaster = student.getIsMaster();
                Boolean isPhd = student.getIsPhd();

                // 根据 isMaster / isPhd 设置 studentType
                if (Boolean.TRUE.equals(isMaster) && Boolean.FALSE.equals(isPhd)) {
                    student.setStudentType("Master");
                } else if (Boolean.TRUE.equals(isPhd) && Boolean.FALSE.equals(isMaster)) {
                    student.setStudentType("Doctoral");
                } else {
                    // 默认本科（包括 null / 两者都 false 的情况）
                    student.setStudentType("Bachelor");
                }


            });


            log.info("成功获取本学校 {} 个学生信息", students.size());
            return Result.success(students, (long) students.size());

        } catch (Exception e) {
            log.error("获取学生列表失败", e);
            return Result.fail("Failed to obtain the student list: " + e.getMessage());
        }
    }


    /**
     * 教师更新学生信息
     */
    public Result<Student> updateStudent(String teacherId, String studentId, AddStudentRequest request) {
        try {
            log.info("教师更新学生信息: {} - {}", studentId, request.getFullName());

            // 获取教师信息以确定学校ID
            Optional<Teacher> teacherOpt = teacherRepository.findByTeacherId(teacherId);
            if (!teacherOpt.isPresent()) {
                return Result.fail("The teacher information does not exist. Please log in again");
            }

            Teacher teacher = teacherOpt.get();
            String schoolId = teacher.getSchoolId();

            // 查找要更新的学生
            Optional<Student> studentOpt = studentRepository.findById(studentId);
            if (!studentOpt.isPresent()) {
                return Result.fail("Students do not exist.");
            }

            Student student = studentOpt.get();

            // 验证学生是否属于教师的学校
            if (!schoolId.equals(student.getSchoolId())) {
                return Result.fail("There is no permission to modify the student information of other schools");
            }

            // 检查邮箱是否与其他学生重复
            if (request.getEmail() != null && !request.getEmail().trim().isEmpty()) {
                Optional<Student> existingStudent = studentRepository.findByEmail(request.getEmail());
                if (existingStudent.isPresent() && !existingStudent.get().getId().equals(studentId)) {
                    return Result.fail("The mailbox has been used by other students");
                }
            }

            // 检查学号是否与其他学生重复
            if (request.getStudentId() != null && !request.getStudentId().trim().isEmpty()) {
                Optional<Student> existingStudent = studentRepository.findByStudentId(request.getStudentId());
                if (existingStudent.isPresent() && !existingStudent.get().getId().equals(studentId)) {
                    return Result.fail("The student number has been used by another student");
                }
            }

            // 更新学生信息
            student.setFullName(request.getFullName());
//            student.setStudentId(request.getStudentId());
            student.setEmail(request.getEmail());
            student.setMajor(request.getMajor());
            student.setEnrollmentYear(request.getEnrollmentYear());
            student.setIsMaster(request.getIsMaster());
            student.setIsPhd(request.getIsPhd());
            Student updatedStudent = studentRepository.save(student);

            // 清除密码信息
            updatedStudent.setPassword(null);

            log.info("学生信息更新成功: {} - {}", updatedStudent.getFullName(), updatedStudent.getStudentId());
            return Result.success(updatedStudent, "The student information has been updated successfully");

        } catch (Exception e) {
            log.error("更新学生信息失败", e);
            return Result.fail("The update of student information failed: " + e.getMessage());
        }
    }

    /**
     * 教师删除学生（硬删除）
     */
    public Result<String> deleteStudent(String teacherId, String studentId) {
        try {
            log.info("教师删除学生: {}", studentId);

            // 获取教师信息以确定学校ID
            Optional<Teacher> teacherOpt = teacherRepository.findByTeacherId(teacherId);
            if (!teacherOpt.isPresent()) {
                return Result.fail("The teacher information does not exist. Please log in again");
            }

            Teacher teacher = teacherOpt.get();
            String schoolId = teacher.getSchoolId();

            // 查找要删除的学生
            Optional<Student> studentOpt = studentRepository.findById(studentId);
            if (!studentOpt.isPresent()) {
                return Result.fail("Students do not exist.");
            }

            Student student = studentOpt.get();

            // 验证学生是否属于教师的学校
            if (!schoolId.equals(student.getSchoolId())) {
                return Result.fail("There is no authority to delete students from other schools");
            }

            // 硬删除：直接从数据库中删除记录
            studentRepository.delete(student);

            log.info("学生删除成功: {} - {}", student.getFullName(), student.getStudentId());
            return Result.success("The student has successfully deleted.", "The student records have been completely deleted from the system");

        } catch (Exception e) {
            log.error("删除学生失败", e);
            return Result.fail("删除学生失败: " + e.getMessage());
        }
    }

    /**
     * 根据专业查询本学校学生
     */
    public Result<List<Student>> getStudentsByMajor(String teacherId, String major) {
        try {
            log.info("教师根据专业查询本学校学生: {} - {}", teacherId, major);

            // 获取教师信息以确定学校ID
            Optional<Teacher> teacherOpt = teacherRepository.findByTeacherId(teacherId);
            if (!teacherOpt.isPresent()) {
                return Result.fail("Teacher information does not exist");
            }

            Teacher teacher = teacherOpt.get();
            String schoolId = teacher.getSchoolId();

            // 只查询本学校指定专业的学生
            List<Student> students = studentRepository.findByMajorAndSchoolId(major, schoolId);
            students.forEach(student -> student.setPassword(null));

            log.info("本学校专业 {} 有 {} 个学生", major, students.size());
            return Result.success(students, (long) students.size());

        } catch (Exception e) {
            log.error("根据专业查询学生失败", e);
            return Result.fail("Query failed: " + e.getMessage());
        }
    }

    /**
     * 根据入学年份查询本学校学生
     */
    public Result<List<Student>> getStudentsByYear(String teacherId, Integer year) {
        try {
            log.info("教师根据入学年份查询本学校学生: {} - {}", teacherId, year);

            // 获取教师信息以确定学校ID
            Optional<Teacher> teacherOpt = teacherRepository.findByTeacherId(teacherId);
            if (!teacherOpt.isPresent()) {
                return Result.fail("Teacher information does not exist");
            }

            Teacher teacher = teacherOpt.get();
            String schoolId = teacher.getSchoolId();

            // 只查询本学校指定入学年份的学生
            List<Student> students = studentRepository.findByEnrollmentYearAndSchoolId(year, schoolId);
            students.forEach(student -> student.setPassword(null));

            log.info("本学校 {} 年入学的学生有 {} 个", year, students.size());
            return Result.success(students, (long) students.size());

        } catch (Exception e) {
            log.error("根据入学年份查询学生失败", e);
            return Result.fail("查Query failed: " + e.getMessage());
        }
    }

    /**
     * 根据姓名模糊查询学生
     */
    public Result<List<Student>> searchStudentsByName(String name) {
        try {
            log.info("教师根据姓名搜索学生: {}", name);

            List<Student> students = studentRepository.findByFullNameContaining(name);
            students.forEach(student -> student.setPassword(null));

            log.info("姓名包含 '{}' 的学生有 {} 个", name, students.size());
            return Result.success(students, (long) students.size());

        } catch (Exception e) {
            log.error("根据姓名搜索学生失败", e);
            return Result.fail("Search failed: " + e.getMessage());
        }
    }

    /**
     * 获取学生申请工作统计数据
     */
    public Result<StudentApplicationStatsResponse> getStudentApplicationStats(String teacherId) {
        try {
            log.info("教师获取学生申请工作统计数据: teacherId={}", teacherId);

            Optional<Teacher> teacherOpt = teacherRepository.findByTeacherId(teacherId);
            if (!teacherOpt.isPresent()) {
                return Result.fail("Teacher information does not exist");
            }

            Teacher teacher = teacherOpt.get();
            String schoolId = teacher.getSchoolId();

            List<Student> students = studentRepository.findBySchoolId(schoolId);
            List<Job> jobs = jobRepository.findAll();

            // 过滤掉没有申请任何职位的学生
            List<Student> studentsWithApplications = students.stream()
                    .filter(student -> student.getAppliedJobs() != null && !student.getAppliedJobs().isEmpty())
                    .collect(Collectors.toList());

            // 处理重复 jobId
            Map<String, Job> jobMap = jobs.stream()
                    .collect(Collectors.toMap(
                            Job::getJobId,
                            Function.identity(),
                            (existing, duplicate) -> {
                                log.warn("Duplicate jobId detected: {}, using the first occurrence", existing.getJobId());
                                return existing; // 保留第一个
                            }
                    ));

            // 按年级统计（只统计有申请的学生）
            List<StudentApplicationStatsResponse.GradeStats> gradeStatsList = calculateGradeStats(studentsWithApplications, jobMap);

            // 按专业统计（只统计有申请的学生）
            List<StudentApplicationStatsResponse.MajorStats> majorStatsList = calculateMajorStats(studentsWithApplications, jobMap);

            long totalApplications = studentsWithApplications.stream()
                    .mapToLong(student -> student.getAppliedJobs().size())
                    .sum();
            long totalStudents = studentsWithApplications.size();

            StudentApplicationStatsResponse response = new StudentApplicationStatsResponse();
            response.setGradeStats(gradeStatsList);
            response.setMajorStats(majorStatsList);
            response.setTotalApplications(totalApplications);
            response.setTotalStudents(totalStudents);

            log.info("学生申请统计完成: 总学生数={}, 总申请数={}", totalStudents, totalApplications);
            return Result.success(response, "The statistical data was successfully obtained");

        } catch (Exception e) {
            log.error("获取学生申请统计数据失败", e);
            return Result.fail("The acquisition of statistical data failed: " + e.getMessage());
        }
    }



    /**
     * 按年级统计学生申请数据
     */
//    private List<StudentApplicationStatsResponse.GradeStats> calculateGradeStats(List<Student> students,
//                                                                                 Map<String, Job> jobMap) {
//        Map<String, StudentApplicationStatsResponse.GradeStats> gradeStatsMap = new HashMap<>();
//
//        for (Student student : students) {
//            String grade = calculateGrade(student.getEnrollmentYear());
//                  StudentApplicationStatsResponse.GradeStats gradeStats = gradeStatsMap.computeIfAbsent(grade,
//                    k -> new StudentApplicationStatsResponse.GradeStats(k, 0L, 0L, 0L, 0L));
//
//            // 增加该年级学生总数
//            gradeStats.setTotalStudents(gradeStats.getTotalStudents() + 1);
//
//            // 统计申请数据
//            for (String jobId : student.getAppliedJobs()) {
//                Job job = jobMap.get(jobId);
//                if (job != null) {
//                    if ("intern".equals(job.getJobType())) {
//                        gradeStats.setInternshipApplications(gradeStats.getInternshipApplications() + 1);
//                    } else if ("full-time-campus".equals(job.getJobType())) {
//                        gradeStats.setFullTimeApplications(gradeStats.getFullTimeApplications() + 1);
//                    }
//                    gradeStats.setTotalApplications(gradeStats.getTotalApplications() + 1);
//                }
//            }
//        }
//
//        return new ArrayList<>(gradeStatsMap.values());
//    }

    private List<StudentApplicationStatsResponse.GradeStats> calculateGradeStats(
            List<Student> students,
            Map<String, Job> jobMap) {

        // ✅ 一次性查出所有学校，放入 Map 缓存
        Map<String, School> schoolMap = schoolRepository.findAll()
                .stream()
                .collect(Collectors.toMap(School::getSchoolId, Function.identity()));

        Map<String, StudentApplicationStatsResponse.GradeStats> gradeStatsMap = new HashMap<>();

        for (Student student : students) {
            String schoolId = student.getSchoolId();

            // 从缓存里取学校 -> 获取国家
            School school = schoolMap.get(schoolId);
            String country = (school != null) ? school.getCountry() : "中国"; // 没查到默认 CN



            // 调用教育系统计算年级
            String grade = educationSystemCalculator.calculateGrade(
                    country,
                    student.getEnrollmentYear(),
                    student.getIsMaster(),
                    student.getIsPhd()
            );


            // 构建/更新 GradeStats
            StudentApplicationStatsResponse.GradeStats gradeStats =
                    gradeStatsMap.computeIfAbsent(
                            grade,
                            k -> new StudentApplicationStatsResponse.GradeStats(k, 0L, 0L, 0L, 0L)
                    );

            gradeStats.setTotalStudents(gradeStats.getTotalStudents() + 1);

            for (String jobId : student.getAppliedJobs()) {
                Job job = jobMap.get(jobId);
                if (job != null) {
                    if ("intern".equals(job.getJobType())) {
                        gradeStats.setInternshipApplications(gradeStats.getInternshipApplications() + 1);
                    } else if ("full-time-campus".equals(job.getJobType())) {
                        gradeStats.setFullTimeApplications(gradeStats.getFullTimeApplications() + 1);
                    }
                    gradeStats.setTotalApplications(gradeStats.getTotalApplications() + 1);
                }
            }
        }

        return new ArrayList<>(gradeStatsMap.values());
    }

    /**
     * 按专业统计学生申请数据
     */
    private List<StudentApplicationStatsResponse.MajorStats> calculateMajorStats(List<Student> students,
                                                                                 Map<String, Job> jobMap) {
        Map<String, StudentApplicationStatsResponse.MajorStats> majorStatsMap = new HashMap<>();

        for (Student student : students) {
            String major = student.getMajor();

            StudentApplicationStatsResponse.MajorStats majorStats = majorStatsMap.computeIfAbsent(major,
                    k -> new StudentApplicationStatsResponse.MajorStats(k, 0L, 0L, 0L, 0L));

            // 增加该专业学生总数
            majorStats.setTotalStudents(majorStats.getTotalStudents() + 1);

            // 统计申请数据
            for (String jobId : student.getAppliedJobs()) {
                Job job = jobMap.get(jobId);
                if (job != null) {
                    if ("intern".equals(job.getJobType())) {
                        majorStats.setInternshipApplications(majorStats.getInternshipApplications() + 1);
                    } else if ("full-time-campus".equals(job.getJobType())) {
                        majorStats.setFullTimeApplications(majorStats.getFullTimeApplications() + 1);
                    }
                    majorStats.setTotalApplications(majorStats.getTotalApplications() + 1);
                }
            }
        }

        return new ArrayList<>(majorStatsMap.values());
    }

    /**
     * 根据入学年份计算年级
     */
    private String calculateGrade(Integer enrollmentYear) {
        if (enrollmentYear == null) {
            return "Unknown";
        }

        int currentYear = Year.now().getValue();
        int grade = currentYear - enrollmentYear + 1;

        switch (grade) {
            case 1:
                return "Freshman";
            case 2:
                return "Sophomore";
            case 3:
                return "Junior";
            case 4:
                return "Senior";
            case 5:
            case 6:
                return "Graduate";
            default:
                return grade > 6 ? "Doctoral" : "Preparatory";
        }
    }

    /**
     * 获取企业收到工作申请统计数据
     */



    /**
     * 获取本校学生收到工作申请统计数据
     */
//    public Result<CompanyApplicationStatsResponse> getSchoolApplicationStats(String teacherId) {
//        try {
//            log.info("获取本校学生工作申请统计数据");
//
//            // 1) 获取教师的schoolId
//            Teacher teacher = teacherRepository.findByTeacherId(teacherId).orElse(null);
//            if (teacher == null) {
//                return Result.fail("教师信息不存在");
//            }
//            String schoolId = teacher.getSchoolId();
//            log.info("教师 {} 所在学校 ID: {}", teacherId, schoolId);
//
//            // 2) 查找属于该学校的所有学生
//            List<Student> students = studentRepository.findBySchoolId(schoolId);
//            log.info("找到 {} 个学生", students.size());
//
//            // 3) 获取职位和公司数据
//            List<Job> jobs = jobRepository.findAll();
//            Map<String, Job> jobMap = jobs.stream()
//                    .collect(Collectors.toMap(Job::getJobId, j -> j));
//            log.info("找到 {} 个职位", jobs.size());
//
//            List<Company> companies = companyRepository.findAll();
//            Map<String, Company> companyMap = companies.stream()
//                    .collect(Collectors.toMap(Company::getCompanyId, c -> c));
//            log.info("找到 {} 个企业", companies.size());
//
//            // 常量（可改为枚举）
//            final String TYPE_INTERNSHIP = "intern";
//            final String TYPE_FULLTIME_CAMPUS = "full-time-campus";
//
//            // 1) 先把所有企业放到统计表，保证“0 申请 / 0 职位”的企业也能展示
//            Map<String, CompanyApplicationStatsResponse.CompanyStats> companyStatsMap = new HashMap<>();
//            for (Company company : companies) {
//                companyStatsMap.put(
//                        company.getCompanyId(),
//                        new CompanyApplicationStatsResponse.CompanyStats(
//                                0, // rank
//                                company.getCompanyName(),
//                                company.getCompanyId(),
//                                0L, // totalApplications
//                                0L, // internshipApplications
//                                0L, // fullTimeApplications
//                                0L  // totalJobs
//                        )
//                );
//            }
//
//            // 2) 统计每个企业的职位数（即使没有任何申请也应计入）
//            for (Job job : jobs) {
//                CompanyApplicationStatsResponse.CompanyStats stats = companyStatsMap.get(job.getCompanyId());
//                if (stats != null) {
//                    stats.setTotalJobs(stats.getTotalJobs() + 1);
//                } else {
//                    log.warn("职位 {} 的公司 {} 不存在于公司表，跳过职位数统计", job.getJobId(), job.getCompanyId());
//                }
//            }
//
//            // 3) 统计申请数（判空、可选去重）
//            for (Student student : students) {
//                List<String> appliedJobs = student.getAppliedJobs();
//                if (appliedJobs == null || appliedJobs.isEmpty()) {
//                    continue;
//                }
//
//                // 若需要去重，避免同一学生对同一岗位多次计数
//                // Set<String> uniqueApplied = new HashSet<>(appliedJobs);
//                // for (String jobId : uniqueApplied) { ... }
//
//                for (String jobId : appliedJobs) {
//                    Job job = jobMap.get(jobId);
//                    if (job == null) {
//                        log.warn("学生 {} 申请的职位 {} 不存在，跳过", student.getId(), jobId);
//                        continue;
//                    }
//                    String companyId = job.getCompanyId();
//                    CompanyApplicationStatsResponse.CompanyStats stats = companyStatsMap.get(companyId);
//                    if (stats == null) {
//                        log.warn("职位 {} 指向的公司 {} 不存在，跳过", jobId, companyId);
//                        continue;
//                    }
//
//                    // 分类累计
//                    if (TYPE_INTERNSHIP.equals(job.getJobType())) {
//                        stats.setInternshipApplications(stats.getInternshipApplications() + 1);
//                    } else if (TYPE_FULLTIME_CAMPUS.equals(job.getJobType())) {
//                        stats.setFullTimeApplications(stats.getFullTimeApplications() + 1);
//                    }
//                    stats.setTotalApplications(stats.getTotalApplications() + 1);
//                }
//            }
//
//            // 4) 排序与排名（简单排名；如需并列名次可调整）
//            List<CompanyApplicationStatsResponse.CompanyStats> companyStatsList =
//                    new ArrayList<>(companyStatsMap.values());
//            companyStatsList.sort(Comparator.comparingLong(
//                    CompanyApplicationStatsResponse.CompanyStats::getTotalApplications).reversed());
//
//            for (int i = 0; i < companyStatsList.size(); i++) {
//                companyStatsList.get(i).setRank(i + 1);
//            }
//            log.info("企业统计列表大小: {}", companyStatsList.size());
//
//            // 5) 统一汇总
//            long totalApplications = companyStatsList.stream()
//                    .mapToLong(CompanyApplicationStatsResponse.CompanyStats::getTotalApplications)
//                    .sum();
//            long totalCompanies = companyStatsList.size();
//
//            CompanyApplicationStatsResponse response = new CompanyApplicationStatsResponse();
//            response.setCompanyStats(companyStatsList);
//            response.setTotalApplications(totalApplications);
//            response.setTotalCompanies(totalCompanies);
//
//            log.info("企业申请统计完成: 总企业数={}, 总申请数={}", totalCompanies, totalApplications);
//            return Result.success(response, "统计数据获取成功");
//
//        } catch (Exception e) {
//            log.error("获取企业申请统计数据失败", e);
//            return Result.fail("统计数据获取失败: " + e.getMessage());
//        }
//    }

    public Result<CompanyApplicationStatsResponse> getSchoolApplicationStats(String teacherId) {
        try {
            log.info("获取本校学生工作申请统计数据");

            Teacher teacher = teacherRepository.findByTeacherId(teacherId).orElse(null);
            if (teacher == null) {
                return Result.fail("Teacher information does not exist");
            }
            String schoolId = teacher.getSchoolId();
            log.info("教师 {} 所在学校 ID: {}", teacherId, schoolId);

            List<Student> students = studentRepository.findBySchoolId(schoolId);
            log.info("找到 {} 个学生", students.size());

            List<Job> jobs = jobRepository.findAll();
            Map<String, Job> jobMap = jobs.stream()
                    .collect(Collectors.toMap(
                            Job::getJobId,
                            Function.identity(),
                            (existing, duplicate) -> {
                                log.warn("Duplicate jobId detected: {}, using the first occurrence", existing.getJobId());
                                return existing;
                            }
                    ));
            log.info("找到 {} 个职位", jobs.size());

            List<Company> companies = companyRepository.findAll();
            Map<String, Company> companyMap = companies.stream()
                    .collect(Collectors.toMap(Company::getCompanyId, Function.identity()));
            log.info("找到 {} 个企业", companies.size());

            final String TYPE_INTERNSHIP = "intern";
            final String TYPE_FULLTIME_CAMPUS = "full-time-campus";

            Map<String, CompanyApplicationStatsResponse.CompanyStats> companyStatsMap = new HashMap<>();
            for (Company company : companies) {
                companyStatsMap.put(
                        company.getCompanyId(),
                        new CompanyApplicationStatsResponse.CompanyStats(
                                0, company.getCompanyName(), company.getCompanyId(),
                                0L, 0L, 0L, 0L
                        )
                );
            }

            for (Job job : jobs) {
                CompanyApplicationStatsResponse.CompanyStats stats = companyStatsMap.get(job.getCompanyId());
                if (stats != null) {
                    stats.setTotalJobs(stats.getTotalJobs() + 1);
                } else {
                    log.warn("职位 {} 的公司 {} 不存在于公司表，跳过职位数统计", job.getJobId(), job.getCompanyId());
                }
            }

            for (Student student : students) {
                List<String> appliedJobs = student.getAppliedJobs();
                if (appliedJobs == null || appliedJobs.isEmpty()) continue;

                for (String jobId : appliedJobs) {
                    Job job = jobMap.get(jobId);
                    if (job == null) {
                        log.warn("学生 {} 申请的职位 {} 不存在，跳过", student.getId(), jobId);
                        continue;
                    }

                    String companyId = job.getCompanyId();
                    CompanyApplicationStatsResponse.CompanyStats stats = companyStatsMap.get(companyId);
                    if (stats == null) {
                        log.warn("职位 {} 对应的公司 {} 不存在，跳过", jobId, companyId);
                        continue;
                    }

                    if (TYPE_INTERNSHIP.equals(job.getJobType())) {
                        stats.setInternshipApplications(stats.getInternshipApplications() + 1);
                    } else if (TYPE_FULLTIME_CAMPUS.equals(job.getJobType())) {
                        stats.setFullTimeApplications(stats.getFullTimeApplications() + 1);
                    }
                    stats.setTotalApplications(stats.getTotalApplications() + 1);
                }
            }

            List<CompanyApplicationStatsResponse.CompanyStats> companyStatsList = companyStatsMap.values().stream()
                    .filter(stats -> stats.getTotalApplications() > 0)
                    .sorted(Comparator.comparingLong(CompanyApplicationStatsResponse.CompanyStats::getTotalApplications).reversed())
                    .collect(Collectors.toList());

            for (int i = 0; i < companyStatsList.size(); i++) {
                companyStatsList.get(i).setRank(i + 1);
            }

            long totalApplications = companyStatsList.stream()
                    .mapToLong(CompanyApplicationStatsResponse.CompanyStats::getTotalApplications)
                    .sum();
            long totalCompanies = companyStatsList.size();

            CompanyApplicationStatsResponse response = new CompanyApplicationStatsResponse();
            response.setCompanyStats(companyStatsList);
            response.setTotalApplications(totalApplications);
            response.setTotalCompanies(totalCompanies);

            return Result.success(response, "The statistical data was successfully obtained");

        } catch (Exception e) {
            log.error("获取企业申请统计数据失败", e);
            return Result.fail("The acquisition of statistical data failed: " + e.getMessage());
        }
    }


    /**
     * 修改教师个人信息
     */
    public Result<Teacher> updateTeacherProfile(String teacherId, UpdateTeacherProfileRequest request) {
        try {
            log.info("教师修改个人信息: teacherId={}", teacherId);

            // 验证教师是否存在
            Optional<Teacher> teacherOpt = teacherRepository.findByTeacherId(teacherId);
            if (!teacherOpt.isPresent()) {
                return Result.fail("Teacher information does not exist");
            }

            Teacher teacher = teacherOpt.get();

            // 更新教师信息（只更新名字和头像）
            teacher.setName(request.getName());
            if (request.getAvatarPath() != null) {
                teacher.setAvatarPath(request.getAvatarPath());
            }

            Teacher updatedTeacher = teacherRepository.save(teacher);

            // 清除密码信息
            updatedTeacher.setPassword(null);

            log.info("教师个人信息修改成功: {}", updatedTeacher.getName());
            return Result.success(updatedTeacher, "The personal information has been modified successfully");

        } catch (Exception e) {
            log.error("修改教师个人信息失败", e);
            return Result.fail("Failed to modify personal information: " + e.getMessage());
        }
    }

    /**
     * 修改教师密码
     */
    public Result<String> changeTeacherPassword(String teacherId, ChangePasswordRequest request) {
        try {
            log.info("教师修改密码: teacherId={}", teacherId);

            // 验证新密码和确认密码是否一致
            if (!request.getNewPassword().equals(request.getConfirmPassword())) {
                return Result.fail("The new password is inconsistent with the confirmation password");
            }

            // 验证教师是否存在
            Optional<Teacher> teacherOpt = teacherRepository.findByTeacherId(teacherId);
            if (!teacherOpt.isPresent()) {
                return Result.fail("Teacher information does not exist");
            }

            Teacher teacher = teacherOpt.get();
            //原密码
            String oldPassword = request.getCurrentPassword();
            String oldPasswordHash = PasswordUtil.encryptPassword(oldPassword);
            Boolean isoldPasswordCorrect = PasswordUtil.checkPassword(oldPassword, oldPasswordHash);


            // 验证当前密码是否正确
            if (!isoldPasswordCorrect) {
                return Result.fail("The current password is incorrect");
            }

            //新密码
            String newPassword = request.getNewPassword();
            String newPasswordHash = PasswordUtil.encryptPassword(newPassword);
            teacher.setPassword(newPasswordHash);
            teacherRepository.save(teacher);

            log.info("教师密码修改成功: {}", teacher.getName());
            return Result.success("The password has been modified successfully.");

        } catch (Exception e) {
            log.error("修改教师密码失败", e);
            return Result.fail("Failed to modify the password: " + e.getMessage());
        }
    }

    /**
     * 获取教师个人信息
     */
    public Result<Teacher> getTeacherProfile(String teacherId) {
        try {
            log.info("获取教师个人信息: teacherId={}", teacherId);

            Optional<Teacher> teacherOpt = teacherRepository.findByTeacherId(teacherId);
            if (!teacherOpt.isPresent()) {
                return Result.fail("Teacher information does not exist");
            }

            Teacher teacher = teacherOpt.get();
            // 清除密码信息
            teacher.setPassword(null);

            return Result.success(teacher, "Personal information was successfully obtained");

        } catch (Exception e) {
            log.error("获取教师个人信息失败", e);
            return Result.fail("Failed to obtain personal information: " + e.getMessage());
        }
    }

    /**
     * 批量导入学生Excel文件
     */
    /**
     * 批量导入学生Excel文件
     */
    public Result<StudentBatchImportResponse> importStudentsFromExcel(String teacherId, MultipartFile file) {
        try {
            log.info("教师批量导入学生Excel: teacherId={}, fileName={}", teacherId, file.getOriginalFilename());

            // 验证教师是否存在
            Optional<Teacher> teacherOpt = teacherRepository.findByTeacherId(teacherId);
            if (!teacherOpt.isPresent()) {
                return Result.fail("Teacher information does not exist");
            }

            Teacher teacher = teacherOpt.get();
            String schoolId = teacher.getSchoolId();

            if (schoolId == null || schoolId.trim().isEmpty()) {
                return Result.fail("The teacher is not associated with a school. Please contact the administrator");
            }

            // 验证文件类型
            if (!isExcelFile(file)) {
                return Result.fail("Please upload an Excel file (in .xlsx or .xls format)");
            }

            // 解析Excel文件
            List<StudentExcelImportRequest> studentDataList = parseExcelFile(file);

            if (studentDataList.isEmpty()) {
                return Result.fail("There is no valid student data in the Excel file");
            }

            // 批量导入学生
            StudentBatchImportResponse response = batchImportStudents(studentDataList, schoolId);

            log.info("Excel导入完成: {}", response.getSummary());

            // 检查是否有重复学生或其他错误
            if (response.hasErrors()) {
                // 检查是否有重复学生的错误
                boolean hasDuplicateErrors = response.getErrors().stream()
                        .anyMatch(error -> error.getErrorMessage().contains("already exist"));

                if (hasDuplicateErrors) {
                    // 构建详细的重复信息
                    StringBuilder duplicateInfo = new StringBuilder("Import failed: There is duplicate student information。");
                    response.getErrors().stream()
                            .filter(error -> error.getErrorMessage().contains("already exist"))
                            .forEach(error -> duplicateInfo.append(String.format(" Line%d：%s(%s) - %s;",
                                    error.getRowNumber(), error.getFullName(), error.getStudentId(),
                                    error.getErrorMessage())));

                    return Result.fail(duplicateInfo.toString());
                } else {
                    return Result.fail("Partial import failed：" + response.getSummary());
                }
            }

            return Result.success(response, "Excel import completed");

        } catch (Exception e) {
            log.error("ExcelImport failed", e);
            return Result.fail("Excel import failed: " + e.getMessage());
        }
    }

    /**
     * 验证是否为Excel文件
     */
    private boolean isExcelFile(MultipartFile file) {
        String fileName = file.getOriginalFilename();
        return fileName != null && (fileName.endsWith(".xlsx") || fileName.endsWith(".xls"));
    }

    /**
     * 解析Excel文件
     */
    private List<StudentExcelImportRequest> parseExcelFile(MultipartFile file) throws IOException {
        List<StudentExcelImportRequest> studentDataList = new ArrayList<>();

        try (InputStream inputStream = file.getInputStream()) {
            Workbook workbook = null;

            // 根据文件扩展名创建相应的工作簿
            String fileName = file.getOriginalFilename();
            if (fileName != null && fileName.endsWith(".xlsx")) {
                workbook = new XSSFWorkbook(inputStream);
            } else if (fileName != null && fileName.endsWith(".xls")) {
                workbook = new HSSFWorkbook(inputStream);
            }

            if (workbook == null) {
                throw new IOException("无法解析Excel文件");
            }

            // 循环所有工作簿（Sheets）
            for (int sheetIndex = 0; sheetIndex < workbook.getNumberOfSheets(); sheetIndex++) {
                Sheet sheet = workbook.getSheetAt(sheetIndex);

                // 跳过标题行，从第二行开始读取数据
                for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                    Row row = sheet.getRow(i);
                    if (row == null)
                        continue;

                    StudentExcelImportRequest studentData = parseRowToStudentData(row, i + 1);
                    if (studentData != null) {
                        studentDataList.add(studentData);
                    }
                }
            }

            workbook.close();
        }

        return studentDataList;
    }

    /**
     * 解析Excel行数据为学生数据对象
     */
    private StudentExcelImportRequest parseRowToStudentData(Row row, int rowNumber) {
        try {
            StudentExcelImportRequest studentData = new StudentExcelImportRequest();
            studentData.setRowNumber(rowNumber);

            // 读取各列数据 (fullname, studentId, email, major, grade, studentType)
            Cell fullNameCell = row.getCell(0);
            Cell studentIdCell = row.getCell(1);
            Cell emailCell = row.getCell(2);
            Cell majorCell = row.getCell(3);
            Cell gradeCell = row.getCell(4);
            Cell studentTypeCell = row.getCell(5);

            studentData.setFullName(getCellStringValue(fullNameCell));
            studentData.setStudentId(getCellStringValue(studentIdCell));
            studentData.setEmail(getCellStringValue(emailCell));
            studentData.setMajor(getCellStringValue(majorCell));
            studentData.setGrade(getCellStringValue(gradeCell));
            studentData.setStudentType(getCellStringValue(studentTypeCell));

            return studentData;

        } catch (Exception e) {
            log.warn("解析第{}行数据失败: {}", rowNumber, e.getMessage());
            return null;
        }
    }

    /**
     * 获取单元格字符串值
     */
    private String getCellStringValue(Cell cell) {
        if (cell == null) {
            return null;
        }

        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue().trim();
            case NUMERIC:
                // 如果是数字，转换为字符串
                if (DateUtil.isCellDateFormatted(cell)) {
                    return cell.getDateCellValue().toString();
                } else {
                    // 处理整数，避免小数点
                    double numericValue = cell.getNumericCellValue();
                    if (numericValue == (long) numericValue) {
                        return String.valueOf((long) numericValue);
                    } else {
                        return String.valueOf(numericValue);
                    }
                }
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            case FORMULA:
                return cell.getCellFormula();
            default:
                return null;
        }
    }

    /**
     * 批量导入学生数据
     */
    private StudentBatchImportResponse batchImportStudents(List<StudentExcelImportRequest> studentDataList,
                                                           String schoolId) {
        StudentBatchImportResponse response = new StudentBatchImportResponse();
        response.setTotalRows(studentDataList.size());

        for (StudentExcelImportRequest studentData : studentDataList) {
            try {
                if (!studentData.isValid()) {
                    response.addError(studentData.getRowNumber(),
                            studentData.getFullName(),
                            null,
                            studentData.getValidationError());
                    continue;
                }

                // 邮箱查重（全局唯一）
                if (studentRepository.findByEmail(studentData.getEmail()).isPresent()) {
                    response.addError(studentData.getRowNumber(),
                            studentData.getFullName(),
                            studentData.getStudentId(),
                            "The mailbox already exists.");
                    continue;
                }

                // Excel 里传入的原始学号
                String rawStudentId = studentData.getStudentId();
                if (rawStudentId == null || rawStudentId.trim().isEmpty()) {
                    response.addError(studentData.getRowNumber(),
                            studentData.getFullName(),
                            null,
                            "The student number cannot be empty");
                    continue;
                }

                // 存库用拼接后的学号
                String dbStudentId = schoolId + "_" + rawStudentId.trim();

                // 查重（本校内唯一）
                if (studentRepository.findByStudentIdAndSchoolId(dbStudentId, schoolId).isPresent()) {
                    response.addError(studentData.getRowNumber(),
                            studentData.getFullName(),
                            rawStudentId,
                            "This student number already exists in our school");
                    continue;
                }

                // 入学年份校验
                String year = studentData.getGrade();
                if (year == null || !year.matches("\\d{4}")) {
                    response.addError(studentData.getRowNumber(),
                            studentData.getFullName(),
                            rawStudentId,
                            "The year of enrollment is invalid.");
                    continue;
                }

                // 处理 studentType
                String studentType = (studentData.getStudentType() != null) ? studentData.getStudentType().toLowerCase().trim() : "";
                boolean isMaster = false;
                boolean isPhd = false;

                if (studentType.contains("master") || studentType.contains("masters") || studentType.contains("msc") || studentType.contains("ma") || studentType.contains("graduate") || studentType.contains("硕士")) {
                    isMaster = true;
                } else if (studentType.contains("phd") || studentType.contains("doctor") || studentType.contains("doctoral") || studentType.contains("dphil") || studentType.contains("doctorate") || studentType.contains("博士")) {
                    isPhd = true;
                } else if (studentType.contains("bachelor") || studentType.contains("undergraduate") || studentType.contains("bsc") || studentType.contains("ba") || studentType.contains("本科") || studentType.isEmpty()) {
                    // 默认本科
                } else {
                    // 未知类型，可以默认本科或报错
                    response.addError(studentData.getRowNumber(),
                            studentData.getFullName(),
                            rawStudentId,
                            "Invalid student type: " + studentData.getStudentType());
                    continue;
                }

                // 确保不能同时为 master 和 phd
                if (isMaster && isPhd) {
                    response.addError(studentData.getRowNumber(),
                            studentData.getFullName(),
                            rawStudentId,
                            "Student type cannot be both Master and PhD");
                    continue;
                }

                // 自动生成初始密码
                String initialPassword = PasswordUtil.generateRandomPassword(8);
                String passwordHash = PasswordUtil.encryptPassword(initialPassword);

                Student student = new Student();
                student.setFullName(studentData.getFullName().trim());
                student.setStudentId(dbStudentId);        // 存拼接后的学号
//                student.setRawStudentId(rawStudentId);    // 如果你想保留原始学号，需要在表里加字段
                student.setEmail(studentData.getEmail().trim());
                student.setMajor(studentData.getMajor().trim());
                student.setEnrollmentYear(Integer.valueOf(year));
                student.setPassword(passwordHash);
                student.setSchoolId(schoolId);
                student.setStatus("active");
                student.setIsMaster(isMaster);
                student.setIsPhd(isPhd);

                studentRepository.save(student);
                response.incrementSuccess();

                // 异步发送初始密码邮件
                sendInitialPasswordEmail(student, schoolId, initialPassword);

                log.info("成功导入学生: {} - {}", student.getFullName(), student.getStudentId());

            } catch (Exception e) {
                log.error("导入第{}行学生数据失败: {}", studentData.getRowNumber(), e.getMessage());
                response.addError(studentData.getRowNumber(),
                        studentData.getFullName(),
                        studentData.getStudentId(),
                        "Import failed: " + e.getMessage());
            }
        }

        return response;
    }

    /**
     * 发送学生初始密码邮件
     */
    @Async("emailExecutor")
    public void sendInitialPasswordEmail(Student student, String schoolId, String initialPassword) {
        try {
            Optional<School> schoolOpt = schoolRepository.findBySchoolId(schoolId);
            if (!schoolOpt.isPresent()) {
                log.warn("发送学生密码邮件失败：找不到学校信息 - schoolId: {}", schoolId);
                return;
            }

            School school = schoolOpt.get();

            boolean emailSent = emailServices.sendEmail(
                    student.getEmail(),
                    student.getFullName(),
                    school.getUniversityName(),
                    initialPassword,
                    EmailServices.EmailType.STUDENT_INITIAL_PASSWORD,
                    null,
                    null
            );

            if (emailSent) {
                log.info("学生初始密码邮件发送成功: {} - {}", student.getFullName(), student.getEmail());
            } else {
                log.warn("学生初始密码邮件发送失败: {} - {}, 密码: {}",
                        student.getFullName(), student.getEmail(), initialPassword);
            }
        } catch (Exception e) {
            log.error("发送学生初始密码邮件异常: {} - {}", student.getFullName(), e.getMessage(), e);
        }
    }
    // ==================== 角色权限管理方法 ====================

    /**
     * 创建教师管理角色
     */
    public Result<TRole> createTRole(RoleCreateRequest request) {
        try {
            log.info("创建教师管理角色: {}", request.getRoleName());

            // 检查角色名称是否已存在
            if (tRoleRepository.existsByRoleName(request.getRoleName())) {
                return Result.fail("The name of the permission role already exists");
            }
            // 创建角色实体
            TRole tRole = new TRole();
            org.springframework.beans.BeanUtils.copyProperties(request, tRole);

            TRole savedRole = tRoleRepository.save(tRole);
            log.info("教师管理The permission role has been created successfully: {}", savedRole.getRoleName());
            return Result.success(savedRole, "The permission role has been created successfully");

        } catch (Exception e) {
            log.error("创建教师管理角色失败", e);
            return Result.fail("Failed to create the permission role: " + e.getMessage());
        }
    }

    /**
     * 查看所有教师管理角色
     */
    public Result<List<TRole>> getAllTRoles() {
        try {
            log.info("查看所有教师管理角色");
            List<TRole> roles = tRoleRepository.findAll();

            // 计算每个角色的用户数量
            for (TRole role : roles) {
                List<Teacher> teachers = teacherRepository.findByRole(role.getRoleName());
                role.setUsersCount(teachers.size());
            }

            log.info("查询到 {} 个教师管理角色", roles.size());
            return Result.success(roles, "Query successful");
        } catch (Exception e) {
            log.error("查询所有教师管理角色失败", e);
            return Result.fail("Query failed: " + e.getMessage());
        }
    }

    /**
     * 根据ID获取教师管理角色
     */
    public Result<TRole> getTRoleById(String id) {
        try {
            log.info("根据ID获取教师管理角色: {}", id);
            Optional<TRole> roleOpt = tRoleRepository.findById(id);
            if (roleOpt.isPresent()) {
                TRole role = roleOpt.get();
                // 计算该角色的用户数量
                List<Teacher> teachers = teacherRepository.findByRole(role.getRoleName());
                role.setUsersCount(teachers.size());
                return Result.success(role, "Query successful");
            } else {
                return Result.fail("The permission role does not exist");
            }
        } catch (Exception e) {
            log.error("根据ID获取教师管理角色失败", e);
            return Result.fail("Query failed: " + e.getMessage());
        }
    }

    /**
     * 更新教师管理角色
     */
    public Result<TRole> updateTRole(String id, RoleUpdateRequest request) {
        try {
            log.info("更新教师管理角色: {} - {}", id, request.getRoleName());

            // 检查角色是否存在
            Optional<TRole> roleOpt = tRoleRepository.findById(id);
            if (!roleOpt.isPresent()) {
                return Result.fail("The permission role does not exist");
            }

            // 检查角色名称是否与其他角色重复
            if (tRoleRepository.existsByRoleNameAndIdNot(request.getRoleName(), id)) {
                return Result.fail("The name of the permission role already exists");
            }

            // 更新角色信息
            TRole tRole = roleOpt.get();
            org.springframework.beans.BeanUtils.copyProperties(request, tRole);

            TRole savedRole = tRoleRepository.save(tRole);
            log.info("教师管理角色更新成功: {}", savedRole.getRoleName());
            return Result.success(savedRole, "The permission role does not exist");

        } catch (Exception e) {
            log.error("更新教师管理角色失败", e);
            return Result.fail("Failed to update the permission role: " + e.getMessage());
        }
    }

    /**
     * 删除教师管理角色
     */
    public Result<String> deleteTRole(String id) {
        try {
            log.info("删除教师管理角色: {}", id);

            // 1. 查询角色是否存在
            Optional<TRole> roleOpt = tRoleRepository.findById(id);
            if (!roleOpt.isPresent()) {
                return Result.fail("The permission role does not exist");
            }

            TRole role = roleOpt.get();
            String roleName = role.getRoleName();

            // 2. 检查是否有教师绑定该角色
            boolean isUsed = teacherRepository.existsByRole(roleName);
            if (isUsed) {
                log.warn("删除失败，角色 {} 已被使用", roleName);
                return Result.fail("Deletion failed: This permission role has already been used by the teacher and cannot be deleted");
            }

            // 3. 删除角色
            tRoleRepository.deleteById(id);
            log.info("教师管理角色删除成功: {}", id);
            return Result.success(id, "The permission role has been successfully deleted");

        } catch (Exception e) {
            log.error("删除教师管理角色失败", e);
            return Result.fail("Failed to delete the permission role: " + e.getMessage());
        }
    }


    // ==================== 用户管理方法 ====================

    /**
     * 获取本校教师用户
     */
    public Result<List<Teacher>> getTeachersBySchool(String teacherId) {
        try {
            log.info("获取本校教师用户: {}", teacherId);

            // 获取当前教师信息
            Optional<Teacher> currentTeacherOpt = teacherRepository.findByTeacherId(teacherId);
            if (!currentTeacherOpt.isPresent()) {
                return Result.fail("Teacher information does not exist");
            }

            Teacher currentTeacher = currentTeacherOpt.get();
            String schoolId = currentTeacher.getSchoolId();

            if (schoolId == null || schoolId.trim().isEmpty()) {
                return Result.fail("The teacher is not associated with a school. Please contact the administrator");
            }

            // 查询学校信息，获取 tadmin
            Optional<School> schoolOpt = schoolRepository.findBySchoolId(schoolId);
            if (!schoolOpt.isPresent()) {
                return Result.fail("School information does not exist");
            }
            String tadminId = schoolOpt.get().getTadmin();

            // 查询该学校所有教师
            List<Teacher> teachers = teacherRepository.findBySchoolId(schoolId);

            // 过滤掉 tadmin 对应的教师账号
            teachers = teachers.stream()
                    .filter(t -> !t.getTeacherId().equals(tadminId))
                    .peek(t -> t.setPassword(null)) // 清除密码信息
                    .collect(Collectors.toList());

            log.info("查询到本校 {} 个教师用户 (已排除tadmin)", teachers.size());
            return Result.success(teachers, "Query successful");
        } catch (Exception e) {
            log.error("查询本校教师用户失败", e);
            return Result.fail("Query failed: " + e.getMessage());
        }
    }


    /**
     * 创建教师用户（自动使用当前教师的学校ID）
     */
    public Result<Teacher> createTeacher(CreateTeacherRequest request, String currentTeacherId) {
        try {
            log.info("创建教师用户: {}", request.getEmail());

            // 获取当前教师信息以获取学校ID
            Optional<Teacher> currentTeacherOpt = teacherRepository.findByTeacherId(currentTeacherId);

            if (!currentTeacherOpt.isPresent()) {
                return Result.fail("The current teacher information does not exist. Please log in again");
            }

            Teacher currentTeacher = currentTeacherOpt.get();
            String schoolId = currentTeacher.getSchoolId();
            String schoolName = schoolRepository.findBySchoolId(schoolId).get().getUniversityName();
            if (schoolId == null || schoolId.trim().isEmpty()) {
                return Result.fail("The current teacher is not associated with a school. Please contact the administrator");
            }

            // 检查邮箱是否已存在
            if (teacherRepository.findByEmail(request.getEmail()).isPresent()) {
                return Result.fail("The mailbox already exists.");
            }

            // 创建教师实体
            Teacher teacher = new Teacher();

            // 生成自定义教师ID（TEA+数字）
            String teacherId = generateTeacherId();
            teacher.setTeacherId(teacherId);
            teacher.setAvatarPath("/uploads/avatars/defaultavatarnull.png");
            teacher.setName(request.getName());
            teacher.setEmail(request.getEmail());
            teacher.setRole(request.getRole());
            teacher.setSchoolId(schoolId.trim()); // 自动使用当前教师的学校ID

            // 生成随机密码
            String randomPassword = PasswordUtil.generateRandomPassword(8);
            String encryptedPassword = PasswordUtil.encryptPassword(randomPassword);
            teacher.setPassword(encryptedPassword);
            String title = request.getRole();
            if (title.equals("Read-only User")) {
                title = "";
            }

            Teacher savedTeacher = teacherRepository.save(teacher);

            // 发送密码邮件
            Future<Boolean> emailFuture = emailServices.sendEmailAsync(
                    savedTeacher.getEmail(),
                    savedTeacher.getName(),
                    schoolName,
                    randomPassword,
                    EmailServices.EmailType.TEACHER_INITIAL_PASSWORD,
                    title,
                    null
            );

            boolean emailSent = false;
            try {
                emailSent = emailFuture.get(5, TimeUnit.SECONDS); // 最多等待 5 秒
            } catch (Exception e) {
                log.warn("发送教师初始密码邮件超时或失败: {}", e.getMessage());
            }

            savedTeacher.setPassword(null);

            String message = "The teacher user has been successfully created and has been automatically assigned to this school";
            if (emailSent) {
                message += "，The initial password has been sent to the email address";
            } else {
                message += "，However, the password email failed to be sent. Please notify the password manually: " + randomPassword;
            }

            return Result.success(savedTeacher, message);
        }
        catch (Exception e) {
            log.error("创建教师用户失败", e);
            return Result.fail("Create teacher user failed: " + e.getMessage());
        }
        }

    /**
     * 更新教师用户
     */
    public Result<Teacher> updateTeacher(String teacherId, UpdateTeacherRequest request) {
        try {
            log.info("更新教师用户: {} - {}", teacherId, request.getEmail());

            // 检查教师是否存在（使用teacherId查找）
            Optional<Teacher> teacherOpt = teacherRepository.findByTeacherId(teacherId);
            if (!teacherOpt.isPresent()) {
                return Result.fail("Teacher users do not exist");
            }

            // 检查邮箱是否与其他教师重复
            Optional<Teacher> existingTeacher = teacherRepository.findByEmail(request.getEmail());
            if (existingTeacher.isPresent() && !existingTeacher.get().getTeacherId().equals(teacherId)) {
                return Result.fail("The mailbox has been used by other users");
            }

            // 更新教师信息
            Teacher teacher = teacherOpt.get();
            teacher.setName(request.getName());
            teacher.setEmail(request.getEmail());
            teacher.setRole(request.getRole());
//            teacher.setSchoolId(request.getSchoolId());

            Teacher savedTeacher = teacherRepository.save(teacher);

            // 清除密码信息
            savedTeacher.setPassword(null);

            log.info("教师用户更新成功: {}", savedTeacher.getEmail());
            return Result.success(savedTeacher, "The user has updated successfully.");

        } catch (Exception e) {
            log.error("更新教师用户失败", e);
            return Result.fail("Failed to update the user: " + e.getMessage());
        }
    }

    /**
     * 删除教师用户
     */
    public Result<String> deleteTeacher(String teacherId,String teacherid) {
        try {
            log.info("删除教师用户: {}", teacherId);
            // 检查教师是否存在（使用teacherId查找）
            Optional<Teacher> teacherOpt = teacherRepository.findByTeacherId(teacherId);
            if (!teacherOpt.isPresent()) {
                return Result.fail("Teacher users do not exist");
            }
            // 获取当前登录教师ID
            String currentTeacherId = teacherid; // 根据你的项目实现

            if (teacherId.equals(currentTeacherId)) {
                log.warn("教师尝试删除自己: {}", teacherId);
                return Result.fail("You have no right to operate.");
            }



            // 使用MongoDB的id进行删除
            Teacher teacher = teacherOpt.get();
            teacherRepository.deleteById(teacher.getId());
            log.info("教师用户删除成功: {}", teacherId);
            return Result.success(teacherId, "The user was deleted successfully.");

        } catch (Exception e) {
            log.error("删除教师用户失败", e);
            return Result.fail("Failed to delete the user: " + e.getMessage());
        }
    }


    /**
     * 生成教师ID（TEA+数字）
     */
    private String generateTeacherId() {
        // 查询当前最大的教师编号
        List<Teacher> teachers = teacherRepository.findAll();
        int maxNumber = 0;

        for (Teacher teacher : teachers) {
            if (teacher.getTeacherId() != null && teacher.getTeacherId().startsWith("TEA")) {
                try {
                    String numberPart = teacher.getTeacherId().substring(3);
                    int number = Integer.parseInt(numberPart);
                    maxNumber = Math.max(maxNumber, number);
                } catch (NumberFormatException e) {
                    // 忽略格式不正确的ID
                }
            }
        }

        // 生成新的教师ID
        String teacherId = String.format("TEA%03d", maxNumber + 1);
        log.info("生成新的教师ID: {}", teacherId);
        return teacherId;
    }

    // ==================== 企业管理方法 ====================

    /**
     * 教师查看所有企业信息（分页和筛选）
     */
    public Result<List<Map<String, Object>>> getAllCompaniesForTeacher(int page, int size, String search,
                                                                       String industry, String companyType, String status) {
        try {
            log.info("教师查看所有企业: page={}, size={}, search={}", page, size, search);

            // 1. 获取符合条件的职位
            Query jobQuery = new Query();

            // 添加 jobType 限制条件，匹配 full-time-campus 和 intern
            jobQuery.addCriteria(Criteria.where("jobType").in("full-time-campus", "intern"));

            // 添加地区条件
            jobQuery.addCriteria(Criteria.where("workLocation").regex(HONG_KONG_REGEX, "i"));

            // 执行查询，获取职位列表
            List<Job> jobs = mongoTemplate.find(jobQuery, Job.class);

            // 2. 提取符合条件的公司ID
            Set<String> companyIds = jobs.stream()
                    .map(Job::getCompanyId)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toSet());

            // 如果没有符合条件的公司，直接返回空结果
            if (companyIds.isEmpty()) {
                return Result.success(Collections.emptyList(), "There are no eligible enterprises");
            }

            // 3. 根据 companyId 查找公司
            Query companyQuery = Query.query(Criteria.where("companyId").in(companyIds));
            List<Company> companyList = mongoTemplate.find(companyQuery, Company.class);

            // 应用筛选条件
            List<Company> filteredCompanies = companyList.stream()
                    .filter(company -> {
                        boolean matches = true;

                        // 搜索关键词筛选
                        if (search != null && !search.trim().isEmpty()) {
                            String searchLower = search.toLowerCase();
                            matches = matches && (company.getCompanyName().toLowerCase().contains(searchLower) ||
                                    company.getIndustry().toLowerCase().contains(searchLower) ||
                                    (company.getCompanyAddress() != null
                                            && company.getCompanyAddress().toLowerCase().contains(searchLower)));
                        }

                        // 行业筛选
                        if (industry != null && !industry.trim().isEmpty()) {
                            matches = matches && company.getIndustry().equals(industry);
                        }

                        // 企业类型筛选
                        if (companyType != null && !companyType.trim().isEmpty()) {
                            matches = matches && company.getCompanyType().equals(companyType);
                        }

                        // 状态筛选
                        if (status != null && !status.trim().isEmpty()) {
                            matches = matches && company.getStatus().equals(status);
                        }

                        return matches;
                    })
                    .collect(Collectors.toList());

            // 分页处理
            int start = page * size;
            int end = Math.min(start + size, filteredCompanies.size());
            List<Company> pagedCompanies = filteredCompanies.subList(start, end);

            // 转换为Map格式，包含职位数量统计
            List<Map<String, Object>> result = pagedCompanies.stream()
                    .map(company -> {
                        Map<String, Object> companyMap = new HashMap<>();
                        companyMap.put("id", company.getId());
                        companyMap.put("companyId", company.getCompanyId());
                        companyMap.put("name", company.getCompanyName());
                        companyMap.put("industry", company.getIndustry());
                        companyMap.put("companyType", company.getCompanyType());
                        companyMap.put("companyAddress", company.getCompanyAddress());
                        companyMap.put("contactPerson", company.getContactPerson());
                        companyMap.put("contactPhone", company.getContactPhone());
                        companyMap.put("contactEmail", company.getContactEmail());
                        companyMap.put("status", company.getStatus());

                        // 统计该企业的职位数量（仅统计 Intern / Full-Time-Campus）
                        long positions = jobs.stream()
                                .filter(job -> job.getCompanyId().equals(company.getCompanyId()))
                                .filter(job -> job.getJobType().equals("intern") || job.getJobType().equals("full-time-campus"))
                                .count();
                        companyMap.put("positions", positions);

                        return companyMap;
                    })
                    .collect(Collectors.toList());

            // 按照 positions 数量排序
            result.sort(Comparator.comparingLong((Map<String, Object> companyMap) -> (long) companyMap.get("positions"))
                    .reversed());  // reversed() 将排序从大到小

            log.info("教师查看企业成功: 总数={}, 筛选后={}, 当前页={}",
                    companyList.size(), filteredCompanies.size(), result.size());
            return Result.success(result, "Query successful");

        } catch (Exception e) {
            log.error("教师查看企业失败", e);
            return Result.fail("Query failed: " + e.getMessage());
        }
    }


    /**
     * 教师根据ID获取企业详情
     */
    public Result<Company> getCompanyByIdForTeacher(String companyId) {
        try {
            log.info("教师根据ID查询企业详细信息: {}", companyId);

            Optional<Company> companyOpt = companyRepository.findById(companyId);
            if (!companyOpt.isPresent()) {
                log.warn("企业不存在: {}", companyId);
                return Result.fail("The enterprise does not exist.");
            }

            Company company = companyOpt.get();
            log.info("查询到企业信息: {}", company.getCompanyName());
            return Result.success(company, "Query successful");

        } catch (Exception e) {
            log.error("查询企业详细信息失败: {}", e.getMessage(), e);
            return Result.fail("Query failed: " + e.getMessage());
        }
    }

    /**
     * 教师根据名称搜索企业
     */
    public Result<List<Company>> searchCompaniesByNameForTeacher(String name) {
        try {
            log.info("教师根据名称搜索企业: {}", name);

            List<Company> companies = companyRepository.findAll();
            List<Company> matchedCompanies = companies.stream()
                    .filter(company -> company.getCompanyName().toLowerCase().contains(name.toLowerCase()))
                    .collect(Collectors.toList());

            log.info("搜索到 {} 个匹配的企业", matchedCompanies.size());
            return Result.success(matchedCompanies, "Search successful");

        } catch (Exception e) {
            log.error("搜索企业失败", e);
            return Result.fail("Search failed: " + e.getMessage());
        }
    }


    /**
     * 教师上传头像
     */
    public Result<String> uploadAvatar(String teacherId, MultipartFile file) {
        try {
            log.info("教师上传头像: 教师ID={}, 文件名={}", teacherId, file.getOriginalFilename());

            // 数据验证
            if (teacherId == null || teacherId.trim().isEmpty()) {
                return Result.fail("The teacher ID cannot be empty");
            }

            // 验证教师是否存在
            Optional<Teacher> teacherOpt = teacherRepository.findByTeacherId(teacherId);
            if (!teacherOpt.isPresent()) {
                return Result.fail("Teacher users do not exist");
            }
            Teacher teacher = teacherOpt.get();
            // 验证文件
            if (file.isEmpty()) {
                return Result.fail("Please select the avatar file you want to upload");
            }

            String originalFilename = file.getOriginalFilename();
            if (originalFilename == null) {
                return Result.fail("The file name is invalid");
            }

            // 验证文件类型
            String fileExtension = getFileExtension(originalFilename);
            if (!isValidImageFormat(fileExtension)) {
                return Result.fail("Only image files in JPG, JPEG, PNG, and GIF formats are supported");
            }

            // 验证文件大小（最大5MB）
            if (file.getSize() > 5 * 1024 * 1024) {
                return Result.fail("The file size of the avatar cannot exceed 5MB");
            }

            // 创建上传目录
            File uploadDir = new File(AVATAR_UPLOAD_PATH);
            if (!uploadDir.exists()) {
                uploadDir.mkdirs();
            }

            // 删除旧头像文件
            if (teacher.getAvatarPath() != null && !teacher.getAvatarPath().isEmpty()) {
                deleteOldAvatarFile(teacher.getAvatarPath());
            }

            // 生成唯一文件名
            String fileName = teacherId + "_avatar_" + System.currentTimeMillis() + "." + fileExtension;
            Path filePath = Paths.get(AVATAR_UPLOAD_PATH + fileName);

            // 保存文件
            Files.copy(file.getInputStream(), filePath);

            // 更新教师头像路径,这个就是用短的，不能用AVATAR_UPLOAD_PATH
            String avatarUrl = AVATAR_API_PATH + fileName;
            teacher.setAvatarPath(avatarUrl);
            teacherRepository.save(teacher);

            log.info("头像上传成功: 教师ID={}, 文件路径={}", teacherId, avatarUrl);
            return Result.success(avatarUrl, "The avatar has been uploaded successfully.");

        } catch (IOException e) {
            log.error("头像上传失败: 教师ID={}", teacherId, e);
            return Result.fail("File upload failed: " + e.getMessage());
        } catch (Exception e) {
            log.error("头像上传过程中发生错误: 教师ID={}", teacherId, e);
            return Result.fail("fail to upload: " + e.getMessage());
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
     * 链接重置教师管理员账号
     */
    public Result<String> resetTeacherAdminPassword(String token, String newPassword,String confirmPassword) {
        if (!newPassword.equals(confirmPassword)) {
            return Result.fail("The new password and the confirmed password do not match.");
        }

        String teacherId = redisTemplate.opsForValue().get(RESET_KEY_PREFIX + token);
        if (teacherId == null) {
            return Result.fail("The link has expired or is invalid.");
        }

        Optional<Teacher> teacherOpt = teacherRepository.findByTeacherId(teacherId);
        if (!teacherOpt.isPresent()) {
            return Result.fail("Teacher information does not exist.");
        }

        Teacher teacher = teacherOpt.get();
        String newPasswordHash = PasswordUtil.encryptPassword(newPassword);
        teacher.setPassword(newPasswordHash);
        teacherRepository.save(teacher);

        // 删除 Redis token，防止重复使用
        redisTemplate.delete(RESET_KEY_PREFIX + token);

        return Result.success("Password reset successful");
    }
    /**
     * 验证重置密码token
     */
    public Result<String> validateToken(@RequestParam String token) {
        String teacherId = redisTemplate.opsForValue().get(RESET_KEY_PREFIX + token);
        if (teacherId == null) {
            return Result.fail("The link has expired or is invalid.");
        }
        return Result.success(teacherId, "Link is valid");
    }

}