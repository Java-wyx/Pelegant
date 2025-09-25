package com.x.pelegant.service;

import com.x.pelegant.common.Result;
import com.x.pelegant.dto.*;
import com.x.pelegant.dto.StudentStatisticsResponse;
import com.x.pelegant.entity.*;
import com.x.pelegant.repository.*;
import com.x.pelegant.util.JwtUtil;
import com.x.pelegant.config.JwtConfig;
import com.x.pelegant.util.PasswordUtil;
import com.x.pelegant.vo.ContinentCount;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.poi.hssf.usermodel.HSSFWorkbook;
import org.bson.Document;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.domain.Sort;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.*;
import java.util.concurrent.*;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * 项目管理员服务类
 */
@Service
@Slf4j
public class ProjectService {
    // 定义正则表达式常量
    private static final String HONG_KONG_REGEX = "^(HK|香港|Hong\\s?Kong|HongKong|HKSAR|Hong\\s?Kong\\s?SAR|HK\\s?SAR|香港特别行政区|香港岛|Hong\\s?Kong,\\s?Hong\\s?Kong\\s?SAR|[A-Za-z\\s&]+,\\s?HK|[A-Za-z\\s&]+,\\s?Hong\\s?Kong\\s?SAR|Remote,\\s?HK|[A-Za-z\\s&]+,\\s?Hong\\s?Kong)$";

    private static final String RESET_KEY_PREFIX = "teacher_reset_token:";
@Autowired
private StringRedisTemplate redisTemplate;
    @Autowired
    private ProjectRepository projectRepository;
    @Autowired
    private StudentActivityRepository studentActivityRepository;

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private SchoolRepository schoolRepository;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private TeacherRepository teacherRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private DashboardDataRepository dashboardDataRepository;

    @Autowired
    private PRoleRepository pRoleRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private DataMigrationService dataMigrationService;

    @Autowired
    private JwtConfig jwtConfig;

    @Autowired
    private EmailServices emailServices;

    @Autowired
    private CrawlerDataRepository crawlerDataRepository;

    @Autowired
    private ResumeDataRepository resumeDataRepository;

    @Autowired
    private RecommendedWorkRepository recommendedWorkRepository;

    @Autowired
    private MongoTemplate mongoTemplate;

    /**
     * 项目管理员登录验证
     */
    public Result<LoginResponse> login(String email, String password) {
        try {
            log.info("项目管理员登录尝试: {}", email);

            // 根据邮箱和密码查找项目管理员
            Optional<Project> projectOpt = projectRepository.findByEmail(email);
            Boolean isPasswordValid = PasswordUtil.checkPassword(password, projectOpt.get().getPassword());

            if (isPasswordValid) {
                Project project = projectOpt.get();

                // 检查状态是否活跃
                if (!"active".equals(project.getStatus())) {
                    log.warn("项目管理员账户已被禁用: {}", email);
                    return Result.fail("账户已被禁用，请联系系统管理员");
                }

                // 更新最后登录时间
                project.setLastLoginTime(LocalDateTime.now());
                projectRepository.save(project);

                // 生成JWT Token
                String token = jwtUtil.generateToken(
                        project.getId(),
                        project.getName(),
                        JwtConfig.UserRole.PROJECT.getValue());

                // 计算过期时间
                long expiresAt = System.currentTimeMillis() + jwtConfig.getExpiration();

                // 创建登录响应
                project.setPassword(null); // 不返回密码
                LoginResponse loginResponse = new LoginResponse(
                        token,
                        project.getId(),
                        project.getName(),
                        JwtConfig.UserRole.PROJECT.getValue(),
                        expiresAt,
                        project);

                log.info("项目管理员登录成功: {} - {}", project.getName(), project.getRole());
                return Result.success(loginResponse, "登录成功");
            } else {
                log.warn("项目管理员登录失败: {} - 邮箱或密码错误", email);
                return Result.fail("邮箱或密码错误");
            }
        } catch (Exception e) {
            log.error("项目管理员登录过程中发生错误", e);
            return Result.fail("登录失败: " + e.getMessage());
        }
    }

    /**
     * 添加企业
     */
    public Result<Company> addCompany(CompanyCreateRequest request) {
        try {
            log.info("项目管理员添加企业: {}", request.getCompanyName());

            // 检查企业名称是否已存在
            if (companyRepository.findByCompanyName(request.getCompanyName()).isPresent()) {
                return Result.fail("企业名称已存在");
            }

            // 创建企业实体
            Company company = new Company();

            // 自动生成企业编号
            String companyId = generateCompanyId();
            company.setCompanyId(companyId);

            // 手动设置字段值
            company.setCompanyName(request.getCompanyName());
            company.setIndustry(request.getIndustry());
            company.setCompanyType(request.getCompanyType());
            company.setCompanyAddress(request.getCompanyAddress());
            company.setContactPerson(request.getContactPerson());
            company.setContactPhone(request.getContactPhone());
            company.setContactEmail(request.getContactEmail());

            // 设置默认值
            company.setStatus(request.getStatus());

            Company savedCompany = companyRepository.save(company);
            log.info("企业添加成功: {} - {}", savedCompany.getCompanyName(), savedCompany.getCompanyId());
            return Result.success(savedCompany, "企业添加成功");

        } catch (Exception e) {
            log.error("添加企业失败", e);
            return Result.fail("添加企业失败: " + e.getMessage());
        }
    }

    /**
     * 添加职位
     */
    public Result<Job> addJob(JobCreateRequest request) {
        try {
            log.info("项目管理员添加职位: {}", request.getJobTitle());

            // 检查所属企业是否存在
            Optional<Company> companyOpt = companyRepository.findById(request.getCompanyId());
            if (!companyOpt.isPresent()) {
                return Result.fail("所属企业不存在");
            }

            // 创建职位实体
            Job job = new Job();
            BeanUtils.copyProperties(request, job);

            // 自动生成职位编号
            String jobId = generateJobId();
            job.setJobId(jobId);

            // 设置企业名称（冗余字段，便于查询）
            job.setCompanyName(companyOpt.get().getCompanyName());

            Job savedJob = jobRepository.save(job);
            log.info("职位添加成功: {} - {}", savedJob.getJobTitle(), savedJob.getJobId());
            return Result.success(savedJob, "职位添加成功");

        } catch (Exception e) {
            log.error("添加职位失败", e);
            return Result.fail("添加职位失败: " + e.getMessage());
        }
    }

    /**
     * 添加学校
     */
    public Result<School> addSchool(SchoolCreateRequest request) {
        try {
            log.info("项目管理员添加学校: {}", request.getUniversityName());

            // 数据验证
            if (request.getUniversityName() == null || request.getUniversityName().trim().isEmpty()) {
                return Result.fail("大学名称不能为空");
            }
            if (request.getUniversityType() == null || request.getUniversityType().trim().isEmpty()) {
                return Result.fail("大学类型不能为空");
            }
            if (request.getUniversityAddress() == null || request.getUniversityAddress().trim().isEmpty()) {
                return Result.fail("大学地址不能为空");
            }
            if (request.getAdminEmail() == null || request.getAdminEmail().trim().isEmpty()) {
                return Result.fail("管理员邮箱不能为空");
            }
            if (request.getUniversityDescription() == null || request.getUniversityDescription().trim().isEmpty()) {
                return Result.fail("大学简介不能为空");
            }
            if (request.getContinent() == null || request.getContinent().trim().isEmpty()) {
                return Result.fail("请选择洲");
            }
            if (request.getCountry() == null || request.getCountry().trim().isEmpty()) {
                return Result.fail("请选择国家");
            }

            // 检查大学名称是否已存在
            if (schoolRepository.findByUniversityName(request.getUniversityName()).isPresent()) {
                return Result.fail("大学名称已存在");
            }

            // 检查管理员邮箱是否已存在（在教师表中）
            if (teacherRepository.findByEmail(request.getAdminEmail()).isPresent()) {
                return Result.fail("管理员邮箱已存在，请使用其他邮箱");
            }

            // 验证大学类型是否有效
            if (!isValidUniversityType(request.getUniversityType())) {
                return Result.fail("大学类型无效，支持的类型：综合性大学、理工类大学、师范类大学、医药类大学、财经类大学、艺术类大学、体育类大学、农业类大学、语言类大学、政法类大学、其他");
            }

            // 创建学校实体
            School school = new School();
            BeanUtils.copyProperties(request, school);

            // 自动生成学校编号
            String schoolId = generateSchoolId();
            school.setSchoolId(schoolId);

            // 保存学校信息
            School savedSchool = schoolRepository.save(school);

            // 创建管理员教师记录
            Teacher adminTeacher = createAdminTeacher(request.getAdminEmail(), savedSchool);
            String originalPassword = PasswordUtil.generateRandomPassword(8);
            adminTeacher.setPassword(PasswordUtil.encryptPassword(originalPassword));
            Teacher savedTeacher = teacherRepository.save(adminTeacher);
            adminTeacher.setName("Administrator");

            // 更新学校记录关联管理员
            savedSchool.setTadmin(savedTeacher.getTeacherId());
            savedSchool = schoolRepository.save(savedSchool);

            // 异步发送初始密码邮件
            emailServices.sendEmailAsync(
                    savedTeacher.getEmail(),
                    savedTeacher.getName(),
                    savedSchool.getUniversityName(),
                    originalPassword,
                    EmailServices.EmailType.TEACHER_INITIAL_PASSWORD,
                    "Administrator",
                    null
            );

            String message = "学校添加成功，管理员账户已创建，初始密码邮件已发送（异步）";
            log.info("学校添加成功: {} - {} (管理员: {})", savedSchool.getUniversityName(),
                    savedSchool.getSchoolId(), savedTeacher.getEmail());

            return Result.success(savedSchool, message);

        } catch (Exception e) {
            log.error("添加学校失败", e);
            return Result.fail("添加学校失败: " + e.getMessage());
        }
    }

    /**
     * 验证大学类型是否有效
     */
    private boolean isValidUniversityType(String universityType) {
        return "综合性大学".equals(universityType) || "理工类大学".equals(universityType) ||
                "师范类大学".equals(universityType) || "医药类大学".equals(universityType) ||
                "财经类大学".equals(universityType) || "艺术类大学".equals(universityType) ||
                "体育类大学".equals(universityType) || "农业类大学".equals(universityType)||
                "语言类大学".equals(universityType)||"政法类大学".equals(universityType)||
                "其他类大学".equals(universityType);
    }

    /**
     * 创建管理员教师记录
     */
    private Teacher createAdminTeacher(String adminEmail, School school) {
        Teacher teacher = new Teacher();

        // 生成教师ID（TEA+数字）
        String teacherId = generateTeacherId();
        teacher.setTeacherId(teacherId); // 设置到teacherId字段，而不是id字段

        teacher.setName("Administrator"); // 默认名称，后续可由教师自己修改
        teacher.setEmail(adminEmail);

        // 生成随机密码
        String randomPassword = PasswordUtil.generateRandomPassword(8);
        String passwordHash = PasswordUtil.encryptPassword(randomPassword);
        teacher.setPassword(passwordHash);

        teacher.setAvatarPath("/uploads/avatars/defaultavatarnull.png");

        teacher.setRole("Administrator"); // 设置管理员角色
        teacher.setSchoolId(school.getSchoolId()); // 使用学校编号而不是MongoDB的_id

        log.info("创建管理员教师: teacherId={}, 邮箱={}, 学校ID={}, 角色=Administrator, 随机密码={}",
                teacherId, adminEmail, school.getSchoolId(), randomPassword);
        return teacher;
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

    /**
     * 生成随机密码
     */
    private String generateRandomPassword() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        StringBuilder password = new StringBuilder();
        java.util.Random random = new java.util.Random();

        // 生成8位随机密码
        for (int i = 0; i < 8; i++) {
            password.append(chars.charAt(random.nextInt(chars.length())));
        }

        return password.toString();
    }

    /**
     * 查看所有学校（包含管理员邮箱）
     */
    public Result<java.util.List<SchoolWithAdminResponse>> getAllSchools() {
        try {
            log.info("项目管理员查看所有学校");
            java.util.List<School> schools = schoolRepository.findAll();

            java.util.List<SchoolWithAdminResponse> schoolResponses = new java.util.ArrayList<>();

            for (School school : schools) {
                SchoolWithAdminResponse response = new SchoolWithAdminResponse();
                BeanUtils.copyProperties(school, response);

                // 根据tadmin字段查询教师邮箱
                if (school.getTadmin() != null) {
                    Optional<Teacher> teacherOpt = teacherRepository.findByTeacherId(school.getTadmin());
                    if (teacherOpt.isPresent()) {
                        response.setAdminEmail(teacherOpt.get().getEmail());
                    }
                }

                schoolResponses.add(response);
            }

            log.info("查询到 {} 所学校", schoolResponses.size());
            return Result.success(schoolResponses, "查询成功");
        } catch (Exception e) {
            log.error("查询所有学校失败", e);
            return Result.fail("查询失败: " + e.getMessage());
        }
    }

    /**
     * 根据ID获取学校详情
     */
    public Result<SchoolWithAdminResponse> getSchoolById(String id) {
        try {
            log.info("项目管理员获取学校详情: {}", id);

            Optional<School> schoolOpt = schoolRepository.findById(id);
            if (!schoolOpt.isPresent()) {
                return Result.fail("学校不存在");
            }

            School school = schoolOpt.get();
            SchoolWithAdminResponse response = new SchoolWithAdminResponse();
            BeanUtils.copyProperties(school, response);

            // 根据tadmin字段查询教师邮箱
            if (school.getTadmin() != null) {
                Optional<Teacher> teacherOpt = teacherRepository.findByTeacherId(school.getTadmin());
                if (teacherOpt.isPresent()) {
                    response.setAdminEmail(teacherOpt.get().getEmail());
                }
            }

            log.info("学校详情查询成功: {}", school.getUniversityName());
            return Result.success(response, "查询成功");
        } catch (Exception e) {
            log.error("获取学校详情失败", e);
            return Result.fail("查询失败: " + e.getMessage());
        }
    }

    /**
     * 更新学校信息
     */
    public Result<School> updateSchool(String id, SchoolCreateRequest request) {
        try {
            log.info("项目管理员更新学校: {} - {}", id, request.getUniversityName());

            // 检查学校是否存在
            Optional<School> schoolOpt = schoolRepository.findById(id);
            if (!schoolOpt.isPresent()) {
                return Result.fail("学校不存在");
            }

            School school = schoolOpt.get();

            // 更新学校信息
            school.setUniversityName(request.getUniversityName());
            school.setUniversityType(request.getUniversityType());
            school.setUniversityAddress(request.getUniversityAddress());
            school.setUniversityWebsite(request.getUniversityWebsite());
            school.setUniversityDescription(request.getUniversityDescription());
            school.setStatus(request.getStatus());
            school.setCountry(request.getCountry());
            school.setRegion(request.getRegion());
            school.setContinent(request.getContinent());

            // 如果管理员邮箱发生变化，需要更新教师信息
            if (school.getTadmin() != null) {
                Optional<Teacher> teacherOpt = teacherRepository.findById(school.getTadmin());
                if (teacherOpt.isPresent()) {
                    Teacher teacher = teacherOpt.get();
                    if (!teacher.getEmail().equals(request.getAdminEmail())) {
                        teacher.setEmail(request.getAdminEmail());
                        teacherRepository.save(teacher);
                    }
                }
            }

            School savedSchool = schoolRepository.save(school);
            log.info("学校更新成功: {}", savedSchool.getUniversityName());
            return Result.success(savedSchool, "学校更新成功");

        } catch (Exception e) {
            log.error("更新学校失败", e);
            return Result.fail("更新失败: " + e.getMessage());
        }
    }

    /**
     * 删除学校（级联删除关联的教师和学生）
     */
    public Result<String> deleteSchool(String id) {
        try {
            log.info("项目管理员删除学校: {}", id);

            // 检查学校是否存在
            Optional<School> schoolOpt = schoolRepository.findById(id);
            if (!schoolOpt.isPresent()) {
                return Result.fail("学校不存在");
            }

            School school = schoolOpt.get();
            String schoolName = school.getUniversityName();
            String schoolId = school.getSchoolId();

            // 统计删除数量
            int deletedStudents = 0;
            int deletedTeachers = 0;

            // 1. 删除该学校的所有学生及其相关数据
            List<Student> students = studentRepository.findBySchoolId(schoolId);
            if (!students.isEmpty()) {
                for (Student student : students) {
                    // 删除学生的简历解析数据
                    resumeDataRepository.deleteByStudentId(student.getId());

                    // 删除学生的推荐工作数据
                    recommendedWorkRepository.deleteByStudentId(student.getId());

                    // 删除学生记录
                    studentRepository.deleteById(student.getId());
                    deletedStudents++;
                }
                log.info("删除学校关联学生数量: {}", deletedStudents);
            }

            // 2. 删除该学校的所有教师
            List<Teacher> teachers = teacherRepository.findBySchoolId(schoolId);
            if (!teachers.isEmpty()) {
                for (Teacher teacher : teachers) {
                    teacherRepository.deleteById(teacher.getId());
                    deletedTeachers++;
                }
                log.info("删除学校关联教师数量: {}", deletedTeachers);
            }

            // 3. 删除学校
            schoolRepository.deleteById(id);

            String message = String.format("学校删除成功，同时删除了 %d 名学生和 %d 名教师", deletedStudents, deletedTeachers);
            log.info("学校删除成功: {} - {}", schoolName, message);
            return Result.success(message);

        } catch (Exception e) {
            log.error("删除学校失败", e);
            return Result.fail("删除失败: " + e.getMessage());
        }
    }

    /**
     * 查看所有企业
     */
    public Result<java.util.List<Company>> getAllCompanies() {
        try {
            log.info("项目管理员查看所有企业");
            java.util.List<Company> companies = companyRepository.findAll();
            log.info("查询到 {} 个企业", companies.size());
            return Result.success(companies, "查询成功");
        } catch (Exception e) {
            log.error("查询所有企业失败", e);
            return Result.fail("查询失败: " + e.getMessage());
        }
    }

    /**
     * 项目管理员查询所有企业信息（支持分页和筛选）
     */
//    public Result<java.util.List<java.util.Map<String, Object>>> getAllCompaniesForProject(int page, int size,
//                                                                                           String search,
//                                                                                           String industry, String companyType, String status) {
//        try {
//            log.info("项目管理员查询所有企业信息: page={}, size={}, search={}, industry={}, companyType={}, status={}",
//                    page, size, search, industry, companyType, status);
//
//            // 构建查询条件
//            Query query = new Query();
//
//            // 搜索条件：企业名称、行业、地址
//            if (search != null && !search.trim().isEmpty()) {
//                Criteria searchCriteria = new Criteria().orOperator(
//                        Criteria.where("companyName").regex(search, "i"),
//                        Criteria.where("industry").regex(search, "i"),
//                        Criteria.where("companyAddress").regex(search, "i"));
//                query.addCriteria(searchCriteria);
//            }
//
//            // 行业筛选
//            if (industry != null && !industry.trim().isEmpty()) {
//                query.addCriteria(Criteria.where("industry").is(industry));
//            }
//
//            // 企业类型筛选
//            if (companyType != null && !companyType.trim().isEmpty()) {
//                query.addCriteria(Criteria.where("companyType").is(companyType));
//            }
//
//            // 状态筛选
//            if (status != null && !status.trim().isEmpty()) {
//                query.addCriteria(Criteria.where("status").is(status));
//            }
//
//            // 分页设置
//            query.skip((long) page * size).limit(size);
//
//            // 按创建时间倒序排列
//            query.with(Sort.by(Sort.Direction.DESC, "createdAt"));
//
//            // 执行查询
//            java.util.List<Company> companies = mongoTemplate.find(query, Company.class);
//
//            // 转换数据格式为前端期望的格式
//            java.util.List<java.util.Map<String, Object>> transformedCompanies = new java.util.ArrayList<>();
//            for (Company company : companies) {
//                java.util.Map<String, Object> transformedCompany = transformCompanyForFrontend(company);
//                transformedCompanies.add(transformedCompany);
//            }
//
//            log.info("查询到 {} 个企业", companies.size());
//            return Result.success(transformedCompanies, "查询成功");
//
//        } catch (Exception e) {
//            log.error("查询企业信息失败: {}", e.getMessage(), e);
//            return Result.fail("查询失败: " + e.getMessage());
//        }
//    }


    public Result<Map<String, Object>> getAllCompaniesForProject(int page, int size,
                                                                 String search,
                                                                 String industry, String companyType, String status) {
        try {
            log.info("项目管理员查询所有企业信息: page={}, size={}, search={}, industry={}, companyType={}, status={}",
                    page, size, search, industry, companyType, status);

            // ------------------------
            // 1. 查询公司列表
            // ------------------------
            Query companyQuery = new Query();
            if (StringUtils.isNotBlank(search)) {
                Criteria searchCriteria = new Criteria().orOperator(
                        Criteria.where("companyName").regex(search, "i"),
                        Criteria.where("industry").regex(search, "i"),
                        Criteria.where("companyAddress").regex(search, "i")
                );
                companyQuery.addCriteria(searchCriteria);
            }
            if (StringUtils.isNotBlank(industry)) {
                companyQuery.addCriteria(Criteria.where("industry").is(industry));
            }
            if (StringUtils.isNotBlank(companyType)) {
                companyQuery.addCriteria(Criteria.where("companyType").is(companyType));
            }
            if (StringUtils.isNotBlank(status)) {
                companyQuery.addCriteria(Criteria.where("status").is(status));
            }

            // ------------------------
            // 1.1 获取总条数
            // ------------------------
            long total = mongoTemplate.count(companyQuery, Company.class);

            // 分页 & 排序
            companyQuery.skip((long) page * size).limit(size);
            companyQuery.with(Sort.by(Sort.Direction.DESC, "updatedAt"));

            List<Company> companies = mongoTemplate.find(companyQuery, Company.class);
            if (companies.isEmpty()) {
                Map<String,Object> emptyResult = new HashMap<>();
                emptyResult.put("list", Collections.emptyList());
                emptyResult.put("total", total);
                return Result.success(emptyResult, "查询成功");
            }

            Set<String> companyIds = companies.stream()
                    .map(Company::getCompanyId)
                    .collect(Collectors.toSet());

            // ------------------------
            // 2. 批量查询岗位列表
            // ------------------------
            Query jobQuery = new Query(Criteria.where("companyId").in(companyIds));
            List<Job> jobs = mongoTemplate.find(jobQuery, Job.class);
            Map<String, List<Job>> jobsByCompany = jobs.stream()
                    .collect(Collectors.groupingBy(Job::getCompanyId));

            // ------------------------
            // 3. 聚合查询学生申请岗位数量
            // ------------------------
            Aggregation agg = Aggregation.newAggregation(
                    Aggregation.match(Criteria.where("appliedJobs").exists(true)),
                    Aggregation.unwind("appliedJobs"),
                    Aggregation.lookup("job", "appliedJobs", "jobId", "jobInfo"),
                    Aggregation.unwind("jobInfo"),
                    Aggregation.match(Criteria.where("jobInfo.companyId").in(companyIds)),
                    Aggregation.group("jobInfo.companyId", "jobInfo.jobType").count().as("appliedCount")
            );
            AggregationResults<Document> appliedResults = mongoTemplate.aggregate(agg, "student", Document.class);

            // Map<companyId, Map<jobType, appliedCount>>
            Map<String, Map<String, Long>> appliedMap = new HashMap<>();
            for (Document doc : appliedResults.getMappedResults()) {
                Document idDoc = (Document) doc.get("_id");
                String companyId = idDoc.getString("companyId");
                String jobType = idDoc.getString("jobType");
                Number count = (Number) doc.get("appliedCount");
                appliedMap.computeIfAbsent(companyId, k -> new HashMap<>())
                        .put(jobType, count != null ? count.longValue() : 0L);
            }

            // ------------------------
            // 4. 多线程组装公司信息
            // ------------------------
            ExecutorService executor = Executors.newFixedThreadPool(Runtime.getRuntime().availableProcessors());
            List<Future<Map<String, Object>>> futures = new ArrayList<>();

            for (Company company : companies) {
                futures.add(executor.submit(() -> {
                    Map<String, Object> map = transformCompanyForFrontend(company);

                    List<Job> companyJobs = jobsByCompany.getOrDefault(company.getCompanyId(), Collections.emptyList());
                    long internJobCount = companyJobs.stream().filter(j -> "intern".equals(j.getJobType())).count();
                    long fulltimeCampusJobCount = companyJobs.stream().filter(j -> "full-time-campus".equals(j.getJobType())).count();

                    Map<String, Long> appliedCounts = appliedMap.getOrDefault(company.getCompanyId(), Collections.emptyMap());
                    long appliedInternCount = appliedCounts.getOrDefault("intern", 0L);
                    long appliedFulltimeCampusCount = appliedCounts.getOrDefault("full-time-campus", 0L);

                    map.put("companyId", company.getCompanyId());
                    map.put("internJobCount", internJobCount);
                    map.put("fulltimeCampusJobCount", fulltimeCampusJobCount);
                    map.put("appliedInternCount", appliedInternCount);
                    map.put("appliedFulltimeCampusCount", appliedFulltimeCampusCount);

                    return map;
                }));
            }

            List<Map<String, Object>> transformedCompanies = new ArrayList<>();
            for (Future<Map<String, Object>> f : futures) {
                transformedCompanies.add(f.get());
            }
            executor.shutdown();

            log.info("查询到 {} 个企业，总条数 {}", transformedCompanies.size(), total);

            // ------------------------
            // 5. 返回 list + total
            // ------------------------
            Map<String, Object> resultData = new HashMap<>();
            resultData.put("list", transformedCompanies);
            resultData.put("total", total);

            return Result.success(resultData, "查询成功");

        } catch (Exception e) {
            log.error("查询企业信息失败", e);
            return Result.fail("查询失败: " + e.getMessage());
        }
    }








    /**
     * 项目管理员根据ID查询企业详细信息
     */
    public Result<Company> getCompanyByIdForProject(String companyId) {
        try {
            log.info("项目管理员根据ID查询企业详细信息: {}", companyId);

            Optional<Company> companyOpt = companyRepository.findByCompanyId(companyId);
            if (!companyOpt.isPresent()) {
                log.warn("企业不存在: {}", companyId);
                return Result.fail("企业不存在");
            }

            Company company = companyOpt.get();
            log.info("查询到企业信息: {}", company.getCompanyName());
            return Result.success(company, "查询成功");

        } catch (Exception e) {
            log.error("查询企业详细信息失败: {}", e.getMessage(), e);
            return Result.fail("查询失败: " + e.getMessage());
        }
    }

    /**
     * 项目管理员查询企业统计信息
     */
    public Result<java.util.Map<String, Object>> getCompanyStatsForProject() {
        try {
            log.info("项目管理员查询企业统计信息");

            java.util.Map<String, Object> stats = new java.util.HashMap<>();

            // 总企业数量
            long totalCompanies = companyRepository.count();
            stats.put("totalCompanies", totalCompanies);

            // 按状态统计
            java.util.Map<String, Long> statusStats = new java.util.HashMap<>();
            statusStats.put("active", companyRepository.countByStatus("active"));
            statusStats.put("inactive", companyRepository.countByStatus("inactive"));
            stats.put("statusStats", statusStats);

            // 按行业统计（前10个）
            java.util.List<java.util.Map<String, Object>> industryStats = new java.util.ArrayList<>();
            java.util.List<Company> allCompanies = companyRepository.findAll();
            java.util.Map<String, Long> industryCount = new java.util.HashMap<>();

            for (Company company : allCompanies) {
                String industry = company.getIndustry();
                if (industry != null && !industry.trim().isEmpty()) {
                    industryCount.put(industry, industryCount.getOrDefault(industry, 0L) + 1);
                }
            }

            for (java.util.Map.Entry<String, Long> entry : industryCount.entrySet()) {
                java.util.Map<String, Object> industryStat = new java.util.HashMap<>();
                industryStat.put("industry", entry.getKey());
                industryStat.put("companyCount", entry.getValue());
                industryStats.add(industryStat);
            }

            // 按企业数量排序，取前10个
            industryStats.sort((a, b) -> Long.compare((Long) b.get("companyCount"), (Long) a.get("companyCount")));
            if (industryStats.size() > 10) {
                industryStats = industryStats.subList(0, 10);
            }
            stats.put("industryStats", industryStats);

            // 按企业类型统计
            java.util.List<java.util.Map<String, Object>> typeStats = new java.util.ArrayList<>();
            java.util.Map<String, Long> typeCount = new java.util.HashMap<>();

            for (Company company : allCompanies) {
                String companyType = company.getCompanyType();
                if (companyType != null && !companyType.trim().isEmpty()) {
                    typeCount.put(companyType, typeCount.getOrDefault(companyType, 0L) + 1);
                }
            }

            for (java.util.Map.Entry<String, Long> entry : typeCount.entrySet()) {
                java.util.Map<String, Object> typeStat = new java.util.HashMap<>();
                typeStat.put("companyType", entry.getKey());
                typeStat.put("companyCount", entry.getValue());
                typeStats.add(typeStat);
            }
            stats.put("typeStats", typeStats);

            log.info("企业统计信息查询完成，总企业数: {}", totalCompanies);
            return Result.success(stats, "统计信息查询成功");

        } catch (Exception e) {
            log.error("查询企业统计信息失败: {}", e.getMessage(), e);
            return Result.fail("查询统计信息失败: " + e.getMessage());
        }
    }

    /**
     * 项目管理员根据企业名称查询企业信息
     */
    public Result<java.util.List<Company>> getCompaniesByNameForProject(String name) {
        try {
            log.info("项目管理员根据企业名称查询企业信息: {}", name);

            if (name == null || name.trim().isEmpty()) {
                return Result.fail("企业名称不能为空");
            }

            java.util.List<Company> companies = companyRepository.findByCompanyNameContaining(name.trim());
            log.info("根据名称 '{}' 查询到 {} 个企业", name, companies.size());
            return Result.success(companies, "查询成功");

        } catch (Exception e) {
            log.error("根据企业名称查询企业信息失败: {}", e.getMessage(), e);
            return Result.fail("查询失败: " + e.getMessage());
        }
    }

    /**
     * 将后端企业数据转换为前端期望的格式
     */
    private java.util.Map<String, Object> transformCompanyForFrontend(Company company) {
        java.util.Map<String, Object> transformed = new java.util.HashMap<>();

        // 基本信息映射
        transformed.put("id", company.getId());
        transformed.put("name", company.getCompanyName());
        transformed.put("industry", company.getIndustry() != null ? company.getIndustry() : company.getCompanyType());
        transformed.put("location", company.getCompanyAddress());
        transformed.put("size", company.getCompanySize());
        transformed.put("status", company.getStatus());

        // 联系信息
        transformed.put("contactPerson", company.getContactPerson());
        transformed.put("contactInfo",
                company.getContactPhone() != null ? company.getContactPhone() : company.getContactEmail());

        // 时间信息
        transformed.put("partnershipDate",
                company.getUpdatedAt() != null ? company.getUpdatedAt().toString().substring(0, 10) : "");

        // 业务活动描述
        transformed.put("businessActivity",
                company.getCompanyDescription() != null ? company.getCompanyDescription() : "");

        // 统计该企业的岗位数量
        List<Job> companyJobs = jobRepository.findByCompanyId(company.getId());

        // 统计校招岗位（全职岗位）
        long campusPositions = companyJobs.stream()
                .filter(job -> "full-time-campus".equals(job.getJobType()))
                .count();

        // 统计实习岗位
        long internPositions = companyJobs.stream()
                .filter(job -> "intern".equals(job.getJobType()))
                .count();

        // 统计校招岗位申请人数
        long campusApplicants = companyJobs.stream()
                .filter(job -> "full-time-campus".equals(job.getJobType()))
                .mapToLong(job -> calculateJobApplicants(job.getId()))
                .sum();

        // 统计实习岗位申请人数
        long internApplicants = companyJobs.stream()
                .filter(job -> "intern".equals(job.getJobType()))
                .mapToLong(job -> calculateJobApplicants(job.getId()))
                .sum();

        transformed.put("campusPositions", (int) campusPositions);
        transformed.put("internPositions", (int) internPositions);
        transformed.put("campusApplicants", (int) campusApplicants);
        transformed.put("internApplicants", (int) internApplicants);

        return transformed;
    }

    /**
     * 查看所有职位
     */
    public Result<java.util.List<Job>> getAllJobs() {
        try {
            log.info("项目管理员查看所有职位");
            java.util.List<Job> jobs = jobRepository.findAll();
            log.info("查询到 {} 个职位", jobs.size());
            return Result.success(jobs, "查询成功");
        } catch (Exception e) {
            log.error("查询所有职位失败", e);
            return Result.fail("查询失败: " + e.getMessage());
        }
    }

    /**
     * 项目管理员查询所有职位信息（支持分页和筛选）
     */
    public Result<java.util.List<java.util.Map<String, Object>>> getAllJobsForProjects(int page, int size, String search,
                                                                                      String jobType, String companyId, String status) {
        try {
            log.info("项目管理员查询所有职位信息: page={}, size={}, search={}", page, size, search);

            // 构建查询条件
            Query query = new Query();

            // 搜索条件
            if (search != null && !search.trim().isEmpty()) {
                Criteria searchCriteria = new Criteria().orOperator(
                        Criteria.where("jobTitle").regex(search, "i"),
                        Criteria.where("companyName").regex(search, "i"),
                        Criteria.where("workLocation").regex(search, "i"));
                query.addCriteria(searchCriteria);
            }

            // 职位类型筛选
            if (jobType != null && !jobType.trim().isEmpty()) {
                query.addCriteria(Criteria.where("jobType").is(jobType));
            }

            // 企业ID筛选
            if (companyId != null && !companyId.trim().isEmpty()) {
                query.addCriteria(Criteria.where("companyId").is(companyId));
            }

            // 状态筛选
            if (status != null && !status.trim().isEmpty()) {
                query.addCriteria(Criteria.where("status").is(status));
            }

            // 分页设置
            query.with(org.springframework.data.domain.PageRequest.of(page, size));

            // 执行查询
            java.util.List<Job> jobs = mongoTemplate.find(query, Job.class);

            // 转换数据格式为前端期望的格式
            java.util.List<java.util.Map<String, Object>> transformedJobs = new java.util.ArrayList<>();
            for (Job job : jobs) {
                java.util.Map<String, Object> transformedJob = transformJobForFrontend(job);
                transformedJobs.add(transformedJob);
            }

            log.info("查询到 {} 个职位", jobs.size());
            return Result.success(transformedJobs, "查询成功");

        } catch (Exception e) {
            log.error("查询所有职位失败", e);
            return Result.fail("查询失败: " + e.getMessage());
        }
    }
    public Result<Map<String, Object>> getAllJobsForProject(int page, int size, String search,
                                                            String jobType, String companyId, String status) {
        Map<String, Object> response = new HashMap<>();
        try {
            // 1️⃣ 创建查询条件
            Query query = new Query();

            // 添加 jobType 限制条件，匹配 full-time-campus 和 intern
            query.addCriteria(Criteria.where("jobType").in("full-time-campus", "intern"));

            // 添加地区条件
            query.addCriteria(Criteria.where("workLocation").regex(HONG_KONG_REGEX, "i"));

            // 如果有搜索条件，添加职位名称模糊查询
            if (search != null && !search.isEmpty()) {
                query.addCriteria(Criteria.where("jobTitle").regex(search, "i"));
            }

            // 如果指定了公司ID，添加公司ID条件
            if (companyId != null && !companyId.isEmpty()) {
                query.addCriteria(Criteria.where("companyId").is(companyId));
            }

            // 如果指定了状态，添加状态条件
            if (status != null && !status.isEmpty()) {
                // 根据前端传来的状态转换为后端需要的状态
                switch (status) {
                    case "active":
                        status = "opening"; // active -> opening
                        break;
                    case "filled":
                        status = "closed";  // filled -> closed
                        break;
                    case "inactive":
                        status = "suspended"; // inactive -> suspended
                        break;
                    default:
                        status = "opening"; // 默认值
                }

                // 使用转换后的状态构建查询条件
                query.addCriteria(Criteria.where("status").is(status));
            }


            // 获取符合条件的职位总数（用于分页计算）
            long total = mongoTemplate.count(query, Job.class);  // 使用 count 方法获取总数

            // 设置分页条件，跳过前面的数据
            query.skip((page - 1) * size).limit(size);

            // 执行查询，获取职位列表
            List<Job> jobs = mongoTemplate.find(query, Job.class);

            // 预加载所有相关公司数据，避免 N 次查询，提升效率
            Set<String> companyIds = jobs.stream()
                    .map(Job::getCompanyId)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toSet());

            // 获取公司列表
            Query companyQuery = Query.query(Criteria.where("companyId").in(companyIds));
            List<Company> companyList = mongoTemplate.find(companyQuery, Company.class);

            // 建立 companyId -> logoImage 和 companyUrl 映射
            Map<String, String> companyLogoMap = new HashMap<>();
            Map<String, String> companyUrlMap = new HashMap<>();
            for (Company company : companyList) {
                companyLogoMap.put(company.getCompanyId(), company.getLogoImage());
                companyUrlMap.put(company.getCompanyId(), company.getCompanyUrl()); // 确保有 companyUrl 字段
            }

            // 设置 job 的 id、logoImage 和 companyUrl
            for (Job job : jobs) {
                job.setId(job.getJobId());  // 修改 id 为 jobId
                String logoImage = companyLogoMap.get(job.getCompanyId());
                String companyUrl = companyUrlMap.get(job.getCompanyId()); // 获取 companyUrl
                job.setLogoImage(logoImage);  // 设置 logoImage
                job.setCompanyUrl(companyUrl);  // 设置 companyUrl
            }

            // 转换数据格式为前端期望的格式
            List<Map<String, Object>> transformedJobs = new ArrayList<>();
            for (Job job : jobs) {
                Map<String, Object> transformedJob = transformJobForFrontend(job);  // 调用转换方法
                transformedJobs.add(transformedJob);
            }

            // 构造返回数据
            Map<String, Object> resultData = new HashMap<>();
            resultData.put("total", total);  // 返回总数（符合条件的职位总数）
            resultData.put("jobs", transformedJobs);  // 返回职位列表

            response.put("success", true);
            response.put("data", resultData);  // 返回数据

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "获取职位详情失败: " + e.getMessage());
        }

        return Result.success(response);
    }


    /**
     * 将后端职位数据转换为前端期望的格式
     */
    private java.util.Map<String, Object> transformJobForFrontend(Job job) {
        java.util.Map<String, Object> transformed = new java.util.HashMap<>();

        // 基本信息映射
        transformed.put("id", job.getJobId()); // 使用自定义jobId而不是MongoDB主键ID
        transformed.put("title", job.getJobTitle());
        transformed.put("company", job.getCompanyName());
        transformed.put("location", job.getWorkLocation());
        transformed.put("type", mapJobType(job.getJobType()));
        transformed.put("status", mapJobStatus(job.getStatus()));

        // 职位描述
        transformed.put("jobDescription", job.getJobDescription() != null ? job.getJobDescription() : "");

        // 职位要求
        transformed.put("jobRequirements", job.getJobRequirements() != null ? job.getJobRequirements() : "");

        // 福利待遇
        transformed.put("benefits", job.getBenefits() != null ? job.getBenefits() : "");

        // 时间信息
        transformed.put("postDate", job.getCreatedAt() != null ? job.getCreatedAt().toString().substring(0, 10) : "");
        transformed.put("createdAt", job.getCreatedAt());

        // 申请人数（需要从学生表统计）
        transformed.put("applicants", calculateJobApplicants(job.getJobId())); // 使用自定义jobId统计申请人数

        // 薪资信息
        String salary = formatSalary(job.getMinSalary(), job.getMaxSalary(), job.getSalaryUnit());
        transformed.put("salary", salary);
        transformed.put("minSalary", job.getMinSalary());
        transformed.put("maxSalary", job.getMaxSalary());
        transformed.put("salaryUnit", job.getSalaryUnit());

        // 其他信息
        transformed.put("experienceRequired", job.getExperienceRequired() != null ? job.getExperienceRequired() : "");
        transformed.put("educationRequired", job.getEducationRequired() != null ? job.getEducationRequired() : "");
        transformed.put("experience", job.getExperienceRequired() != null ? job.getExperienceRequired() : "");
        transformed.put("education", job.getEducationRequired() != null ? job.getEducationRequired() : "");
        transformed.put("requirements",
                job.getSkillsRequired() != null ? job.getSkillsRequired() : new java.util.ArrayList<>());
        transformed.put("recruitmentCount", job.getRecruitmentCount() != null ? job.getRecruitmentCount() : 1);

        // 添加更多前端需要的字段
        transformed.put("jobId", job.getJobId());
        transformed.put("jobTitle", job.getJobTitle());
        transformed.put("jobType", job.getJobType());
        transformed.put("workLocation", job.getWorkLocation());
        transformed.put("companyId", job.getCompanyId());
        transformed.put("companyName", job.getCompanyName());

        return transformed;
    }

    /**
     * 映射职位类型
     */
    private String mapJobType(String jobType) {
        if (jobType == null)
            return "Full Time Campus";
        switch (jobType.toLowerCase()) {
            case "full-time-campus":
                return "Full Time Campus";
            case "intern":
                return "Intern";
            default:
                return "Full Time Campus";
        }
    }

    /**
     * 映射职位状态
     */
    private String mapJobStatus(String status) {
        if (status == null)
            return "active";
        switch (status.toLowerCase()) {
            case "opening":
                return "active";
            case "closed":
                return "filled";
            case "suspended":
                return "inactive";
            default:
                return "active";
        }
    }

    /**
     * 计算职位申请人数
     */
    private int calculateJobApplicants(String jobId) {
        try {
            Query query = new Query(Criteria.where("appliedJobs").in(jobId));
            long count = mongoTemplate.count(query, Student.class);
            return (int) count;
        } catch (Exception e) {
            log.warn("计算职位申请人数失败: {}", e.getMessage());
            return 0;
        }
    }

    /**
     * 格式化薪资信息
     */
    private String formatSalary(java.math.BigDecimal minSalary, java.math.BigDecimal maxSalary, String salaryUnit) {
        if (minSalary == null && maxSalary == null) {
            return "面议";
        }

        String unit = "";
        if ("month".equals(salaryUnit)) {
            unit = "K/月";
        } else if ("year".equals(salaryUnit)) {
            unit = "K/年";
        } else if ("hour".equals(salaryUnit)) {
            unit = "/小时";
        }

        if (minSalary != null && maxSalary != null) {
            return String.format("%.0f-%.0f%s", minSalary.doubleValue() / 1000, maxSalary.doubleValue() / 1000, unit);
        } else if (minSalary != null) {
            return String.format("%.0f%s起", minSalary.doubleValue() / 1000, unit);
        } else if (maxSalary != null) {
            return String.format("最高%.0f%s", maxSalary.doubleValue() / 1000, unit);
        } else {
            return "面议";
        }
    }

    /**
     * 根据ID获取职位详情
     */
    public Result<java.util.Map<String, Object>> getJobByIdForProject(String jobId) {
        try {
            log.info("项目管理员获取职位详情: {}", jobId);

            Optional<Job> jobOpt = jobRepository.findByJobId(jobId); // 使用自定义jobId查找
            if (!jobOpt.isPresent()) {
                return Result.fail("职位不存在");
            }

            Job job = jobOpt.get();
            java.util.Map<String, Object> transformedJob = transformJobForFrontend(job);

            log.info("职位详情获取成功: {}", job.getJobTitle());
            return Result.success(transformedJob, "查询成功");

        } catch (Exception e) {
            log.error("获取职位详情失败", e);
            return Result.fail("查询失败: " + e.getMessage());
        }
    }

    /**
     * 更新职位信息
     */
    public Result<String> updateJobForProject(String jobId, JobCreateRequest jobRequest) {
        try {
            log.info("项目管理员更新职位: {}", jobId);

            Optional<Job> jobOpt = jobRepository.findByJobId(jobId);
            if (!jobOpt.isPresent()) {
                return Result.fail("职位不存在");
            }

            Job job = jobOpt.get();

            // 更新职位信息
            job.setJobTitle(jobRequest.getJobTitle());
            job.setJobDescription(jobRequest.getJobDescription());
            job.setJobRequirements(jobRequest.getJobRequirements());
            job.setBenefits(jobRequest.getBenefits());
            job.setJobType(jobRequest.getJobType());
            job.setWorkLocation(jobRequest.getWorkLocation());
            job.setMinSalary(jobRequest.getMinSalary());
            job.setMaxSalary(jobRequest.getMaxSalary());
            job.setSalaryUnit(jobRequest.getSalaryUnit());
            job.setExperienceRequired(jobRequest.getExperienceRequired());
            job.setEducationRequired(jobRequest.getEducationRequired());
            job.setSkillsRequired(jobRequest.getSkillsRequired());
            job.setRecruitmentCount(jobRequest.getRecruitmentCount());
            job.setStatus(jobRequest.getStatus());

            // 根据企业ID查找企业名称
            Optional<Company> companyOpt = companyRepository.findByCompanyId(jobRequest.getCompanyId());
            if (companyOpt.isPresent()) {
                job.setCompanyName(companyOpt.get().getCompanyName());
            }

            job.setDeadline(jobRequest.getDeadline());

            // 保存更新
            jobRepository.save(job);

            log.info("职位更新成功: {}", job.getJobTitle());
            return Result.success("职位更新成功");

        } catch (Exception e) {
            log.error("更新职位失败", e);
            return Result.fail("更新失败: " + e.getMessage());
        }
    }

    /**
     * 获取职位统计信息
     */
    public Result<java.util.Map<String, Object>> getJobStatsForProject() {
        try {
            log.info("项目管理员获取职位统计信息");

            java.util.Map<String, Object> stats = new java.util.HashMap<>();

            // 总职位数
            long totalJobs = jobRepository.count();
            stats.put("totalJobs", totalJobs);

            // 按状态统计
            long activeJobs = mongoTemplate.count(Query.query(Criteria.where("status").is("open")), Job.class);
            long closedJobs = mongoTemplate.count(Query.query(Criteria.where("status").is("closed")), Job.class);
            long suspendedJobs = mongoTemplate.count(Query.query(Criteria.where("status").is("suspended")), Job.class);

            stats.put("activeJobs", activeJobs);
            stats.put("closedJobs", closedJobs);
            stats.put("suspendedJobs", suspendedJobs);

            // 按类型统计
            long fullTimeJobs = mongoTemplate.count(Query.query(Criteria.where("jobType").is("full-time")), Job.class);
            long internshipJobs = mongoTemplate.count(Query.query(Criteria.where("jobType").is("internship")),
                    Job.class);

            stats.put("fullTimeJobs", fullTimeJobs);
            stats.put("internshipJobs", internshipJobs);

            // 总申请数
            java.util.List<Student> students = studentRepository.findAll();
            long totalApplications = students.stream()
                    .mapToLong(student -> student.getAppliedJobs().size())
                    .sum();
            stats.put("totalApplications", totalApplications);

            log.info("职位统计信息获取成功");
            return Result.success(stats, "统计成功");

        } catch (Exception e) {
            log.error("获取职位统计信息失败", e);
            return Result.fail("统计失败: " + e.getMessage());
        }
    }

    /**
     * 自动生成企业编号
     * 格式：COM + 递增数字
     */
    private String generateCompanyId() {
        // 获取当前最大的企业编号
        List<Company> companies = companyRepository.findAll();
        int maxNumber = 0;

        for (Company company : companies) {
            String companyId = company.getCompanyId();
            if (companyId != null && companyId.startsWith("COM")) {
                try {
                    int number = Integer.parseInt(companyId.substring(3));
                    maxNumber = Math.max(maxNumber, number);
                } catch (NumberFormatException e) {
                    // 忽略格式不正确的编号
                }
            }
        }

        return "COM" + (maxNumber + 1);
    }

    /**
     * 自动生成学校编号
     * 格式：PKU + 递增数字
     */
    private String generateSchoolId() {
        // 获取当前最大的学校编号
        List<School> schools = schoolRepository.findAll();
        int maxNumber = 0;

        for (School school : schools) {
            String schoolId = school.getSchoolId();
            if (schoolId != null && schoolId.startsWith("PKU")) {
                try {
                    int number = Integer.parseInt(schoolId.substring(3));
                    maxNumber = Math.max(maxNumber, number);
                } catch (NumberFormatException e) {
                    // 忽略格式不正确的编号
                }
            }
        }

        return "PKU" + (maxNumber + 1);
    }

    /**
     * 自动生成职位编号
     * 格式：JOB + 递增数字
     */
    private String generateJobId() {
        // 获取当前最大的职位编号
        List<Job> jobs = jobRepository.findAll();
        int maxNumber = 0;

        for (Job job : jobs) {
            String jobId = job.getJobId();
            if (jobId != null && jobId.startsWith("JOB")) {
                try {
                    int number = Integer.parseInt(jobId.substring(3));
                    maxNumber = Math.max(maxNumber, number);
                } catch (NumberFormatException e) {
                    // 忽略格式不正确的编号
                }
            }
        }

        return "JOB" + (maxNumber + 1);
    }

    // ==================== 学生信息管理方法 ====================

    /**
     * 项目管理员查询所有学生信息（支持分页和筛选）
     */
    public Result<List<StudentWithSchoolResponse>> getAllStudentsForProject(int page, int size, String search,
                                                                            String schoolId,
                                                                            String major, String status) {
        try {
            log.info("项目管理员查询所有学生信息: page={}, size={}, search={}, schoolId={}, major={}, status={}",
                    page, size, search, schoolId, major, status);

            // 构建查询条件
            Query query = new Query();

            // 搜索条件（姓名、专业模糊匹配）
            if (search != null && !search.trim().isEmpty()) {
                Criteria searchCriteria = new Criteria().orOperator(
                        Criteria.where("fullName").regex(search, "i"),
                        Criteria.where("major").regex(search, "i"));
                query.addCriteria(searchCriteria);
            }

            // 学校ID筛选
            if (schoolId != null && !schoolId.trim().isEmpty()) {
                query.addCriteria(Criteria.where("schoolId").is(schoolId));
            }

            // 专业筛选
            if (major != null && !major.trim().isEmpty()) {
                query.addCriteria(Criteria.where("major").regex(major, "i"));
            }

            // 状态筛选
            if (status != null && !status.trim().isEmpty()) {
                query.addCriteria(Criteria.where("status").is(status));
            }

            // 分页设置
            query.skip((long) page * size).limit(size);

            // 按创建时间倒序排列
            query.with(Sort.by(Sort.Direction.DESC, "createdAt"));

            List<Student> students = mongoTemplate.find(query, Student.class);

            // 移除密码信息并添加学校名称
            List<StudentWithSchoolResponse> studentsWithSchool = students.stream()
                    .map(student -> {
                        student.setPassword(null);
                        String schoolName = "未知学校";

                        // 根据schoolId查询学校名称
                        if (student.getSchoolId() != null) {
                            Optional<School> schoolOpt = schoolRepository.findBySchoolId(student.getSchoolId());
                            if (schoolOpt.isPresent()) {
                                schoolName = schoolOpt.get().getUniversityName();
                            }
                        }

                        return StudentWithSchoolResponse.fromStudent(student, schoolName);
                    })
                    .collect(Collectors.toList());

            // 获取总数（用于前端分页显示）
            Query countQuery = new Query();
            if (search != null && !search.trim().isEmpty()) {
                Criteria searchCriteria = new Criteria().orOperator(
                        Criteria.where("fullName").regex(search, "i"),
                        Criteria.where("major").regex(search, "i"));
                countQuery.addCriteria(searchCriteria);
            }
            if (schoolId != null && !schoolId.trim().isEmpty()) {
                countQuery.addCriteria(Criteria.where("schoolId").is(schoolId));
            }
            if (major != null && !major.trim().isEmpty()) {
                countQuery.addCriteria(Criteria.where("major").regex(major, "i"));
            }
            if (status != null && !status.trim().isEmpty()) {
                countQuery.addCriteria(Criteria.where("status").is(status));
            }


            long totalCount = mongoTemplate.count(countQuery, Student.class);

            log.info("查询到 {} 个学生，总数: {}", students.size(), totalCount);

            // 将总数信息添加到Result中
            Result<List<StudentWithSchoolResponse>> result = Result.success(studentsWithSchool, "查询成功");
            result.setTotal(totalCount);
            return result;

        } catch (Exception e) {
            log.error("项目管理员查询所有学生信息失败: {}", e.getMessage(), e);
            return Result.fail("查询学生信息失败: " + e.getMessage());
        }
    }

    /**
     * 项目管理员根据ID查询学生详细信息
     */
    public Result<StudentDTO> getStudentByIdForProject(String id) {
        try {
            log.info("项目管理员根据ID查询学生详细信息: {}", id);

            Optional<Student> studentOpt = studentRepository.findById(id);
            if (!studentOpt.isPresent()) {
                return Result.fail("学生不存在");
            }

            Student student = studentOpt.get();
            // 移除密码信息
            student.setPassword(null);

            // 根据schoolId查询学校名称
            String universityName = null;
            if (student.getSchoolId() != null) {
                Optional<School> schoolOpt = schoolRepository.findBySchoolId(student.getSchoolId());
                if (schoolOpt.isPresent()) {
                    universityName = schoolOpt.get().getUniversityName();
                }
            }

            // 构建DTO返回给前端
            StudentDTO dto = new StudentDTO();
           dto.setBio(student.getBio());
           dto.setEmail(student.getEmail());
           dto.setFullName(student.getFullName());
           dto.setGender(student.getGender());

           dto.setMajor(student.getMajor());
           dto.setNickname(student.getNickname());
           dto.setStudentId(student.getStudentId());
           dto.setEnrollmentYear(student.getEnrollmentYear());
           dto.setAvatarPath(student.getAvatarPath());
           dto.setResumePath(student.getResumePath());
           dto.setStatus(student.getStatus());
           dto.setBookmarkedJobs(student.getBookmarkedJobs());
           dto.setAppliedJobs(student.getAppliedJobs());
           dto.setIsFirstLogin(student.getIsFirstLogin());
           dto.setHasChangedPassword(student.getHasChangedPassword());
           dto.setHasCompletedProfile(student.getHasCompletedProfile());
           dto.setSchoolId(student.getSchoolId());
           dto.setUniversity(universityName);
            // 其他字段可根据需要添加

            log.info("查询到学生信息: {}，学校: {}", student.getFullName(), universityName);
            return Result.success(dto, "查询成功");

        } catch (Exception e) {
            log.error("根据ID查询学生详细信息失败: {}", e.getMessage(), e);
            return Result.fail("查询学生详细信息失败: " + e.getMessage());
        }
    }


    /**
     * 项目管理员查询学生统计信息
     */
    public Result<java.util.Map<String, Object>> getStudentStatsForProject() {
        try {
            log.info("项目管理员查询学生统计信息");

            java.util.Map<String, Object> stats = new java.util.HashMap<>();

            // 总学生数
            long totalStudents = studentRepository.count();
            stats.put("totalStudents", totalStudents);

            // 按状态统计
            java.util.Map<String, Long> statusStats = new java.util.HashMap<>();
            statusStats.put("active",
                    mongoTemplate.count(Query.query(Criteria.where("status").is("active")), Student.class));
            statusStats.put("inactive",
                    mongoTemplate.count(Query.query(Criteria.where("status").is("inactive")), Student.class));
            statusStats.put("graduate",
                    mongoTemplate.count(Query.query(Criteria.where("status").is("graduate")), Student.class));
            stats.put("statusStats", statusStats);

            // 按学校统计（前10个学校）
            List<java.util.Map<String, Object>> schoolStats = new ArrayList<>();
            List<School> schools = schoolRepository.findAll();
            for (School school : schools) {
                long count = mongoTemplate.count(Query.query(Criteria.where("schoolId").is(school.getId())),
                        Student.class);
                if (count > 0) {
                    java.util.Map<String, Object> schoolStat = new java.util.HashMap<>();
                    schoolStat.put("schoolName", school.getUniversityName());
                    schoolStat.put("studentCount", count);
                    schoolStats.add(schoolStat);
                }
            }
            // 按学生数量排序，取前10个
            schoolStats.sort((a, b) -> Long.compare((Long) b.get("studentCount"), (Long) a.get("studentCount")));
            if (schoolStats.size() > 10) {
                schoolStats = schoolStats.subList(0, 10);
            }
            stats.put("schoolStats", schoolStats);

            // 按专业统计（前10个专业）
            List<java.util.Map<String, Object>> majorStats = new ArrayList<>();
            List<Student> allStudents = studentRepository.findAll();
            java.util.Map<String, Long> majorCounts = new java.util.HashMap<>();
            for (Student student : allStudents) {
                if (student.getMajor() != null && !student.getMajor().trim().isEmpty()) {
                    majorCounts.put(student.getMajor(), majorCounts.getOrDefault(student.getMajor(), 0L) + 1);
                }
            }
            for (java.util.Map.Entry<String, Long> entry : majorCounts.entrySet()) {
                java.util.Map<String, Object> majorStat = new java.util.HashMap<>();
                majorStat.put("majorName", entry.getKey());
                majorStat.put("studentCount", entry.getValue());
                majorStats.add(majorStat);
            }
            // 按学生数量排序，取前10个
            majorStats.sort((a, b) -> Long.compare((Long) b.get("studentCount"), (Long) a.get("studentCount")));
            if (majorStats.size() > 10) {
                majorStats = majorStats.subList(0, 10);
            }
            stats.put("majorStats", majorStats);

            log.info("学生统计信息查询完成，总学生数: {}", totalStudents);
            return Result.success(stats, "统计信息查询成功");

        } catch (Exception e) {
            log.error("查询学生统计信息失败: {}", e.getMessage(), e);
            return Result.fail("查询统计信息失败: " + e.getMessage());
        }
    }

    /**
     * 根据姓名查询学生信息（项目管理员专用）
     * 项目管理员可以根据姓名查询所有学校的学生信息
     */
    public Result<List<Student>> getStudentsByNameForProject(String name) {
        try {
            log.info("项目管理员根据姓名查询学生信息: {}", name);
            List<Student> students = studentRepository.findByFullNameContaining(name);
            // 移除密码信息
            students.forEach(student -> student.setPassword(null));
            log.info("查询到 {} 个学生", students.size());
            return Result.success(students, "查询成功");
        } catch (Exception e) {
            log.error("根据姓名查询学生信息失败", e);
            return Result.fail("查询失败: " + e.getMessage());
        }
    }

    // ==================== 角色权限管理方法 ====================

    /**
     * 创建项目管理角色
     */
    public Result<PRole> createPRole(RoleCreateRequest request) {
        try {
            log.info("创建项目管理角色: {}", request.getRoleName());

            // 检查角色名称是否已存在
            if (pRoleRepository.existsByRoleName(request.getRoleName())) {
                return Result.fail("角色名称已存在");
            }

            // 创建角色实体
            PRole pRole = new PRole();
            BeanUtils.copyProperties(request, pRole);

            PRole savedRole = pRoleRepository.save(pRole);
            log.info("项目管理角色创建成功: {}", savedRole.getRoleName());
            return Result.success(savedRole, "角色创建成功");

        } catch (Exception e) {
            log.error("创建项目管理角色失败", e);
            return Result.fail("创建角色失败: " + e.getMessage());
        }
    }

    /**
     * 查看所有项目管理角色
     */
    public Result<List<PRole>> getAllPRoles() {
        try {
            log.info("查看所有项目管理角色");
            List<PRole> roles = pRoleRepository.findAll();

            // 计算每个角色的用户数量
            for (PRole role : roles) {
                List<Project> projects = projectRepository.findByRole(role.getRoleName());
                role.setUsersCount(projects.size());
            }

            log.info("查询到 {} 个项目管理角色", roles.size());
            return Result.success(roles, "查询成功");
        } catch (Exception e) {
            log.error("查询所有项目管理角色失败", e);
            return Result.fail("查询失败: " + e.getMessage());
        }
    }

    /**
     * 根据角色名称查询项目管理角色
     */
    public Result<List<PRole>> getPRolesByName(String roleName) {
        try {
            log.info("根据角色名称查询项目管理角色: {}", roleName);
            List<PRole> roles = pRoleRepository.findByRoleNameContaining(roleName);
            log.info("查询到 {} 个项目管理角色", roles.size());
            return Result.success(roles, "查询成功");
        } catch (Exception e) {
            log.error("根据角色名称查询项目管理角色失败", e);
            return Result.fail("查询失败: " + e.getMessage());
        }
    }

    /**
     * 根据ID获取项目管理角色
     */
    public Result<PRole> getPRoleById(String id) {
        try {
            log.info("根据ID获取项目管理角色: {}", id);
            Optional<PRole> roleOpt = pRoleRepository.findById(id);
            if (roleOpt.isPresent()) {
                PRole role = roleOpt.get();
                // 计算该角色的用户数量
                List<Project> projects = projectRepository.findByRole(role.getRoleName());
                role.setUsersCount(projects.size());
                return Result.success(role, "查询成功");
            } else {
                return Result.fail("角色不存在");
            }
        } catch (Exception e) {
            log.error("根据ID获取项目管理角色失败", e);
            return Result.fail("查询失败: " + e.getMessage());
        }
    }

    /**
     * 更新项目管理角色
     */
    public Result<PRole> updatePRole(String id, RoleUpdateRequest request) {
        try {
            log.info("更新项目管理角色: {} - {}", id, request.getRoleName());

            // 检查角色是否存在
            Optional<PRole> roleOpt = pRoleRepository.findById(id);
            if (!roleOpt.isPresent()) {
                return Result.fail("角色不存在");
            }

            // 检查角色名称是否与其他角色重复
            if (pRoleRepository.existsByRoleNameAndIdNot(request.getRoleName(), id)) {
                return Result.fail("角色名称已存在");
            }

            // 更新角色信息
            PRole pRole = roleOpt.get();
            BeanUtils.copyProperties(request, pRole);

            PRole savedRole = pRoleRepository.save(pRole);
            log.info("项目管理角色更新成功: {}", savedRole.getRoleName());
            return Result.success(savedRole, "角色更新成功");

        } catch (Exception e) {
            log.error("更新项目管理角色失败", e);
            return Result.fail("更新角色失败: " + e.getMessage());
        }
    }

    /**
     * 删除项目管理角色
     */
    public Result<String> deletePRole(String id) {
        try {
            log.info("删除项目管理角色: {}", id);

            // 检查角色是否存在
            if (!pRoleRepository.existsById(id)) {
                return Result.fail("角色不存在");
            }

            pRoleRepository.deleteById(id);
            log.info("项目管理角色删除成功: {}", id);
            return Result.success(id, "角色删除成功");

        } catch (Exception e) {
            log.error("删除项目管理角色失败", e);
            return Result.fail("删除角色失败: " + e.getMessage());
        }
    }

    // ==================== 个人资料管理方法 ====================

    /**
     * 修改项目管理员密码
     */
    public Result<String> changePassword(String projectId, ChangePasswordRequest request) {
        try {
            log.info("项目管理员修改密码: projectId={}", projectId);

            // 验证新密码和确认密码是否一致
            if (!request.getNewPassword().equals(request.getConfirmPassword())) {
                return Result.fail("新密码和确认密码不一致");
            }

            // 验证项目管理员是否存在
            Optional<Project> projectOpt = projectRepository.findById(projectId);
            if (!projectOpt.isPresent()) {
                return Result.fail("项目管理员信息不存在");
            }

            Project project = projectOpt.get();

            Boolean result = PasswordUtil.checkPassword(request.getCurrentPassword(),project.getPassword());
            // 验证当前密码是否正确
            if (!result) {
                return Result.fail("当前密码不正确");
            }

            String PasswordHash = request.getNewPassword();
            // 更新密码
            project.setPassword(PasswordUtil.encryptPassword(PasswordHash));
            project.setUpdateTime(LocalDateTime.now());
            projectRepository.save(project);

            log.info("项目管理员密码修改成功: {}", project.getName());
            return Result.success("密码修改成功");

        } catch (Exception e) {
            log.error("修改项目管理员密码失败", e);
            return Result.fail("修改密码失败: " + e.getMessage());
        }
    }

    // ==================== 用户管理方法 ====================

    /**
     * 获取所有项目管理员用户
     */
    public Result<List<UserResponse>> getAllUsers() {
        try {
            log.info("项目管理员获取所有项目管理员用户");
            List<UserResponse> users = new ArrayList<>();

            // 只获取项目管理员，不包含教师
            List<Project> projects = projectRepository.findAll();
            for (Project project : projects) {
                UserResponse userResponse = new UserResponse();
                userResponse.setId(project.getId());
                userResponse.setName(project.getName());
                userResponse.setEmail(project.getEmail());

                // 处理角色显示：如果是ID则转换为角色名称
                String roleDisplay = project.getRole();
                if (roleDisplay != null && roleDisplay.length() == 24) { // MongoDB ObjectId长度为24
                    try {
                        Optional<PRole> roleOpt = pRoleRepository.findById(roleDisplay);
                        if (roleOpt.isPresent()) {
                            roleDisplay = roleOpt.get().getRoleName();
                        }
                    } catch (Exception e) {
                        // 如果查找失败，保持原值
                        log.warn("无法找到角色ID对应的角色名称: {}", roleDisplay);
                    }
                }
                userResponse.setRole(roleDisplay);

                userResponse.setDepartment(project.getDepartment());
                userResponse.setUserType("project");
                userResponse.setStatus(project.getStatus());
                userResponse.setCreatedAt(project.getCreateTime());

                users.add(userResponse);
            }

            log.info("获取到 {} 个项目管理员用户", users.size());
            return Result.success(users, "查询成功");
        } catch (Exception e) {
            log.error("获取项目管理员用户失败", e);
            return Result.fail("查询失败: " + e.getMessage());
        }
    }

    /**
     * 创建项目管理员用户
     */
    public Result<Project> createProjectUser(UserCreateRequest request) {
        try {
            log.info("创建项目管理员用户: {}", request.getName());

            // 验证用户类型必须是项目管理员
            if (!"project".equals(request.getUserType())) {
                return Result.fail("项目管理员只能创建项目管理员用户");
            }

            // 检查邮箱是否已存在
            if (projectRepository.findByEmail(request.getEmail()).isPresent()) {
                return Result.fail("邮箱已存在");
            }

            // 根据角色ID查找角色名称
            String roleName = request.getRole();
            if (request.getRole() != null && !request.getRole().isEmpty()) {
                Optional<PRole> roleOpt = pRoleRepository.findById(request.getRole());
                if (roleOpt.isPresent()) {
                    roleName = roleOpt.get().getRoleName();
                } else {
                    return Result.fail("指定的角色不存在");
                }
            }

            // 自动生成随机密码
            String randomPassword = PasswordUtil.generateRandomPassword(8);
            String encryptedPassword = PasswordUtil.encryptPassword(randomPassword);

            // 创建项目管理员实体
            Project project = new Project();
            project.setName(request.getName());
            project.setEmail(request.getEmail());
            project.setPassword(encryptedPassword);
            project.setRole(roleName); // 使用角色名称而不是ID
            project.setDepartment(request.getDepartment());
            project.setStatus(request.getStatus());

            LocalDateTime now = LocalDateTime.now();
            project.setCreateTime(now);
            project.setUpdateTime(now);
            project.setLastLoginTime(now);

            Project savedProject = projectRepository.save(project);

            // 异步发送初始密码邮件
            emailServices.sendEmailAsync(
                    savedProject.getEmail(),
                    savedProject.getName(),
                    savedProject.getDepartment(),
                    randomPassword,
                    EmailServices.EmailType.PROJECT_ADMIN_INITIAL_PASSWORD,
                    null,
                    null
            );

            String message = "用户创建成功，初始密码已生成，初始密码邮件已发送（异步）";
            log.info("项目管理员用户创建成功: {} - 初始密码: {}", savedProject.getName(), randomPassword);

            return Result.success(savedProject, message);

        } catch (Exception e) {
            log.error("创建项目管理员用户失败", e);
            return Result.fail("创建用户失败: " + e.getMessage());
        }
    }


    /**
     * 更新项目管理员用户
     */
    public Result<Project> updateProjectUser(String id, UserUpdateRequest request) {
        try {
            log.info("更新项目管理员用户: {} - {}", id, request.getName());

            // 检查用户是否存在
            Optional<Project> projectOpt = projectRepository.findById(id);
            if (!projectOpt.isPresent()) {
                return Result.fail("用户不存在");
            }

            // 检查邮箱是否与其他用户重复
            Optional<Project> existingProject = projectRepository.findByEmail(request.getEmail());
            if (existingProject.isPresent() && !existingProject.get().getId().equals(id)) {
                return Result.fail("邮箱已被其他用户使用");
            }

            // 根据角色ID查找角色名称
            String roleName = request.getRole();
            if (request.getRole() != null && !request.getRole().isEmpty()) {
                Optional<PRole> roleOpt = pRoleRepository.findById(request.getRole());
                if (roleOpt.isPresent()) {
                    roleName = roleOpt.get().getRoleName();
                } else {
                    return Result.fail("指定的角色不存在");
                }
            }

            // 更新用户信息
            Project project = projectOpt.get();
            project.setName(request.getName());
            project.setEmail(request.getEmail());
            project.setRole(roleName); // 使用角色名称而不是ID
            project.setDepartment(request.getDepartment());
            project.setStatus(request.getStatus());

            Project savedProject = projectRepository.save(project);
            log.info("项目管理员用户更新成功: {}", savedProject.getName());
            return Result.success(savedProject, "用户更新成功");

        } catch (Exception e) {
            log.error("更新项目管理员用户失败", e);
            return Result.fail("更新用户失败: " + e.getMessage());
        }
    }

    /**
     * 删除项目管理员用户
     */
    public Result<String> deleteProjectUser(String id) {
        try {
            log.info("删除项目管理员用户: {}", id);

            // 检查用户是否存在
            Optional<Project> projectOpt = projectRepository.findById(id);
            if (!projectOpt.isPresent()) {
                return Result.fail("用户不存在");
            }

            Project project = projectOpt.get();

            // 可以添加额外的删除限制，比如不能删除当前登录用户等

            projectRepository.deleteById(id);
            log.info("项目管理员用户删除成功: {}", project.getName());
            return Result.success("用户删除成功");

        } catch (Exception e) {
            log.error("删除项目管理员用户失败", e);
            return Result.fail("删除用户失败: " + e.getMessage());
        }
    }

    // ==================== 学校管理员密码重置方法 ====================

    /**
     * 重置学校管理员密码
     */
    public Result<SchoolPasswordResetResponse> resetSchoolAdminPassword(SchoolPasswordResetRequest request) {
        try {
            log.info("开始重置学校管理员密码: 批量操作={}", request.isBatchOperation());

            if (!request.isValid()) {
                return Result.fail("请求参数无效");
            }

            SchoolPasswordResetResponse response = new SchoolPasswordResetResponse();

            if (request.isBatchOperation()) {
                // 批量重置
                for (String schoolId : request.getSchoolIds()) {
                    processSchoolPasswordReset(schoolId, request.getResetType(), response);
                }
            } else {
                // 单个重置
                processSchoolPasswordReset(request.getSchoolId(), request.getResetType(), response);
            }

            // 构建结果消息
            String message = buildResetResultMessage(response, request.getResetType());

            if (response.isAllSuccess()) {
                return Result.success(response, message);
            } else if (response.isPartialSuccess()) {
                return Result.success(response, message);
            } else {
                return Result.fail(message);
            }

        } catch (Exception e) {
            log.error("重置学校管理员密码失败", e);
            return Result.fail("重置密码失败: " + e.getMessage());
        }
    }

    /**
     * 处理单个学校的密码重置（发送重置邮件）
     */
    private void processSchoolPasswordReset(String schoolId, String resetType, SchoolPasswordResetResponse response) {
        try {
            log.info("处理学校密码重置: schoolId={}, resetType={}", schoolId, resetType);

            // 查找学校
            Optional<School> schoolOpt = schoolRepository.findById(schoolId);
            if (!schoolOpt.isPresent()) {
                response.addFailure(schoolId, "未知学校", "", "学校不存在");
                return;
            }

            School school = schoolOpt.get();

            // 查找学校管理员
            if (school.getTadmin() == null || school.getTadmin().trim().isEmpty()) {
                response.addFailure(schoolId, school.getUniversityName(), "", "学校未设置管理员");
                return;
            }

            Optional<Teacher> teacherOpt = teacherRepository.findByTeacherId(school.getTadmin());
            if (!teacherOpt.isPresent()) {
                response.addFailure(schoolId, school.getUniversityName(), "", "学校管理员不存在");
                return;
            }

            Teacher teacher = teacherOpt.get();

            // 生成重置 token 并缓存 5 分钟
            String token = UUID.randomUUID().toString();
            redisTemplate.opsForValue().set(RESET_KEY_PREFIX + token, school.getTadmin(), 5, TimeUnit.MINUTES);

            // 构建重置链接
            String resetLink = "http://pelegant.info:8080/page/reset-password?token=" + token;

            // 异步发送邮件
            emailServices.sendEmailAsync(
                    teacher.getEmail(),
                    teacher.getName(),
                    school.getUniversityName(),
                    null,
                    EmailServices.EmailType.PASSWORD_RESET_LINK,
                    null,
                    resetLink
            );

            response.addSuccess(schoolId, school.getUniversityName(), teacher.getEmail(), "[等待用户设置新密码]", true);

            log.info("重置邮件已异步发送: {} - {}", school.getUniversityName(), teacher.getEmail());

        } catch (Exception e) {
            log.error("发送密码重置邮件失败: schoolId={}", schoolId, e);
            response.addFailure(schoolId, "处理失败", "", "系统错误: " + e.getMessage());
        }
    }


    /**
     * 处理单个学校的密码重置（管理员直接密码重置）
     */
//    private void processSchoolPasswordReset(String schoolId, String resetType, SchoolPasswordResetResponse response) {
//        try {
//            log.info("处理学校密码重置: schoolId={}, resetType={}", schoolId, resetType);
//
//            // 查找学校
//            Optional<School> schoolOpt = schoolRepository.findById(schoolId);
//            if (!schoolOpt.isPresent()) {
//                response.addFailure(schoolId, "未知学校", "", "学校不存在");
//                return;
//            }
//
//            School school = schoolOpt.get();
//
//            // 查找学校管理员
//            if (school.getTadmin() == null || school.getTadmin().trim().isEmpty()) {
//                response.addFailure(schoolId, school.getUniversityName(), "", "学校未设置管理员");
//                return;
//            }
//
//            Optional<Teacher> teacherOpt = teacherRepository.findByTeacherId(school.getTadmin());
//            if (!teacherOpt.isPresent()) {
//                response.addFailure(schoolId, school.getUniversityName(), "", "学校管理员不存在");
//                return;
//            }
//
//            Teacher teacher = teacherOpt.get();
//
//            // 生成新密码
//            String newPassword = "12345678";
//            String newPasswordHash = PasswordUtil.encryptPassword(newPassword);
//
//            // 更新教师密码
//            teacher.setPassword(newPasswordHash);
//            teacherRepository.save(teacher);
//
              // 发送邮件
//            boolean emailSent;
//            if ("reset".equals(resetType)) {
//                emailSent = emailServices.sendEmail(
//                        teacher.getEmail(),
//                        teacher.getName(),
//                        school.getUniversityName(),
//                        newPassword,
//                        EmailServices.EmailType.PASSWORD_RESET,
//                        null
//                );
//            } else {
//                emailSent = emailServices.sendEmail(
//                        teacher.getEmail(),
//                        teacher.getName(),
//                        school.getUniversityName(),
//                        newPassword,
//                        EmailServices.EmailType.ADMIN_INITIAL_PASSWORD,
//                        null
//                );
//            }

//            response.addSuccess(schoolId, school.getUniversityName(), teacher.getEmail(), newPassword, emailSent);
//            log.info("学校管理员密码重置成功: {} - {}", school.getUniversityName(), teacher.getEmail());
//
//        } catch (Exception e) {
//            log.error("处理学校密码重置失败: schoolId={}", schoolId, e);
//            response.addFailure(schoolId, "处理失败", "", "系统错误: " + e.getMessage());
//        }
//    }

    /**
     * 构建重置结果消息
     */
    private String buildResetResultMessage(SchoolPasswordResetResponse response, String resetType) {
        String action = "reset".equals(resetType) ? "重置" : "设置";

        if (response.isAllSuccess()) {
            if (response.getTotalCount() == 1) {
                return String.format("发送重置密码邮件%s成功", action);
            } else {
                return String.format("批量发送重置密码邮件%s成功，共处理 %d 所学校", action, response.getTotalCount());
            }
        } else if (response.isPartialSuccess()) {
            return String.format("部分%s成功：成功 %d 所，失败 %d 所",
                    action, response.getSuccessCount(), response.getFailureCount());
        } else {
            return String.format("发送密码邮件%s失败", action);
        }
    }

    /**
     * 批量导入学校Excel文件
     */
    public Result<SchoolBatchImportResponse> importSchoolsFromExcel(MultipartFile file) {
        try {
            log.info("开始处理学校Excel导入: fileName={}", file.getOriginalFilename());

            // 验证文件类型
            if (!isExcelFile(file)) {
                return Result.fail("请上传Excel文件（.xlsx或.xls格式）");
            }

            List<String> errorMessages = new ArrayList<>();
            List<String> successSchoolIds = new ArrayList<>();
            int totalCount = 0;
            int successCount = 0;

            try (Workbook workbook = createWorkbook(file)) {
                Sheet sheet = workbook.getSheetAt(0);

                // 跳过标题行，从第二行开始处理
                for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                    Row row = sheet.getRow(i);
                    if (row == null)
                        continue;

                    totalCount++;

                    try {
                        // 解析Excel行数据
                        SchoolCreateRequest schoolData = parseSchoolFromRow(row, i + 1);
                        if (schoolData == null) {
                            totalCount--; // 空行不计入总数
                            continue; // 跳过空行
                        }

                        // 创建学校
                        Result<School> createResult = addSchool(schoolData);
                        if (createResult.isSuccess()) {
                            successCount++;
                            successSchoolIds.add(createResult.getData().getId());
                            log.info("成功导入学校: {} (第{}行)", schoolData.getUniversityName(), i + 1);
                        } else {
                            errorMessages.add(String.format("第%d行: %s", i + 1, createResult.getMessage()));
                        }

                    } catch (Exception e) {
                        log.error("处理第{}行数据时出错", i + 1, e);
                        errorMessages.add(String.format("第%d行: 数据格式错误 - %s", i + 1, e.getMessage()));
                    }
                }
            }

            int failCount = totalCount - successCount;

            SchoolBatchImportResponse response = new SchoolBatchImportResponse(
                    totalCount, successCount, failCount, errorMessages, successSchoolIds);

            if (successCount == totalCount) {
                return Result.success(response, String.format("导入成功！共处理 %d 条记录", totalCount));
            } else if (successCount > 0) {
                return Result.success(response, String.format("部分导入成功！成功 %d 条，失败 %d 条", successCount, failCount));
            } else {
                return Result.fail("导入失败！所有记录都未能成功导入");
            }

        } catch (Exception e) {
            log.error("Excel导入处理失败", e);
            return Result.fail("Excel文件处理失败: " + e.getMessage());
        }
    }

    /**
     * 验证是否为Excel文件
     */
    private boolean isExcelFile(MultipartFile file) {
        String filename = file.getOriginalFilename();
        return filename != null && (filename.endsWith(".xlsx") || filename.endsWith(".xls"));
    }

    /**
     * 创建Workbook对象
     */
    private Workbook createWorkbook(MultipartFile file) throws IOException {
        String filename = file.getOriginalFilename();
        if (filename != null && filename.endsWith(".xlsx")) {
            return new XSSFWorkbook(file.getInputStream());
        } else {
            return new HSSFWorkbook(file.getInputStream());
        }
    }

    /**
     * 从Excel行解析学校数据
     */
    private SchoolCreateRequest parseSchoolFromRow(Row row, int rowNum) {
        try {
            // 检查是否为空行
            if (isEmptyRow(row)) {
                return null;
            }

            SchoolCreateRequest school = new SchoolCreateRequest();

            // A列: universityName (必填)
            Cell nameCell = row.getCell(0);
            if (nameCell == null || getCellValueAsString(nameCell).trim().isEmpty()) {
                throw new RuntimeException("学校名称不能为空");
            }
            school.setUniversityName(getCellValueAsString(nameCell).trim());

            // B列: universityType (提供默认值)
            Cell typeCell = row.getCell(1);
            String universityType = getCellValueAsString(typeCell).trim();
            school.setUniversityType(universityType.isEmpty() ? "综合类大学" : universityType);

            // C列: universityAddress (提供默认值)
            Cell addressCell = row.getCell(2);
            String universityAddress = getCellValueAsString(addressCell).trim();
            school.setUniversityAddress(universityAddress.isEmpty() ? "地址待完善" : universityAddress);

            // D列: adminEmail (必填)
            Cell emailCell = row.getCell(3);
            if (emailCell == null || getCellValueAsString(emailCell).trim().isEmpty()) {
                throw new RuntimeException("管理员邮箱不能为空");
            }
            school.setAdminEmail(getCellValueAsString(emailCell).trim());

            // E列: universityWebsite (提供默认值)
            Cell websiteCell = row.getCell(4);
            String universityWebsite = getCellValueAsString(websiteCell).trim();
            if (universityWebsite.isEmpty()) {
                school.setUniversityWebsite("http://www.example.com");
            } else if (!universityWebsite.startsWith("http://") && !universityWebsite.startsWith("https://")) {
                school.setUniversityWebsite("http://" + universityWebsite);
            } else {
                school.setUniversityWebsite(universityWebsite);
            }

            // F列: status (默认为active)
            Cell statusCell = row.getCell(5);
            String status = getCellValueAsString(statusCell).trim();
            school.setStatus(status.isEmpty() ? "active" : status);

            // G列: universityDescription (提供默认值)
            Cell descCell = row.getCell(6);
            String universityDescription = getCellValueAsString(descCell).trim();
            school.setUniversityDescription(universityDescription.isEmpty() ? "学校简介待完善" : universityDescription);

            return school;

        } catch (Exception e) {
            throw new RuntimeException("数据解析失败: " + e.getMessage());
        }
    }

    /**
     * 检查是否为空行
     */
    private boolean isEmptyRow(Row row) {
        if (row == null)
            return true;

        for (int i = 0; i < 7; i++) { // 检查前7列
            Cell cell = row.getCell(i);
            if (cell != null && !getCellValueAsString(cell).trim().isEmpty()) {
                return false;
            }
        }
        return true;
    }

    /**
     * 获取单元格值作为字符串
     */
    private String getCellValueAsString(Cell cell) {
        if (cell == null)
            return "";

        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue();
            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell)) {
                    return cell.getDateCellValue().toString();
                } else {
                    return String.valueOf((long) cell.getNumericCellValue());
                }
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            case FORMULA:
                return cell.getCellFormula();
            default:
                return "";
        }
    }

    // ==================== 爬虫数据导入方法 ====================

//    /**
//     * 导入爬虫数据
//     */
public Result<CrawlerDataImportResponse> importCrawlerData(CrawlerDataImportRequest request) {
    // 删除所有爬虫数据
    mongoTemplate.remove(new Query(), CrawlerData.class);
    log.info("已删除 crawler_data 表中的所有数据");

    try {
        log.info("开始导入爬虫数据: dataType={}, crawlerName={}, batchId={}",
                request.getDataType(), request.getCrawlerName(), request.getBatchId());

        String batchId = Optional.ofNullable(request.getBatchId()).filter(s -> !s.isEmpty())
                .orElse(generateBatchId(request.getDataType(), request.getCrawlerName()));

        LocalDateTime importTime = LocalDateTime.now();
        List<String> importedIds = new ArrayList<>();
        List<CrawlerDataImportResponse.FailedDataInfo> failedData = new ArrayList<>();

        // 统一单条和批量数据
        List<Map<String, Object>> allData = new ArrayList<>();
        if (request.getData() != null) allData.add(request.getData());
        if (request.getDataList() != null) allData.addAll(request.getDataList());

        if (allData.isEmpty()) {
            return Result.fail("没有提供要导入的数据");
        }

        // 保存数据
        for (int i = 0; i < allData.size(); i++) {
            Map<String, Object> data = allData.get(i);
            try {
                String id = saveCrawlerData(request, data, batchId, importTime);
                importedIds.add(id);
            } catch (Exception e) {
                log.error("保存第{}条爬虫数据失败", i + 1, e);
                CrawlerDataImportResponse.FailedDataInfo failedInfo = new CrawlerDataImportResponse.FailedDataInfo();
                failedInfo.setIndex(i);
                failedInfo.setReason(e.getMessage());
                failedInfo.setData(data);
                failedData.add(failedInfo);
            }
        }

        // 构建公司映射
        List<Company> allCompanies = mongoTemplate.findAll(Company.class);
        Map<String, String> companyNameToIdMap = new HashMap<>();
        for (Company c : allCompanies) {
            if (c.getCompanyName() != null) companyNameToIdMap.put(c.getCompanyName().toLowerCase(), c.getCompanyId());
            if (c.getCompanyNameLower() != null) companyNameToIdMap.put(c.getCompanyNameLower().toLowerCase(), c.getCompanyId());
        }

        // 执行数据迁移和去重
        List<CrawlerData> savedData = mongoTemplate.find(new Query(Criteria.where("batchId").is(batchId)), CrawlerData.class);
        String migrationResult = dataMigrationService.migrateDataOptimized(savedData);

        // 创建响应
        CrawlerDataImportResponse response = CrawlerDataImportResponse.success(
                String.format("成功导入 %d/%d 条数据", importedIds.size(), allData.size()),
                importedIds.size(), allData.size(), batchId, importedIds);
        response.setFailedData(failedData);
        response.setMessage(response.getMessage() + "; 迁移结果: " + migrationResult);

        log.info("爬虫数据导入完成: 成功={}, 失败={}, 总数={}, 批次ID={}",
                importedIds.size(), failedData.size(), allData.size(), batchId);

        return Result.success(response, "数据导入完成");

    } catch (Exception e) {
        log.error("导入爬虫数据失败", e);
        return Result.fail("导入爬虫数据失败: " + e.getMessage());
    }
}

    /**
     * 生成批次ID
     */
    private String generateBatchId(String dataType, String crawlerName) {
        String timestamp = String.valueOf(System.currentTimeMillis());
        String uuid = UUID.randomUUID().toString().substring(0, 8);
        return String.format("%s_%s_%s_%s", dataType, crawlerName, timestamp, uuid);
    }
    /**
     * 保存单条爬虫数据
     */
    private String saveCrawlerData(CrawlerDataImportRequest request, Map<String, Object> data,
                                   String batchId, LocalDateTime importTime) {

        // 去重逻辑
        if (request.getOverwrite() && request.getUniqueField() != null && !request.getUniqueField().isEmpty()) {
            Object uniqueValue = data.get(request.getUniqueField());
            if (uniqueValue != null) {
                Optional<CrawlerData> existingData = crawlerDataRepository.findByRawDataField(
                        request.getUniqueField(), uniqueValue);
                if (existingData.isPresent()) {
                    CrawlerData existing = existingData.get();
                    existing.setRawData(data);
                    existing.setProcessTime(importTime);
                    existing.setStatus("opening");
                    existing.setProcessMessage("数据已更新");
                    if (request.getMetadata() != null) existing.setMetadata(request.getMetadata());
                    return crawlerDataRepository.save(existing).getId();
                }
            }
        }

        // 新建记录
        CrawlerData crawlerData = new CrawlerData();
        crawlerData.setDataType(request.getDataType());
        crawlerData.setCrawlerName(request.getCrawlerName());
        crawlerData.setSourceUrl(request.getSourceUrl());
        crawlerData.setBatchId(batchId);
        crawlerData.setRawData(data);
        crawlerData.setStatus("opening");
        crawlerData.setDataCreateTime(request.getDataCreateTime());
        crawlerData.setImportTime(importTime);
        crawlerData.setMetadata(request.getMetadata());

        return crawlerDataRepository.save(crawlerData).getId();
    }


    /**
     * 查询爬虫数据
     */
    public Result<List<CrawlerData>> getCrawlerData(String dataType, String crawlerName,
                                                    String status, String batchId, int page, int size) {
        try {
            Query query = new Query();
            if (dataType != null && !dataType.trim().isEmpty()) query.addCriteria(Criteria.where("dataType").is(dataType));
            if (crawlerName != null && !crawlerName.trim().isEmpty()) query.addCriteria(Criteria.where("crawlerName").is(crawlerName));
            if (status != null && !status.trim().isEmpty()) query.addCriteria(Criteria.where("status").is(status));
            if (batchId != null && !batchId.trim().isEmpty()) query.addCriteria(Criteria.where("batchId").is(batchId));

            query.skip((long) page * size).limit(size);
            query.with(Sort.by(Sort.Direction.DESC, "importTime"));

            List<CrawlerData> list = mongoTemplate.find(query, CrawlerData.class);
            return Result.success(list, (long) list.size());
        } catch (Exception e) {
            log.error("查询爬虫数据失败", e);
            return Result.fail("查询爬虫数据失败: " + e.getMessage());
        }
    }

    //清洗爬虫数据
//    private Map<String, Object> clearAndMigrateCrawlerData() {
//        Map<String, Object> result = new HashMap<>();
//
//        // 查询所有爬虫数据
//        List<CrawlerData> crawlerDataList = mongoTemplate.find(
//                new Query().with(Sort.by(Sort.Direction.DESC, "importTime")), CrawlerData.class);
//        log.info("查询到 {} 条爬虫数据", crawlerDataList.size());
//
//        // 去重：以 company + title 为唯一标识
//        Map<String, CrawlerData> uniqueMap = new HashMap<>();
//        List<String> idsToDelete = new ArrayList<>();
//
//        for (CrawlerData data : crawlerDataList) {
//            Map<String, Object> raw = data.getRawData();
//            String company = Optional.ofNullable(raw.get("company")).map(Object::toString).orElse("").trim().toLowerCase();
//            String title = Optional.ofNullable(raw.get("title")).map(Object::toString).orElse("").trim();
//
//            String key = company + "|" + title;
//
//            if (uniqueMap.containsKey(key)) {
//                CrawlerData existing = uniqueMap.get(key);
//                if (data.getImportTime().isAfter(existing.getImportTime())) {
//                    idsToDelete.add(existing.getId());
//                    uniqueMap.put(key, data);
//                } else {
//                    idsToDelete.add(data.getId());
//                }
//            } else {
//                uniqueMap.put(key, data);
//            }
//        }
//
//        // 批量删除重复数据
//        if (!idsToDelete.isEmpty()) {
//            Query delQuery = new Query(Criteria.where("id").in(idsToDelete));
//            mongoTemplate.remove(delQuery, CrawlerData.class);
//        }
//
//        log.info("去重完成，保留 {} 条数据，删除 {} 条重复数据", uniqueMap.size(), idsToDelete.size());
//        result.put("deletedDuplicates", idsToDelete.size());
//
//        // 生成公司映射 (Java 8 兼容)
//        Map<String, String> companyNameToIdMap = new HashMap<>();
//        List<Company> allCompanies = mongoTemplate.findAll(Company.class);
//        for (Company c : allCompanies) {
//            if (c.getCompanyId() == null) continue;
//            if (c.getCompanyName() != null && !c.getCompanyName().trim().isEmpty()) {
//                companyNameToIdMap.put(c.getCompanyName().toLowerCase(), c.getCompanyId());
//            }
//            if (c.getCompanyNameLower() != null && !c.getCompanyNameLower().trim().isEmpty()) {
//                companyNameToIdMap.put(c.getCompanyNameLower().toLowerCase(), c.getCompanyId());
//            }
//        }
//
//        // 执行数据迁移
//        String migrationResult = dataMigrationService.migrateDataWithMatchingCompanyOptimized(
//                new ArrayList<>(uniqueMap.values()), companyNameToIdMap
//        );
//
//        result.put("migrationResult", migrationResult);
//        return result;
//    }


    /**
     * 删除爬虫数据，调用 repository 删除
     */
    public Result<String> deleteCrawlerData(String id) {
        try {
            Optional<CrawlerData> opt = crawlerDataRepository.findById(id);
            if (!opt.isPresent()) return Result.fail("爬虫数据不存在，id=" + id);
            crawlerDataRepository.deleteById(id);
            return Result.success("删除成功");
        } catch (Exception e) {
            log.error("删除爬虫数据失败, id={}", id, e);
            return Result.fail("删除失败: " + e.getMessage());
        }
    }


    public List<Job> getAllJobandCompany() {
        return jobRepository.findAll();
    }
    public Result<DashboardDataDto> getAllData() {
        DashboardDataDto dashboardDataDto = new DashboardDataDto();
        dashboardDataDto.setTotalStudents((int) studentRepository.count());
        dashboardDataDto.setTotalCompanies((int) companyRepository.count());
        dashboardDataDto.setTotalSchools((int) schoolRepository.count());

        Query query = new Query();

        // 添加 jobType 限制条件，匹配 full-time-campus 和 intern
        query.addCriteria(Criteria.where("jobType").in("full-time-campus", "intern"));

        // 添加地区条件
        query.addCriteria(Criteria.where("workLocation").regex(HONG_KONG_REGEX, "i"));

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

        // 建立 companyId -> logoImage 和 companyUrl 映射
        Map<String, String> companyLogoMap = new HashMap<>();
        Map<String, String> companyUrlMap = new HashMap<>();
        for (Company company : companyList) {
            companyLogoMap.put(company.getCompanyId(), company.getLogoImage());
            companyUrlMap.put(company.getCompanyId(), company.getCompanyUrl());
        }

        // 设置 job 的 id、logoImage 和 companyUrl
        for (Job job : jobs) {
            job.setId(job.getJobId()); // 修改 id 为 jobId
            String logoImage = companyLogoMap.get(job.getCompanyId());
            String companyUrl = companyUrlMap.get(job.getCompanyId());
            job.setLogoImage(logoImage); // 设置 logoImage
            job.setCompanyUrl(companyUrl); // 设置 companyUrl
        }

        dashboardDataDto.setTotalJobs((int) total);

        // 获取今天的日期
       LocalDate today = LocalDate.now();
        // 获取 UTC+8 时区的当前时间
        ZonedDateTime todayUtc8 = ZonedDateTime.now(ZoneOffset.ofHours(8));
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDate localDate = todayUtc8.toLocalDate();

        // 查询是否已有当天的记录
        DashboardData existingData = dashboardDataRepository.findByCreatedAt(localDate);

        if (existingData != null) {
            // 如果存在，直接更新数据
            existingData.setTotalStudents((int) studentRepository.count());
            existingData.setTotalCompanies((int) companyRepository.count());
            existingData.setTotalSchools((int) schoolRepository.count());
            existingData.setTotalJobs((int) total);
            existingData.setCreatedAt(localDate); // 更新当天的日期
            System.out.println("当天日期"+todayUtc8);

            // 保存更新后的数据
            dashboardDataRepository.save(existingData);

            // 计算增量：7天前的数据
            LocalDate sevenDaysAgo = LocalDate.from(localDate.minusDays(7));
            System.out.println("7天前的日期：" + sevenDaysAgo);
            DashboardData sevenDaysAgoData = dashboardDataRepository.findByCreatedAt(sevenDaysAgo);
            System.out.println("7天前的数据：" + sevenDaysAgoData);

            if (sevenDaysAgoData != null) {
                // 如果存在7天前的记录，计算增量
                long previousTotalStudents = sevenDaysAgoData.getTotalStudents();
                long previousTotalJobs = sevenDaysAgoData.getTotalJobs();
                long previousTotalCompanies = sevenDaysAgoData.getTotalCompanies();
                long previousTotalSchools = sevenDaysAgoData.getTotalSchools();

                // 更新增量数据
                dashboardDataDto.setTotalStudentsincrease((int) (dashboardDataDto.getTotalStudents() - previousTotalStudents));
                dashboardDataDto.setTotalJobsincrease((int) (dashboardDataDto.getTotalJobs() - previousTotalJobs));
                dashboardDataDto.setTotalCompaniesincrease((int) (dashboardDataDto.getTotalCompanies() - previousTotalCompanies));
                dashboardDataDto.setTotalSchoolsincrease((int) (dashboardDataDto.getTotalSchools() - previousTotalSchools));

                // 计算百分比
                dashboardDataDto.setTotalStudentsincreasePercent(String.valueOf(calculatePercentage(previousTotalStudents, dashboardDataDto.getTotalStudentsincrease()))+"%");
                dashboardDataDto.setTotalJobsincreasePercent(String.valueOf(calculatePercentage(previousTotalJobs, dashboardDataDto.getTotalJobsincrease()))+"%");
                dashboardDataDto.setTotalCompaniesincreasePercent(String.valueOf(calculatePercentage(previousTotalCompanies, dashboardDataDto.getTotalCompaniesincrease()))+"%");
                dashboardDataDto.setTotalSchoolsincreasePercent(String.valueOf(calculatePercentage(previousTotalSchools, dashboardDataDto.getTotalSchoolsincrease()))+"%");
            } else {
                // 如果没有7天前的记录，增量为0
                dashboardDataDto.setTotalStudentsincrease(0);
                dashboardDataDto.setTotalJobsincrease(0);
                dashboardDataDto.setTotalCompaniesincrease(0);
                dashboardDataDto.setTotalSchoolsincrease(0);

                dashboardDataDto.setTotalStudentsincreasePercent(String.valueOf(0.0));
                dashboardDataDto.setTotalJobsincreasePercent(String.valueOf(0.0));
                dashboardDataDto.setTotalCompaniesincreasePercent(String.valueOf(0.0));
                dashboardDataDto.setTotalSchoolsincreasePercent(String.valueOf(0.0));
            }

        } else {
            // 如果今天没有记录，则创建新数据
            DashboardData dashboardData = new DashboardData();
            dashboardData.setTotalStudents((int) studentRepository.count());
            dashboardData.setTotalCompanies((int) companyRepository.count());
            dashboardData.setTotalSchools((int) schoolRepository.count());
            dashboardData.setTotalJobs((int) total);
//            dashboardData.setCreatedAt(today);
            dashboardData.setCreatedAt(localDate); // 保存为 UTC+8 时间

            // 保存到数据库
            dashboardDataRepository.save(dashboardData);

            // 增量和百分比为0，因为是第一次创建
            dashboardDataDto.setTotalStudentsincrease(0);
            dashboardDataDto.setTotalJobsincrease(0);
            dashboardDataDto.setTotalCompaniesincrease(0);
            dashboardDataDto.setTotalSchoolsincrease(0);

            dashboardDataDto.setTotalStudentsincreasePercent(String.valueOf(0.0));
            dashboardDataDto.setTotalJobsincreasePercent(String.valueOf(0.0));
            dashboardDataDto.setTotalCompaniesincreasePercent(String.valueOf(0.0));
            dashboardDataDto.setTotalSchoolsincreasePercent(String.valueOf(0.0));
        }

        return Result.success(dashboardDataDto);
    }


    // 计算百分比的帮助函数
    private double calculatePercentage(long previousValue, long increase) {
        if (previousValue == 0) {
            return increase > 0 ? 100 : 0; // 如果之前值为0，增量大于0返回100，反之为0
        }
        BigDecimal percentage = new BigDecimal((double) increase / previousValue * 100);

        return percentage.setScale(1, RoundingMode.HALF_UP).doubleValue(); // 保留一位小数
    }



    public Result<Company> updateCompany(String companyId, CompanyCreateRequest company){
        Company existingCompany = companyRepository.findByCompanyId(companyId).orElse(null);
        if (existingCompany != null) {
            existingCompany.setCompanyName(company.getCompanyName());
            existingCompany.setCompanyType(company.getCompanyType());
            existingCompany.setIndustry(company.getIndustry());
            existingCompany.setCompanyAddress(company.getCompanyAddress());
            existingCompany.setContactPerson(company.getContactPerson());
            existingCompany.setContactPhone(company.getContactPhone());
            existingCompany.setContactEmail(company.getContactEmail());
            existingCompany.setStatus(company.getStatus());
            existingCompany.setCreatedAt(company.getPartnershipDate().atStartOfDay());
            existingCompany.setUpdatedAt(LocalDateTime.now());
        }
        companyRepository.save(existingCompany);
        return Result.success(existingCompany);
    }


    /**
     * 在 ProjectService.java 中添加统计方法
     */
    public Result<SchoolStatisticsResponse> getSchoolStatistics() {
        try {
            log.info("获取学校统计数据");

            SchoolStatisticsResponse response = new SchoolStatisticsResponse();

            // 1. 获取学校总数
            long totalSchools = schoolRepository.count();
            response.setTotalSchools(totalSchools);

            // 2. 获取今年新增学校数量
            int currentYear = Year.now().getValue();
            long newSchoolsThisYear = Optional.ofNullable(schoolRepository.countByCreatedAtYear(currentYear)).orElse(0L);
            response.setNewSchoolsThisYear(newSchoolsThisYear);

            // 3. 获取所有学校信息
            List<School> schools = schoolRepository.findAll();

            // 4. 计算每月新增学校数量
            Map<Integer, Long> monthlyNewSchools = new HashMap<>();
            for (int m = 1; m <= 12; m++) {
                monthlyNewSchools.put(m, 0L);
            }
            for (School s : schools) {
                if (s.getCreatedAt() != null && s.getCreatedAt().getYear() == currentYear) {
                    int month = s.getCreatedAt().getMonthValue();
                    monthlyNewSchools.put(month, monthlyNewSchools.get(month) + 1);
                }
            }
            response.setMonthlyNewSchools(monthlyNewSchools);

            // 5. 国家统计
            Map<String, Long> schoolsByCountry = new HashMap<>();
            for (School s : schools) {
                if (s.getCountry() != null) {
                    schoolsByCountry.put(s.getCountry(), schoolsByCountry.getOrDefault(s.getCountry(), 0L) + 1);
                }
            }
            response.setSchoolsByCountry(schoolsByCountry);

            // 找到学校最多的国家
            if (!schoolsByCountry.isEmpty()) {
                Map.Entry<String, Long> topCountryEntry = null;
                for (Map.Entry<String, Long> entry : schoolsByCountry.entrySet()) {
                    if (topCountryEntry == null || entry.getValue() > topCountryEntry.getValue()) {
                        topCountryEntry = entry;
                    }
                }
                if (topCountryEntry != null) {
                    response.setTopCountry(topCountryEntry.getKey());
                    response.setTopCountryCount(topCountryEntry.getValue());
                }
            }

            // 6. 洲统计
            List<ContinentCount> continentCounts = schoolRepository.countByContinent();
            Map<String, Long> continentMap = new HashMap<>();
            for (ContinentCount cc : continentCounts) {
                if (cc.getCount() > 0) {
                    continentMap.put(cc.getId(), cc.getCount());
                }
            }

            // 只允许显示指定洲，并按顺序
            List<String> allowedOrder = Arrays.asList(
                    "Asia", "Europe", "North America", "Oceania", "Africa", "South America"
            );
            Map<String, Long> filteredMap = new HashMap<>();
            List<String> orderedContinents = new ArrayList<>();
            for (String c : allowedOrder) {
                if (continentMap.containsKey(c)) {
                    filteredMap.put(c, continentMap.get(c));
                    orderedContinents.add(c);
                }
            }

            response.setSchoolsByContinent(filteredMap);
            response.setContinents(orderedContinents);

            // 找到学校最多的洲
            if (!filteredMap.isEmpty()) {
                Map.Entry<String, Long> mostSchoolsContinentEntry = null;
                for (Map.Entry<String, Long> entry : filteredMap.entrySet()) {
                    if (mostSchoolsContinentEntry == null || entry.getValue() > mostSchoolsContinentEntry.getValue()) {
                        mostSchoolsContinentEntry = entry;
                    }
                }
                if (mostSchoolsContinentEntry != null) {
                    response.setMostSchoolsContinent(mostSchoolsContinentEntry.getKey());
                    response.setMostSchoolsContinentCount(mostSchoolsContinentEntry.getValue());
                }
            }

            log.info("学校统计数据获取成功: 总数={}, 洲数量={}, 国家数量={}",
                    totalSchools, filteredMap.size(), schoolsByCountry.size());

            return Result.success(response, "统计数据获取成功");
        } catch (Exception e) {
            log.error("获取学校统计数据失败", e);
            return Result.fail("统计数据获取失败: " + e.getMessage());
        }
    }


    public Result<StudentStatisticsResponse> getStudentStatistics() {
        try {
            log.info("获取学生统计数据");

            StudentStatisticsResponse response = new StudentStatisticsResponse();

            // 1. 总学生数
            long totalStudents = Optional.ofNullable(studentRepository.count()).orElse(0L);
            response.setTotalStudents(totalStudents);

            // 2. 今年新增学生
            int currentYear = Year.now().getValue();
            Long totalNewStudentsObj = studentRepository.countByCreatedAtYear(currentYear);
            long totalNewStudents = (totalNewStudentsObj != null) ? totalNewStudentsObj : 0L;
            response.setTotalNewStudents(totalNewStudents);

            // 3. 性别统计
            long maleCount = Optional.ofNullable(studentRepository.countByGender("Male")).orElse(0L);
            long femaleCount = Optional.ofNullable(studentRepository.countByGender("Female")).orElse(0L);
            Map<String, Long> studentsByGender = new HashMap<>();
            studentsByGender.put("male", maleCount);
            studentsByGender.put("female", femaleCount);
            response.setStudentsByGender(studentsByGender);

            // 4. 按地区统计（按学校国家）——优化批量查询
            List<Student> allStudents = Optional.ofNullable(studentRepository.findAll())
                    .orElse(Collections.emptyList());

            // 收集所有 schoolId
            Set<String> schoolIds = allStudents.stream()
                    .map(Student::getSchoolId)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toSet());

            // 批量查询学校信息
            Map<String, School> schoolMap = schoolRepository.findAllBySchoolIdIn(new ArrayList<>(schoolIds))
                    .stream()
                    .collect(Collectors.toMap(School::getSchoolId, Function.identity()));

            // 统计每个国家学生数
            Map<String, Long> originCountMap = allStudents.stream()
                    .map(s -> {
                        if (s.getSchoolId() != null) {
                            School school = schoolMap.get(s.getSchoolId());
                            return (school != null && school.getCountry() != null) ? school.getCountry() : "未知";
                        } else {
                            return "未知";
                        }
                    })
                    .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()));

            // 构建 OriginDTO
            List<OriginDTO> studentsByOrigin = originCountMap.entrySet().stream()
                    .map(entry -> {
                        String origin = entry.getKey();
                        long count = entry.getValue();

                        String fill;
                        switch (origin) {
                            case "Europe": fill = "#3b82f6"; break;
                            case "America": fill = "#16a34a"; break;
                            case "Asia": fill = "#2563eb"; break;
                            default: fill = "#f59e0b"; break;
                        }
                        return new OriginDTO(origin, count, fill);
                    })
                    .collect(Collectors.toList());

            response.setStudentsByOrigin(studentsByOrigin);

            // 5. 日活统计（过去一周）
            LocalDate today = LocalDate.now();
            List<DailyActiveDTO> dailyActiveUsersWeek = new ArrayList<>();
            for (int i = 6; i >= 0; i--) {
                LocalDate day = today.minusDays(i);
                Long count = studentActivityRepository.countDistinctStudentByCreatedAtBetween(
                        day.atStartOfDay(), day.plusDays(1).atStartOfDay());
                dailyActiveUsersWeek.add(new DailyActiveDTO(
                        day.getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.CHINA),
                        (count != null) ? count : 0L
                ));
            }
            response.setDailyActiveUsersWeek(dailyActiveUsersWeek);

            // 6. 月活统计（最近6个月）
            List<MonthlyActiveDTO> monthlyActiveUsers6Months = new ArrayList<>();
            for (int i = 5; i >= 0; i--) {
                YearMonth month = YearMonth.now().minusMonths(i);
                LocalDateTime start = month.atDay(1).atStartOfDay();
                LocalDateTime end = month.plusMonths(1).atDay(1).atStartOfDay();
                Long count = studentActivityRepository.countDistinctStudentByCreatedAtBetween(start, end);
                monthlyActiveUsers6Months.add(new MonthlyActiveDTO(
                        month.getMonth().getDisplayName(TextStyle.FULL, Locale.CHINA),
                        (count != null) ? count : 0L
                ));
            }
            response.setMonthlyActiveUsers6Months(monthlyActiveUsers6Months);

            return Result.success(response, "学生统计数据获取成功");

        } catch (Exception e) {
            log.error("获取学生统计数据失败", e);
            return Result.fail("学生统计数据获取失败: " + e.getMessage());
        }
    }

    public Result<Map<String, Object>> getUniversityDistribution() {
        try {
            // 1️⃣ 获取所有学生
            List<Student> allStudents = studentRepository.findAll();
            final long totalStudents = (allStudents != null) ? allStudents.size() : 0L;

            if (allStudents == null || allStudents.isEmpty()) {
                Map<String, Object> emptyResult = new HashMap<>();
                emptyResult.put("universityDistribution", Collections.emptyList());
                emptyResult.put("totalStudents", 0);
                return Result.success(emptyResult, "学生分布数据为空");
            }

            // 2️⃣ 收集所有 schoolId 并批量查询学校信息
            Set<String> schoolIds = allStudents.stream()
                    .map(Student::getSchoolId)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toSet());

            List<School> schools = schoolRepository.findAllBySchoolIdIn(new ArrayList<>(schoolIds));
            final Map<String, School> schoolMap = schools.stream()
                    .collect(Collectors.toMap(School::getSchoolId, Function.identity()));

            // 3️⃣ 按大洲分组
            Map<String, List<Student>> studentsByContinent = allStudents.stream()
                    .filter(s -> s.getSchoolId() != null && schoolMap.containsKey(s.getSchoolId()))
                    .collect(Collectors.groupingBy(new Function<Student, String>() {
                        @Override
                        public String apply(Student s) {
                            School school = schoolMap.get(s.getSchoolId());
                            return (school != null && school.getContinent() != null) ? school.getContinent() : "未知";
                        }
                    }));

            // 4️⃣ 构建前端数据结构
            List<Map<String, Object>> universityDistribution = new ArrayList<>();
            for (Map.Entry<String, List<Student>> entry : studentsByContinent.entrySet()) {
                String continent = entry.getKey();
                List<Student> students = entry.getValue();

                // 学校数量
                Set<String> schoolsInContinent = students.stream()
                        .map(Student::getSchoolId)
                        .collect(Collectors.toSet());

                // 国家数量
                Set<String> countriesInContinent = students.stream()
                        .map(Student::getSchoolId)
                        .map(new Function<String, String>() {
                            @Override
                            public String apply(String schoolId) {
                                School school = schoolMap.get(schoolId);
                                return (school != null && school.getCountry() != null) ? school.getCountry() : "未知";
                            }
                        })
                        .collect(Collectors.toSet());

                Map<String, Object> continentData = new HashMap<>();
                continentData.put("continent", continent);
                continentData.put("countries", countriesInContinent.size());
                continentData.put("schools", schoolsInContinent.size());
                continentData.put("students", students.size());

                universityDistribution.add(continentData);
            }

            // 5️⃣ 返回结果
            Map<String, Object> result = new HashMap<>();
            result.put("universityDistribution", universityDistribution);
            result.put("totalStudents", totalStudents);

            return Result.success(result, "学生分布数据获取成功");

        } catch (Exception e) {
            log.error("获取学生分布数据失败", e);
            return Result.fail("学生分布数据获取失败: " + e.getMessage());
        }
    }


    public Result<Map<String, Object>> getMonthlyNewStudents(
            @RequestParam(value = "year", required = false) Integer yearParam) {

        try {
            // 1️⃣ 确定年份，默认当前年
            int year = (yearParam != null) ? yearParam : Year.now().getValue();

            // 2️⃣ 初始化每月数据，保证每个月都有值
            List<Map<String, Object>> studentsMonthlyData = new ArrayList<>();
            String[] monthNames = {"一月","二月","三月","四月","五月","六月",
                    "七月","八月","九月","十月","十一月","十二月"};
            for (int i = 0; i < 12; i++) {
                Map<String, Object> monthData = new HashMap<>();
                monthData.put("name", monthNames[i]);
                monthData.put("value", 0L);
                studentsMonthlyData.add(monthData);
            }

            // 3️⃣ 查询每月新增学生数
            List<Student> allStudents = studentRepository.findAll();
            if (allStudents != null) {
                Map<Integer, Long> monthCountMap = allStudents.stream()
                        .filter(s -> s.getCreateTime() != null)
                        .filter(s -> s.getCreateTime().getYear() == year)
                        .collect(Collectors.groupingBy(
                                s -> s.getCreateTime().getMonthValue(), // 1~12
                                Collectors.counting()
                        ));

                // 填充数据到 studentsMonthlyData
                for (int i = 1; i <= 12; i++) {
                    long count = monthCountMap.getOrDefault(i, 0L);
                    studentsMonthlyData.get(i - 1).put("value", count);
                }
            }

            // 4️⃣ 计算全年新增总数
            long totalNewStudents = studentsMonthlyData.stream()
                    .mapToLong(m -> (Long) m.get("value"))
                    .sum();

            // 5️⃣ 计算每月平均新增（可选）
            double monthlyAverage = totalNewStudents / 12.0;

            // 6️⃣ 封装结果
            Map<String, Object> result = new HashMap<>();
            result.put("studentsMonthlyData", studentsMonthlyData);
            result.put("totalNewStudents", totalNewStudents);
            result.put("monthlyAverage", monthlyAverage);
            result.put("year", year);

            return Result.success(result, "每月新增学生数据获取成功");

        } catch (Exception e) {
            log.error("获取每月新增学生数据失败", e);
            return Result.fail("获取每月新增学生数据失败: " + e.getMessage());
        }
    }

public Map<String, Object> getSchoolMonthlyActiveUsers(String searchUniversityName, int page, int size) {
    LocalDateTime now = LocalDateTime.now();
    LocalDateTime startTime = now.minusMonths(6).withDayOfMonth(1);
    LocalDateTime endTime = now;

    log.info("统计近六个月活跃用户，时间范围: {} 到 {}", startTime, endTime);

    // 生成近6个月月份列表
    List<String> monthList = new ArrayList<>();
    LocalDate temp = startTime.toLocalDate();
    while (!temp.isAfter(endTime.toLocalDate())) {
        monthList.add(temp.format(DateTimeFormatter.ofPattern("yyyy-MM")));
        temp = temp.plusMonths(1);
    }

    try {
        // 1️⃣ 获取学校列表（可搜索大学名）
        List<Document> allSchools = mongoTemplate.findAll(Document.class, "school");

        // 加强NPE防护：检查allSchools是否为null
        if (allSchools == null) {
            allSchools = new ArrayList<>();
        }

        if (searchUniversityName != null && !searchUniversityName.isEmpty()) {
            String keyword = searchUniversityName.toLowerCase();
            allSchools = allSchools.stream()
                    .filter(s -> {
                        // 加强NPE防护：检查Document和字段值
                        if (s == null) return false;
                        Object universityNameObj = s.get("universityName");
                        if (universityNameObj == null) return false;
                        return universityNameObj.toString().toLowerCase().contains(keyword);
                    })
                    .collect(Collectors.toList());
        }

        int totalRecords = allSchools.size(); // 总记录数

        if (totalRecords == 0) {
            Map<String, Object> emptyResponse = new HashMap<>();
            emptyResponse.put("success", true);
            emptyResponse.put("message", "没有符合条件的学校");
            Map<String, Object> dataMap = new HashMap<>();
            dataMap.put("schoolActiveUsersData", Collections.emptyList());
            dataMap.put("totalRecords", 0);
            dataMap.put("page", page);
            dataMap.put("size", size);

            emptyResponse.put("data", dataMap);
            emptyResponse.put("total", 0);
            return emptyResponse;
        }

        // 2️⃣ 分页截取学校
        int fromIndex = Math.min((page - 1) * size, totalRecords);
        int toIndex = Math.min(fromIndex + size, totalRecords);

        // 加强NPE防护：检查索引有效性
        if (fromIndex >= totalRecords || fromIndex < 0) {
            fromIndex = 0;
        }
        if (toIndex > totalRecords || toIndex <= 0) {
            toIndex = totalRecords;
        }

        List<Document> pagedSchools = allSchools.subList(fromIndex, toIndex);

        List<String> schoolNames = pagedSchools.stream()
                .filter(Objects::nonNull) // 加强NPE防护
                .map(s -> {
                    Object universityNameObj = s.get("universityName");
                    return universityNameObj != null ? universityNameObj.toString() : null;
                })
                .filter(Objects::nonNull) // 过滤掉null值
                .collect(Collectors.toList());

        // 3️⃣ 聚合查询学生活动，按学校和月份分组
        Aggregation aggregation = Aggregation.newAggregation(
                Aggregation.match(Criteria.where("createdAt").gte(startTime).lte(endTime)),
                Aggregation.lookup("student", "studentId", "studentId", "studentInfo"),
                Aggregation.unwind("studentInfo", true),
                Aggregation.lookup("school", "studentInfo.schoolid", "schoolId", "schoolInfo"),
                Aggregation.unwind("schoolInfo", true),
                Aggregation.match(Criteria.where("schoolInfo.universityName").in(schoolNames)),
                Aggregation.project()
                        .andExpression("schoolInfo.universityName").as("school")
                        .andExpression("dateToString('%Y-%m', createdAt)").as("month")
                        .andExclude("_id"),
                Aggregation.group("school", "month").count().as("activeCount")
        );

        AggregationResults<Document> results = mongoTemplate.aggregate(aggregation, "student_activity", Document.class);

        // 加强NPE防护：检查聚合结果
        List<Document> docs = results != null ? results.getMappedResults() : Collections.emptyList();
        if (docs == null) {
            docs = Collections.emptyList();
        }

        // 4️⃣ 构造学校-月份 Map
        Map<String, Map<String, Integer>> schoolMonthMap = new LinkedHashMap<>();
        for (String schoolName : schoolNames) {
            if (schoolName != null) { // 加强NPE防护
                Map<String, Integer> monthCount = new LinkedHashMap<>();
                for (String month : monthList) {
                    monthCount.put(month, 0);
                }
                schoolMonthMap.put(schoolName, monthCount);
            }
        }

        for (Document doc : docs) {
            // 加强NPE防护：检查Document是否为null
            if (doc == null) continue;

            Document idDoc = (Document) doc.get("_id");
            // 加强NPE防护：检查idDoc是否为null
            if (idDoc == null) continue;

            String school = idDoc.getString("school");
            String month = idDoc.getString("month");
            Integer count = doc.getInteger("activeCount", 0);

            // 加强NPE防护：检查关键字段是否为null
            if (school != null && schoolMonthMap.containsKey(school) && month != null) {
                Map<String, Integer> monthMap = schoolMonthMap.get(school);
                if (monthMap != null) {
                    monthMap.put(month, count != null ? count : 0);
                }
            }
        }

        // 5️⃣ 构造返回结果
        List<Map<String, Object>> schoolActiveUsersData = new ArrayList<>();
        for (Map.Entry<String, Map<String, Integer>> entry : schoolMonthMap.entrySet()) {
            // 加强NPE防护：检查entry及其键值
            if (entry == null || entry.getKey() == null || entry.getValue() == null) continue;

            Map<String, Object> schoolData = new HashMap<>();
            schoolData.put("school", entry.getKey());

            // 加强NPE防护：安全计算总活跃数
            int totalActive = entry.getValue().values().stream()
                    .filter(Objects::nonNull)
                    .mapToInt(Integer::intValue)
                    .sum();
            schoolData.put("totalActive", totalActive);

            List<Map<String, Object>> monthlyData = new ArrayList<>();
            for (Map.Entry<String, Integer> monthEntry : entry.getValue().entrySet()) {
                // 加强NPE防护：检查monthEntry
                if (monthEntry == null || monthEntry.getKey() == null) continue;

                Map<String, Object> monthMap = new HashMap<>();
                monthMap.put("month", monthEntry.getKey());
                monthMap.put("activeCount", monthEntry.getValue() != null ? monthEntry.getValue() : 0);
                monthlyData.add(monthMap);
            }
            schoolData.put("monthlyData", monthlyData);
            schoolActiveUsersData.add(schoolData);
        }

        // 按总活跃数降序排序（加强NPE防护）
        schoolActiveUsersData.sort((a, b) -> {
            if (a == null || b == null) return 0;
            Object totalA = a.get("totalActive");
            Object totalB = b.get("totalActive");
            if (totalA == null || totalB == null) return 0;
            try {
                return ((Integer) totalB).compareTo((Integer) totalA);
            } catch (ClassCastException e) {
                return 0;
            }
        });

        Map<String, Object> data = new HashMap<>();
        data.put("schoolActiveUsersData", schoolActiveUsersData);
        data.put("totalRecords", totalRecords);
        data.put("page", page);
        data.put("size", size);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "学校近六个月活跃用户数据获取成功（分页）");
        response.put("data", data);
        response.put("total", totalRecords);

        return response;

    } catch (Exception e) {
        log.error("聚合查询异常", e);
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("message", "查询失败: " + e.getMessage());
        response.put("data", new HashMap<>());
        response.put("total", 0);
        return response;
    }
}


    public Map<String, Object> getJobOverview() {
        Map<String, Object> response = new HashMap<>();
        try {


            // 2️⃣ 全职 / 实习职位数量
            long totalFullTimePositions = mongoTemplate.count(new Query(Criteria.where("jobType").is("full-time-campus")), "job");
            long totalInternshipPositions = mongoTemplate.count(new Query(Criteria.where("jobType").is("intern")), "job");
            // 1️⃣ 职位总数
            long totalPositions = totalFullTimePositions + totalInternshipPositions;
            // 3️⃣ 职位类型分布
            List<Map<String, Object>> positionTypeData = new ArrayList<>();
            Map<String, Object> fullTimeMap = new HashMap<>();
            fullTimeMap.put("type", "full-time-campus");
            fullTimeMap.put("count", totalFullTimePositions);
            positionTypeData.add(fullTimeMap);

            Map<String, Object> internshipMap = new HashMap<>();
            internshipMap.put("type", "intern");
            internshipMap.put("count", totalInternshipPositions);
            positionTypeData.add(internshipMap);

            // 4️⃣ 公司类型分布（先按职位类型筛选，再查公司 industry）
            List<Document> fullTimeJobs = mongoTemplate.find(new Query(Criteria.where("jobType").is("full-time-campus")), Document.class, "job");
            List<Document> internshipJobs = mongoTemplate.find(new Query(Criteria.where("jobType").is("intern")), Document.class, "job");

            Map<String, Integer> companyTypeCount = new HashMap<>();
            // helper 方法：统计职位对应公司类型
            for (Document job : fullTimeJobs) {
                String companyId = job.getString("companyId");
                Document company = mongoTemplate.findOne(new Query(Criteria.where("companyId").is(companyId)), Document.class, "company");
                if (company != null) {
                    String industry = company.getString("industry");
                    if (industry != null) {
                        companyTypeCount.put(industry, companyTypeCount.getOrDefault(industry, 0) + 1);
                    }
                }
            }
            for (Document job : internshipJobs) {
                String companyId = job.getString("companyId");
                Document company = mongoTemplate.findOne(new Query(Criteria.where("companyId").is(companyId)), Document.class, "company");
                if (company != null) {
                    String industry = company.getString("industry");
                    if (industry != null) {
                        companyTypeCount.put(industry, companyTypeCount.getOrDefault(industry, 0) + 1);
                    }
                }
            }

            List<Map<String, Object>> companyTypePositions = new ArrayList<>();
            for (Map.Entry<String, Integer> entry : companyTypeCount.entrySet()) {
                Map<String, Object> map = new HashMap<>();
                map.put("companyType", entry.getKey());
                map.put("count", entry.getValue());
                companyTypePositions.add(map);
            }
            // 5️⃣ 位置分布
            // 位置分布（先按职位类型筛选，再统计）
            List<Document> allJobs = new ArrayList<>();
            allJobs.addAll(fullTimeJobs);
            allJobs.addAll(internshipJobs);
            Map<String, Integer> locationCount = new HashMap<>();
            for (Document job : allJobs) {
                String locations = job.getString("workLocation");
                if (locations != null && !locations.trim().isEmpty()) {
                    // 按逗号、斜杠或分号拆分
                    String[] parts = locations.split("[,/;]");
                    for (String loc : parts) {
                        String trimmed = loc.trim();
                        if (!trimmed.isEmpty()) {
                            locationCount.put(trimmed, locationCount.getOrDefault(trimmed, 0) + 1);
                        }
                    }
                }
            }
            // 转换为返回的 List<Map> 形式
            List<Map<String, Object>> locationData = locationCount.entrySet().stream()
                    .map(e -> {
                        Map<String, Object> map = new HashMap<>();
                        map.put("workLocation", e.getKey());
                        map.put("count", e.getValue());
                        return map;
                    })
                    // 按 count 倒序排序
                    .sorted((a, b) -> ((Integer)b.get("count")).compareTo((Integer)a.get("count")))
                    .collect(Collectors.toList());


            // 构造返回数据
            Map<String, Object> data = new HashMap<>();
            data.put("totalPositions", totalPositions);
            data.put("totalFullTimePositions", totalFullTimePositions);
            data.put("totalInternshipPositions", totalInternshipPositions);
            data.put("positionTypeData", positionTypeData);
            data.put("companyTypePositions", companyTypePositions);
            data.put("locationData", locationData);

            response.put("success", true);
            response.put("message", "职位概览数据获取成功");
            response.put("data", data);
            response.put("total", totalPositions);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "查询失败: " + e.getMessage());
            response.put("data", new HashMap<>());
            response.put("total", 0);
            e.printStackTrace();
        }

        return response;
    }



}
