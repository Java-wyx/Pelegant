package com.x.pelegant.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.x.pelegant.common.Result;
import com.x.pelegant.dto.DashboardDataDto;
import com.x.pelegant.dto.TaskInfo;
import com.x.pelegant.entity.*;
import com.x.pelegant.repository.*;
import com.x.pelegant.service.CrawlerDataService;
import com.x.pelegant.service.NewDataMigrationService;
import com.x.pelegant.service.ProjectService;
import com.x.pelegant.service.StudentService;
import com.x.pelegant.util.Deduplicate;
import com.x.pelegant.util.EmploymentClassifier;
import com.x.pelegant.util.MongoExporter;
import com.x.pelegant.util.Remedialfunction;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/python")
@Tag(name = "Remedy API", description = "API for Remedy")
public class RemedyController {

    private static final Logger logger = LoggerFactory.getLogger(RemedyController.class);

    @Autowired
    private MongoExporter mongoExporter;

    @Autowired
    private MongoTemplate mongoTemplate;
    @Autowired
    private ProjectService projectService;
    @Autowired
    private TeacherRepository teacherRepository;

    @Autowired
    private SchoolRepository schoolRepository;

    @Autowired
    private TRoleRepository TRoleRepository;
    @Autowired
    private PRoleRepository roleRepository;
    @Autowired
    private Remedialfunction remedialfunction;

    @Autowired
    private CompanyRepository companyRepository;
    @Autowired
    private EmploymentClassifier employmentClassifier;
    @Autowired
    private RedisTemplate<String, String> redisTemplate;
    @Autowired
    private StudentRepository studentRepository;

    @Value("${pelegant.upload.path}")
    private String documentLocation;

    @Value("${pelegant.employment.keywords.config}")
    private String keywordsConfigPath;

    private static final String HONG_KONG_REGEX = "^(HK|香港|Hong\\s?Kong|HongKong|HKSAR|Hong\\s?Kong\\s?SAR|HK\\s?SAR|香港特别行政区|香港岛|Hong\\s?Kong,\\s?Hong\\s?Kong\\s?SAR|[A-Za-z\\s&]+,\\s?(HKI|KOW|NT),\\s?HK|[A-Za-z\\s&]+,\\s?Hong\\s?Kong\\s?SAR|Remote,\\s?HK)$";

    @Autowired
    public RemedyController(
            MongoExporter mongoExporter,
            JobRepository jobRepository,
            MongoTemplate mongoTemplate,
            ProjectService projectService,
            TeacherRepository teacherRepository,
            StudentService studentService,
            SchoolRepository schoolRepository,
            ObjectMapper objectMapper,
            Deduplicate deduplicate,
            TRoleRepository TRoleRepository,
            PRoleRepository roleRepository,
            Remedialfunction remedialfunction,
            CrawlerDataService crawlerDataService,
            CompanyRepository companyRepository,
            NewDataMigrationService newDataMigrationService,
            EmploymentClassifier employmentClassifier,
            RedisTemplate<String, String> redisTemplate,
            StudentRepository studentRepository) {
        this.mongoExporter = mongoExporter;
        this.mongoTemplate = mongoTemplate;
        this.projectService = projectService;
        this.teacherRepository = teacherRepository;
        this.schoolRepository = schoolRepository;
        this.TRoleRepository = TRoleRepository;
        this.roleRepository = roleRepository;
        this.remedialfunction = remedialfunction;
        this.companyRepository = companyRepository;
        this.employmentClassifier = employmentClassifier;
        this.redisTemplate = redisTemplate;
        this.studentRepository = studentRepository;
    }

    @GetMapping("/data")
    @Operation(summary = "导出数据库数据", description = "导出数据")
    public ResponseEntity<Resource> downloadJs(@Parameter(description = "管理员口令") String Key) throws IOException {
        if (!Key.equals("pelegant")) {
            return ResponseEntity.status(403).body(null);
        }

        // 调用 MongoExporter 导出数据
        File jsFile = mongoExporter.exportMongoDBStructureAndData("mongodb://localhost:27017", "Pelegant", "/home/ubuntu/project/JobSpy/output.js");

        // 创建 InputStreamResource 用于读取文件内容
        InputStreamResource resource = new InputStreamResource(new FileInputStream(jsFile));

        // 返回文件的响应体
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + jsFile.getName())
                .contentType(MediaType.parseMediaType("application/javascript"))
                .body(resource);
    }

    @GetMapping("/Update-enterprise-status")
    @Operation(summary = "更新企业状态")
    public String updateEnterpriseStatus() {
        logger.info("开始更新企业状态");

        // 查询所有公司
        Query allCompanyQuery = new Query();
        List<Company> allCompanies = mongoTemplate.find(allCompanyQuery, Company.class);
        logger.info("共找到 {} 个公司", allCompanies.size());

        // 获取所有符合条件职位的公司ID
        Set<String> activeCompanyIds = new HashSet<>();

        // 查询符合条件的职位（全职校园岗位和实习岗位）
        Query jobQuery = new Query();
        jobQuery.addCriteria(Criteria.where("jobType").in("full-time-campus", "intern"));
        jobQuery.addCriteria(Criteria.where("workLocation").regex(HONG_KONG_REGEX, "i"));

        // 查询符合条件的职位
        List<Job> jobs = mongoTemplate.find(jobQuery, Job.class);

        // 获取符合条件职位的总数
        long total = mongoTemplate.count(jobQuery, Job.class);
        logger.info("符合条件的职位总数: {}", total);

        // 获取所有符合条件职位的公司ID
        activeCompanyIds = jobs.stream()
                .map(Job::getCompanyId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        logger.info("共找到 {} 个符合条件的公司ID", activeCompanyIds.size());

        // 遍历所有公司，将其状态更新为 'pending' 或 'active'
        for (Company company : allCompanies) {
            String companyId = company.getCompanyId();
            String status = activeCompanyIds.contains(companyId) ? "active" : "pending";
            Query updateQuery = new Query(Criteria.where("companyId").is(companyId));
            Update update = new Update().set("status", status);
            mongoTemplate.updateFirst(updateQuery, update, Company.class);
            logger.info("公司ID: {} 状态更新为: {}", companyId, status);
        }
        return "企业状态更新完成";
    }

    @GetMapping("/getalldata")
    @Operation(summary = "获取所有数据", description = "获取所有数据")
    public Result<DashboardDataDto> getAllData() {
        logger.info("获取所有数据请求");
        return projectService.getAllData();
    }

    @GetMapping("/update-profile-nullpicture")
    @Operation(summary = "移除用户头像")
    public String updateProfilenullPicture() {
        logger.info("更新用户头像请求");
        List<Teacher> teachers = teacherRepository.findAll();
        for (Teacher t : teachers) {
            t.setAvatarPath("/Uploads/avatars/defaultavatarnull.png");
        }
        teacherRepository.saveAll(teachers);
        List<Student> students = studentRepository.findAll();
        for (Student s : students) {
            s.setAvatarPath("");
        }
        studentRepository.saveAll(students);
        return "用户头像恢复空白成功，共更新 " + teachers.size() + " 条教师记录;" + students.size() + " 条学生记录";
    }

    @GetMapping("/update-company-nullpicture")
    @Operation(summary = "移除企业头像")
    public String updatecompanynullPicture() {
        logger.info("更新企业头像请求");
        List<Company> companys = companyRepository.findAll();
        for (Company t : companys) {
            t.setLogoImage("");
        }
        companyRepository.saveAll(companys);
        return "企业头像恢复空白成功，共更新 " + companys.size() + " 条记录";
    }

    @GetMapping("/update-role-time")
    @Operation(summary = "更新角色时间")
    public String updateRoleTime() {
        List<PRole> roles = roleRepository.findAll();
        for (PRole role : roles) {
            role.setCreatedAt(LocalDateTime.now());
            role.setUpdatedAt(LocalDateTime.now());
        }
        roleRepository.saveAll(roles);

        List<TRole> tRoles = TRoleRepository.findAll();
        for (TRole tRole : tRoles) {
            tRole.setCreatedAt(LocalDateTime.now());
            tRole.setUpdatedAt(LocalDateTime.now());
        }
        TRoleRepository.saveAll(tRoles);
        return "项目管理员角色时间更新成功，共更新 " + roles.size() + " 条记录;教师角色时间更新成功，共更新 " + tRoles.size() + " 条记录";
    }

    @GetMapping("/Obtain-the-country-of-the-school")
    @Operation(summary = "获取学校所在国家", description = "获取学校所在国家")
    public List<String> obtainCountryOfSchool() {
        List<School> schools = schoolRepository.findAll();
        return schools.stream()
                .map(School::getCountry)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());
    }

    @PostMapping("/Update-JSON")
    @Operation(summary = "更新JSON数据", description = "更新就业分类器的关键词配置文件")
    public ResponseEntity<String> updateKeywordsConfig(@RequestParam("file") MultipartFile file) {
        try {
            if (!isValidJsonFile(file)) {
                return ResponseEntity.badRequest().body("无效的文件类型，请上传JSON文件");
            }
            Path configDir = Paths.get(documentLocation, "config");
            if (!Files.exists(configDir)) {
                Files.createDirectories(configDir);
            }
            Path targetPath = Paths.get(documentLocation, keywordsConfigPath);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
            employmentClassifier.refreshKeywordsAsync();
            return ResponseEntity.ok("关键词配置文件已成功更新并重新加载");
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("文件上传失败: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("处理文件时发生错误: " + e.getMessage());
        }
    }

    private boolean isValidJsonFile(MultipartFile file) {
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null) {
            return false;
        }
        String extension = originalFilename.substring(originalFilename.lastIndexOf(".") + 1).toLowerCase();
        return "json".equals(extension);
    }

    @PostMapping("/remove-collection")
    @Operation(summary = "清空所有学生的收藏", description = "清空系统中所有学生的收藏")
    public Result<String> removeAllStudentCollections() {
        try {
            List<Student> students = studentRepository.findAll();
            if (students.isEmpty()) {
                return Result.success("系统中没有学生数据");
            }
            for (Student student : students) {
                if (student.getBookmarkedJobs() != null && !student.getBookmarkedJobs().isEmpty()) {
                    student.getBookmarkedJobs().clear();
                    studentRepository.save(student);
                }
            }
            return Result.success("所有学生的收藏已清空");
        } catch (Exception e) {
            logger.error("清空所有学生收藏失败", e);
            return Result.fail("清空失败: " + e.getMessage());
        }
    }

    @PostMapping("/remedial-function-recommendation")
    @Operation(summary = "补全推荐工作", description = "补全推荐工作")
    public Result<String> remedialFunctionRecommendation() {
        return Result.success(remedialfunction.fixRecommendedWorkJobIdsByTitleAndCompany());
    }

}