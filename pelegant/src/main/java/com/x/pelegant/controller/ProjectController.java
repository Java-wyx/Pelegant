package com.x.pelegant.controller;

import com.x.pelegant.common.Result;
import com.x.pelegant.dto.*;
import com.x.pelegant.dto.StudentStatisticsResponse;
import com.x.pelegant.entity.Company;
import com.x.pelegant.entity.Job;
import com.x.pelegant.entity.PRole;
import com.x.pelegant.entity.Project;
import com.x.pelegant.entity.School;
import com.x.pelegant.entity.Student;

import com.x.pelegant.repository.SchoolRepository;
import com.x.pelegant.repository.StudentActivityRepository;
import com.x.pelegant.repository.StudentRepository;
import com.x.pelegant.service.*;
import com.x.pelegant.util.Deduplicate;
import com.x.pelegant.util.JwtUtil;
import com.x.pelegant.util.export;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ClassPathResource;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Year;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * 项目管理员控制器
 */
@RestController
@RequestMapping("/api/projects")
@Tag(name = "项目管理", description = "项目管理员相关接口")
@Slf4j
@Validated
public class ProjectController {

    @Autowired
    private ProjectService projectService;

    @Autowired
    private Deduplicate deduplicate;

    @Autowired
    private MongoTemplate mongoTemplate;

    @Autowired
    private StudentRepository studentRepository;
    @Autowired
    private StudentActivityRepository studentActivityRepository;

    @Autowired
    private JobService jobService;

    @Autowired
    private SchoolRepository schoolRepository;
    
    @Autowired
    private JobAndCompanyService jobAndCompanyService;
    @Autowired
    private ExcelImportService excelImportService ;
    @Autowired
    private export export;



    /**
     * 项目管理员登录接口
     */
    @PostMapping("/login-json")
    @Operation(summary = "项目管理员登录(JSON)", description = "项目管理员使用JSON格式进行登录")
    public ResponseEntity<Result<LoginResponse>> loginJson(@Valid @RequestBody LoginRequest loginRequest) {
        log.info("项目管理员JSON登录请求: {}", loginRequest.getEmail());
        Result<LoginResponse> result = projectService.login(loginRequest.getEmail(), loginRequest.getPassword());
        return ResponseEntity.ok(result);
    }

    /**
     * 添加企业接口
     */
    @PostMapping("/companies")
    @Operation(summary = "添加企业", description = "项目管理员添加新的企业信息到系统")
    @SecurityRequirement(name = "ProjectAuth")
    public ResponseEntity<Result<Company>> addCompany(@Valid @RequestBody CompanyCreateRequest request) {
        log.info("项目管理员添加企业请求: {}", request.getCompanyName());
        Result<Company> result = projectService.addCompany(request);
        return ResponseEntity.ok(result);
    }

    /**
     * 添加职位接口
     */
    @PostMapping("/jobs")
    @Operation(summary = "添加职位", description = "项目管理员添加新的职位信息到系统")
    @SecurityRequirement(name = "ProjectAuth")
    public ResponseEntity<Result<Job>> addJob(@Valid @RequestBody JobCreateRequest request) {
        log.info("项目管理员添加职位请求: {}", request.getJobTitle());
        Result<Job> result = projectService.addJob(request);
        return ResponseEntity.ok(result);
    }

    /**
     * 添加学校接口
     */
    @PostMapping("/schools")
    @Operation(summary = "添加学校", description = "项目管理员添加新的学校信息到系统")
    @SecurityRequirement(name = "ProjectAuth")
    public ResponseEntity<Result<School>> addSchool(@Valid @RequestBody SchoolCreateRequest request) {
        log.info("项目管理员添加学校请求: {}", request.getUniversityName());
        Result<School> result = projectService.addSchool(request);
        return ResponseEntity.ok(result);
    }

    /**
     * 查看所有企业接口
     */
    @GetMapping("/companies")
    @Operation(summary = "查看所有企业", description = "项目管理员查看系统中所有企业信息，支持分页和筛选")
    @SecurityRequirement(name = "ProjectAuth")
    public ResponseEntity<Result<Map<String, Object>>> getAllCompanies(
            @Parameter(description = "页码，从0开始") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "每页大小") @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "搜索关键词（企业名称、行业、地址）") @RequestParam(required = false) String search,
            @Parameter(description = "行业筛选") @RequestParam(required = false) String industry,
            @Parameter(description = "企业类型筛选") @RequestParam(required = false) String companyType,
            @Parameter(description = "状态筛选") @RequestParam(required = false) String status) {
        log.info("项目管理员查看所有企业请求: page={}, size={}, search={}", page, size, search);
        Result<Map<String, Object>> result = projectService.getAllCompaniesForProject(page,
                size, search, industry, companyType, status);
        return ResponseEntity.ok(result);
    }

    /**
     * 根据ID获取企业详情接口
     */
    @GetMapping("/companies/{id}")
    @Operation(summary = "获取企业详情", description = "项目管理员根据ID获取企业详细信息")
    @SecurityRequirement(name = "ProjectAuth")
    public ResponseEntity<Result<Company>> getCompanyById(@PathVariable String id) {
        log.info("项目管理员获取企业详情请求: {}", id);
        Result<Company> result = projectService.getCompanyByIdForProject(id);
        return ResponseEntity.ok(result);
    }
    /**
     * 修改企业信息接口
     */
    @PutMapping("/companies/{id}")
    @Operation(summary = "修改企业信息", description = "项目管理员修改企业信息")
    @SecurityRequirement(name = "ProjectAuth")
    public ResponseEntity<Result<Company>> updateCompany(@PathVariable String id,
            @Valid @RequestBody CompanyCreateRequest request) {
        log.info("项目管理员修改企业信息请求: {}", id);
        Result<Company> result = projectService.updateCompany(id, request);
        return ResponseEntity.ok(result);
    }

    /**
     * 获取企业统计信息
     */
    @GetMapping("/companies/stats")
    @Operation(summary = "获取企业统计信息", description = "项目管理员查询企业统计信息，包括按行业、类型、状态等维度的统计")
    @SecurityRequirement(name = "ProjectAuth")
    public ResponseEntity<Result<java.util.Map<String, Object>>> getCompanyStats() {
        log.info("项目管理员查询企业统计信息请求");
        Result<java.util.Map<String, Object>> result = projectService.getCompanyStatsForProject();
        return ResponseEntity.ok(result);
    }

    /**
     * 根据企业名称查询企业信息
     */
    @GetMapping("/companies/search")
    @Operation(summary = "根据企业名称查询企业信息", description = "项目管理员根据企业名称查询企业信息")
    @SecurityRequirement(name = "ProjectAuth")
    public ResponseEntity<Result<java.util.List<Company>>> getCompaniesByName(
            @RequestParam("name") String name) {
        log.info("项目管理员根据企业名称查询企业信息请求: {}", name);
        Result<java.util.List<Company>> result = projectService.getCompaniesByNameForProject(name);
        return ResponseEntity.ok(result);
    }

    /**
     * 查看所有职位接口（支持分页和筛选）
     */
    @GetMapping("/jobs")
    @Operation(summary = "查看所有职位", description = "项目管理员查看系统中所有职位信息，支持分页和筛选")
    @SecurityRequirement(name = "ProjectAuth")
    public Result<Map<String, Object>> getAllJobs(
            @Parameter(description = "页码，从0开始") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "每页大小") @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "搜索关键词（职位名称、企业名称、地点）") @RequestParam(required = false) String search,
            @Parameter(description = "职位类型筛选") @RequestParam(required = false) String jobType,
            @Parameter(description = "企业ID筛选") @RequestParam(required = false) String companyId,
            @Parameter(description = "状态筛选") @RequestParam(required = false) String status) {
        log.info("项目管理员查看所有职位请求: page={}, size={}, search={}", page, size, search);
        Result<Map<String, Object>> result = projectService.getAllJobsForProject(page, size,
                search, jobType, companyId, status);
        return result;
    }

    /**
     * 根据ID获取职位详情接口
     */
    @GetMapping("/jobs/{id}")
    @Operation(summary = "获取职位详情", description = "项目管理员根据ID获取职位详细信息")
    @SecurityRequirement(name = "ProjectAuth")
    public ResponseEntity<Result<java.util.Map<String, Object>>> getJobById(@PathVariable String id) {
        log.info("项目管理员获取职位详情请求: {}", id);
        Result<java.util.Map<String, Object>> result = projectService.getJobByIdForProject(id);
        return ResponseEntity.ok(result);
    }

    /**
     * 更新职位信息接口
     */
    @PutMapping("/jobs/{id}")
    @Operation(summary = "更新职位信息", description = "项目管理员根据ID更新职位信息")
    @SecurityRequirement(name = "ProjectAuth")
    public ResponseEntity<Result<String>> updateJob(@PathVariable String id,
                                                    @Valid @RequestBody JobCreateRequest jobRequest, BindingResult bindingResult) {
        if (bindingResult.hasErrors()) {
            return ResponseEntity.badRequest().body(Result.fail("参数验证失败"));
        }

        log.info("项目管理员更新职位请求: {}", id);
        Result<String> result = projectService.updateJobForProject(id, jobRequest);
        return ResponseEntity.ok(result);
    }

    /**
     * 获取职位统计信息接口
     */
    @GetMapping("/jobs/stats")
    @Operation(summary = "获取职位统计信息", description = "项目管理员获取职位统计数据")
    @SecurityRequirement(name = "ProjectAuth")
    public ResponseEntity<Result<java.util.Map<String, Object>>> getJobStats() {
        log.info("项目管理员获取职位统计信息请求");
        Result<java.util.Map<String, Object>> result = projectService.getJobStatsForProject();
        return ResponseEntity.ok(result);
    }

    /**
     * 查看所有学校接口（包含管理员邮箱）
     */
    @GetMapping("/schools")
    @Operation(summary = "查看所有学校", description = "项目管理员查看系统中所有学校信息（包含管理员邮箱）")
    @SecurityRequirement(name = "ProjectAuth")
    public ResponseEntity<Result<java.util.List<SchoolWithAdminResponse>>> getAllSchools() {
        log.info("项目管理员查看所有学校请求");
        Result<java.util.List<SchoolWithAdminResponse>> result = projectService.getAllSchools();
        return ResponseEntity.ok(result);
    }

    /**
     * 根据ID获取学校详情接口
     */
    @GetMapping("/schools/{id}")
    @Operation(summary = "获取学校详情", description = "项目管理员根据ID获取学校详细信息")
    @SecurityRequirement(name = "ProjectAuth")
    public ResponseEntity<Result<SchoolWithAdminResponse>> getSchoolById(@PathVariable String id) {
        log.info("项目管理员获取学校详情请求: {}", id);
        Result<SchoolWithAdminResponse> result = projectService.getSchoolById(id);
        return ResponseEntity.ok(result);
    }

    /**
     * 下载学校导入Excel模板
     */
    @GetMapping("/schools/template")
    @Operation(summary = "下载学校导入Excel模板", description = "项目管理员下载学校批量导入的Excel模板文件")
    @SecurityRequirement(name = "ProjectAuth")
    public ResponseEntity<Resource> downloadSchoolTemplate() {
        log.info("项目管理员下载学校导入模板请求");
        try {
            // 获取模板文件资源
            Resource resource = new ClassPathResource("static/学校导入.xlsx");

            if (resource.exists() && resource.isReadable()) {
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"学校导入模板.xlsx\"")
                        .header(HttpHeaders.CONTENT_TYPE,
                                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                        .body(resource);
            } else {
                log.error("学校导入模板文件不存在或不可读: static/学校导入.xlsx");
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            log.error("下载学校导入模板失败", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 批量导入学校Excel接口
     */
    @PostMapping("/schools/import-excel")
    @Operation(summary = "批量导入学校Excel", description = "项目管理员通过上传Excel文件批量导入学校信息")
    @SecurityRequirement(name = "ProjectAuth")
    public ResponseEntity<Result<SchoolBatchImportResponse>> importSchoolsExcel(
            @Parameter(description = "Excel文件（.xlsx或.xls格式）", required = true) @RequestParam("file") MultipartFile file) {

        log.info("项目管理员批量导入学校Excel请求: 文件名={}", file.getOriginalFilename());

        // 验证文件
        if (file.isEmpty()) {
            return ResponseEntity.ok(Result.fail("请选择要上传的Excel文件"));
        }

        // 验证文件大小（最大5MB）
        if (file.getSize() > 5 * 1024 * 1024) {
            return ResponseEntity.ok(Result.fail("Excel文件大小不能超过5MB"));
        }

        Result<SchoolBatchImportResponse> result = projectService.importSchoolsFromExcel(file);
        return ResponseEntity.ok(result);
    }

    /**
     * 更新学校信息接口
     */
    @PutMapping("/schools/{id}")
    @Operation(summary = "更新学校信息", description = "项目管理员更新学校信息")
    @SecurityRequirement(name = "ProjectAuth")
    public ResponseEntity<Result<School>> updateSchool(@PathVariable String id,
                                                       @Valid @RequestBody SchoolCreateRequest request) {
        log.info("项目管理员更新学校请求: {} - {}", id, request.getUniversityName());
        Result<School> result = projectService.updateSchool(id, request);
        return ResponseEntity.ok(result);
    }

    /**
     * 删除学校接口
     */
    @DeleteMapping("/schools/{id}")
    @Operation(summary = "删除学校", description = "项目管理员删除学校信息")
    @SecurityRequirement(name = "ProjectAuth")
    public ResponseEntity<Result<String>> deleteSchool(@PathVariable String id) {
        log.info("项目管理员删除学校请求: {}", id);
        Result<String> result = projectService.deleteSchool(id);
        return ResponseEntity.ok(result);
    }

    // ==================== 学生信息管理接口 ====================

    /**
     * 查询所有学生信息
     */
    @GetMapping("/students")
    @Operation(summary = "查询所有学生信息", description = "项目管理员查询所有学校的学生信息，支持分页和筛选")
    @SecurityRequirement(name = "ProjectAuth")
    public ResponseEntity<Result<java.util.List<com.x.pelegant.dto.StudentWithSchoolResponse>>> getAllStudents(
            @Parameter(description = "页码，从0开始") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "每页大小") @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "搜索关键词（姓名、学校、专业）") @RequestParam(required = false) String search,
            @Parameter(description = "学校ID筛选") @RequestParam(required = false) String schoolId,
            @Parameter(description = "专业筛选") @RequestParam(required = false) String major,
            @Parameter(description = "状态筛选") @RequestParam(required = false) String status) {
        log.info("项目管理员查询所有学生信息请求: page={}, size={}, search={}", page, size, search);
        Result<java.util.List<com.x.pelegant.dto.StudentWithSchoolResponse>> result = projectService
                .getAllStudentsForProject(page, size, search, schoolId,
                        major, status);
        return ResponseEntity.ok(result);
    }

    /**
     * 根据ID查询学生详细信息
     */
    @GetMapping("/students/{id}")
    @Operation(summary = "查询学生详细信息", description = "项目管理员根据ID查询学生的详细信息")
    @SecurityRequirement(name = "ProjectAuth")
    public ResponseEntity<Result<StudentDTO>> getStudentById(
            @Parameter(description = "学生ID") @PathVariable String id) {
        log.info("项目管理员查询学生详细信息请求: {}", id);
        Result<StudentDTO> result = projectService.getStudentByIdForProject(id);
        return ResponseEntity.ok(result);
    }

    /**
     * 获取学生统计信息
     */
    @GetMapping("/students/stats")
    @Operation(summary = "获取学生统计信息", description = "项目管理员查询学生统计信息，包括按学校、专业、状态等维度的统计")
    @SecurityRequirement(name = "ProjectAuth")
    public ResponseEntity<Result<java.util.Map<String, Object>>> getStudentStats() {
        log.info("项目管理员查询学生统计信息请求");
        Result<java.util.Map<String, Object>> result = projectService.getStudentStatsForProject();
        return ResponseEntity.ok(result);
    }

    /**
     * 根据姓名查询学生信息
     */
    @GetMapping("/students/search")
    @Operation(summary = "根据姓名查询学生信息", description = "项目管理员根据姓名查询所有学校的学生信息")
    @SecurityRequirement(name = "ProjectAuth")
    public ResponseEntity<Result<java.util.List<Student>>> getStudentsByName(
            @RequestParam("name") String name) {
        log.info("项目管理员根据姓名查询学生信息请求: {}", name);
        Result<java.util.List<Student>> result = projectService.getStudentsByNameForProject(name);
        return ResponseEntity.ok(result);
    }

    // ==================== 角色权限管理接口 ====================

    /**
     * 创建项目管理角色
     */
    @PostMapping("/roles")
    @Operation(summary = "创建项目管理角色", description = "项目管理员创建新的角色权限")
    @SecurityRequirement(name = "ProjectAuth")
    public ResponseEntity<Result<PRole>> createPRole(@Valid @RequestBody RoleCreateRequest request) {
        log.info("创建项目管理角色请求: {}", request.getRoleName());
        Result<PRole> result = projectService.createPRole(request);
        return ResponseEntity.ok(result);
    }

    /**
     * 查看所有项目管理角色
     */
    @GetMapping("/roles")
    @Operation(summary = "查看所有项目管理角色", description = "项目管理员查看系统中所有角色权限")
    @SecurityRequirement(name = "ProjectAuth")
    public ResponseEntity<Result<java.util.List<PRole>>> getAllPRoles() {
        log.info("查看所有项目管理角色请求");
        Result<java.util.List<PRole>> result = projectService.getAllPRoles();
        return ResponseEntity.ok(result);
    }

    /**
     * 根据角色名称查询项目管理角色
     */
    @GetMapping("/roles/search")
    @Operation(summary = "根据角色名称查询项目管理角色", description = "项目管理员根据角色名称查询角色权限")
    @SecurityRequirement(name = "ProjectAuth")
    public ResponseEntity<Result<java.util.List<PRole>>> getPRolesByName(
            @RequestParam("roleName") String roleName) {
        log.info("根据角色名称查询项目管理角色请求: {}", roleName);
        Result<java.util.List<PRole>> result = projectService.getPRolesByName(roleName);
        return ResponseEntity.ok(result);
    }

    /**
     * 根据ID获取项目管理角色
     */
    @GetMapping("/roles/{id}")
    @Operation(summary = "根据ID获取项目管理角色", description = "项目管理员根据ID查看特定角色权限")
    @SecurityRequirement(name = "ProjectAuth")
    public ResponseEntity<Result<PRole>> getPRoleById(@PathVariable String id) {
        log.info("根据ID获取项目管理角色请求: {}", id);
        Result<PRole> result = projectService.getPRoleById(id);
        return ResponseEntity.ok(result);
    }

    /**
     * 更新项目管理角色
     */
    @PutMapping("/roles/{id}")
    @Operation(summary = "更新项目管理角色", description = "项目管理员更新角色权限信息")
    @SecurityRequirement(name = "ProjectAuth")
    public ResponseEntity<Result<PRole>> updatePRole(@PathVariable String id,
                                                     @Valid @RequestBody RoleUpdateRequest request) {
        log.info("更新项目管理角色请求: {} - {}", id, request.getRoleName());
        Result<PRole> result = projectService.updatePRole(id, request);
        return ResponseEntity.ok(result);
    }

    /**
     * 删除项目管理角色
     */
    @DeleteMapping("/roles/{id}")
    @Operation(summary = "删除项目管理角色", description = "项目管理员删除角色权限")
    @SecurityRequirement(name = "ProjectAuth")
    public ResponseEntity<Result<String>> deletePRole(@PathVariable String id) {
        log.info("删除项目管理角色请求: {}", id);
        Result<String> result = projectService.deletePRole(id);
        return ResponseEntity.ok(result);
    }

    // ==================== 个人资料管理接口 ====================

    /**
     * 修改项目管理员密码
     */
    @PutMapping("/password")
    @Operation(summary = "修改密码", description = "项目管理员修改登录密码，需要验证当前密码")
    @SecurityRequirement(name = "ProjectAuth")
    public ResponseEntity<Result<String>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            BindingResult bindingResult, HttpServletRequest httpRequest) {
        log.info("项目管理员修改密码");

        // 检查验证错误
        if (bindingResult.hasErrors()) {
            StringBuilder errorMsg = new StringBuilder("数据验证失败: ");
            bindingResult.getFieldErrors().forEach(error -> {
                errorMsg.append(error.getField()).append(": ").append(error.getDefaultMessage()).append("; ");
            });
            log.error("验证错误: {}", errorMsg.toString());
            return ResponseEntity.ok(Result.fail(errorMsg.toString()));
        }

        // 从JWT Token中获取项目管理员ID
        String projectId = (String) httpRequest.getAttribute("userId");
        if (projectId == null) {
            log.error("无法获取项目管理员ID，JWT验证可能失败");
            return ResponseEntity.ok(Result.fail("认证失败，请重新登录"));
        }

        Result<String> result = projectService.changePassword(projectId, request);
        return ResponseEntity.ok(result);
    }

    // ==================== 用户管理接口 ====================

    /**
     * 获取所有项目管理员用户
     */
    @GetMapping("/users")
    @Operation(summary = "获取所有项目管理员用户", description = "项目管理员查看系统中所有项目管理员用户")
    @SecurityRequirement(name = "ProjectAuth")
    public ResponseEntity<Result<java.util.List<UserResponse>>> getAllUsers() {
        log.info("获取所有项目管理员用户请求");
        Result<java.util.List<UserResponse>> result = projectService.getAllUsers();
        return ResponseEntity.ok(result);
    }

    /**
     * 创建项目管理员用户
     */
    @PostMapping("/users")
    @Operation(summary = "创建项目管理员用户", description = "项目管理员创建新的项目管理员用户")
    @SecurityRequirement(name = "ProjectAuth")
    public ResponseEntity<Result<Project>> createUser(@Valid @RequestBody UserCreateRequest request) {
        log.info("创建项目管理员用户请求: {}", request.getName());
        Result<Project> result = projectService.createProjectUser(request);
        return ResponseEntity.ok(result);
    }

    /**
     * 更新项目管理员用户
     */
    @PutMapping("/users/{id}")
    @Operation(summary = "更新项目管理员用户", description = "项目管理员更新项目管理员用户信息")
    @SecurityRequirement(name = "ProjectAuth")
    public ResponseEntity<Result<Project>> updateUser(@PathVariable String id,
                                                      @Valid @RequestBody UserUpdateRequest request) {
        log.info("更新项目管理员用户请求: {} - {}", id, request.getName());
        Result<Project> result = projectService.updateProjectUser(id, request);
        return ResponseEntity.ok(result);
    }

    /**
     * 删除项目管理员用户
     */
    @DeleteMapping("/users/{id}")
    @Operation(summary = "删除项目管理员用户", description = "项目管理员删除项目管理员用户")
    @SecurityRequirement(name = "ProjectAuth")
    public ResponseEntity<Result<String>> deleteUser(@PathVariable String id) {
        log.info("删除项目管理员用户请求: {}", id);
        Result<String> result = projectService.deleteProjectUser(id);
        return ResponseEntity.ok(result);
    }

    // ==================== 学校管理员密码重置接口 ====================

    /**
     * 重置学校管理员密码
     */
    @PostMapping("/schools/reset-password")
    @Operation(summary = "重置学校管理员密码", description = "项目管理员重置学校管理员密码，支持单个和批量操作")
    @SecurityRequirement(name = "ProjectAuth")
    public ResponseEntity<Result<SchoolPasswordResetResponse>> resetSchoolAdminPassword(
            @Valid @RequestBody SchoolPasswordResetRequest request,
            BindingResult bindingResult) {
        log.info("重置学校管理员密码请求: 批量操作={}", request.isBatchOperation());

        // 检查验证错误
        if (bindingResult.hasErrors()) {
            StringBuilder errorMsg = new StringBuilder("数据验证失败: ");
            bindingResult.getFieldErrors().forEach(error -> {
                errorMsg.append(error.getField()).append(": ").append(error.getDefaultMessage()).append("; ");
            });
            log.error("验证错误: {}", errorMsg.toString());
            return ResponseEntity.ok(Result.fail(errorMsg.toString()));
        }

        Result<SchoolPasswordResetResponse> result = projectService.resetSchoolAdminPassword(request);
        return ResponseEntity.ok(result);
    }

    // ==================== 爬虫数据管理接口 ====================

    /**
     * 爬虫数据导入接口
     */
    @PostMapping("/crawler-data/import")
    @Operation(summary = "爬虫数据导入", description = "接收爬虫数据并去重存储到数据库")
    public ResponseEntity<Result<Map<String, Object>>> importCrawlerData(
            @Valid @RequestBody CrawlerDataImportRequest request) {
        log.info("爬虫数据导入请求: dataType={}, crawlerName={}, batchId={}, performBatchCleanup={}",
                request.getDataType(), request.getCrawlerName(), request.getBatchId(),
                request.getPerformBatchCleanup());

        Map<String, Object> combinedResult = new HashMap<>();

        // 1. 导入数据
        Result<CrawlerDataImportResponse> importResult = projectService.importCrawlerData(request);
        combinedResult.put("importResult", importResult);

        // 检查导入结果
        if (!importResult.isSuccess() || importResult.getData() == null) {
            log.error("数据导入失败: {}", importResult.getMsg());
            return ResponseEntity.ok(Result.fail("数据导入失败: " + importResult.getMsg(), combinedResult));
        }


        // 3. 执行 deduplicate 清理
        try {
            String deduplicationResult = deduplicate.cleanupJobAndPassJob();
            combinedResult.put("deduplicationResult", deduplicationResult);
        } catch (Exception e) {
            log.error("去重清理失败: {}", e.getMessage());
            combinedResult.put("deduplicationResult", "失败: " + e.getMessage());
            return ResponseEntity.ok(Result.fail("去重清理失败: " + e.getMessage(), combinedResult));
        }

        return ResponseEntity.ok(Result.success(combinedResult, "数据导入和处理完成"));
    }



    /**
     * 查询爬虫数据接口
     */
    @GetMapping("/crawler-data")
    @Operation(summary = "查询爬虫数据", description = "查询已导入的爬虫数据，支持分页和筛选")
    @SecurityRequirement(name = "ProjectAuth")
    public ResponseEntity<Result<java.util.List<com.x.pelegant.entity.CrawlerData>>> getCrawlerData(
            @Parameter(description = "数据类型") @RequestParam(required = false) String dataType,
            @Parameter(description = "爬虫名称") @RequestParam(required = false) String crawlerName,
            @Parameter(description = "数据状态") @RequestParam(required = false) String status,
            @Parameter(description = "批次ID") @RequestParam(required = false) String batchId,
            @Parameter(description = "页码，从0开始") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "每页大小") @RequestParam(defaultValue = "20") int size) {
        log.info("查询爬虫数据请求: dataType={}, crawlerName={}, status={}, batchId={}, page={}, size={}",
                dataType, crawlerName, status, batchId, page, size);

        Result<java.util.List<com.x.pelegant.entity.CrawlerData>> result = projectService.getCrawlerData(
                dataType, crawlerName, status, batchId, page, size);
        return ResponseEntity.ok(result);
    }

    /**
     * 删除爬虫数据接口
     */
    @DeleteMapping("/crawler-data/{id}")
    @Operation(summary = "删除爬虫数据", description = "根据ID删除指定的爬虫数据")
    @SecurityRequirement(name = "ProjectAuth")
    public ResponseEntity<Result<String>> deleteCrawlerData(
            @Parameter(description = "爬虫数据ID") @PathVariable String id) {
        log.info("删除爬虫数据请求: {}", id);

        Result<String> result = projectService.deleteCrawlerData(id);
        return ResponseEntity.ok(result);
    }


    @PostMapping("/deduplicate")
    @Operation(summary = "去重Job数据", description = "去重Job表重复数据")
    public JobService.Result<String> deduplicateJobs() {
        return jobService.deduplicateJobs();
    }

    /**
     * 返回所有job信息
     **/
    @GetMapping("/jobandcompany/all")
    @Operation(summary = "返回所有job和company信息", description = "返回所有信息来源于爬虫")
    public HashMap<String, Object> getAllJobandCompany() {
        return jobAndCompanyService.getAllJobAndCompany();
    }


    @PostMapping("/import/companies")
    @Operation(summary = "导入公司信息", description = "导入Excel文件中的公司信息")
    public ResponseEntity<String> importCompaniesFromExcel(@RequestParam("file") MultipartFile file) {
        try {
            excelImportService.importCompaniesFromExcel( file);
            return ResponseEntity.ok("成功导入了来自 Excel 文件的公司信息");
        } catch (IOException e) {
            return ResponseEntity.status(500).body("未能导入公司信息：" + e.getMessage());
        }
    }

    @GetMapping("/job-csv-export")
    @Operation(summary = "导出职位信息", description = "导出当前自然月的职位信息为CSV文件")
    public ResponseEntity<Resource> downloadCsv() throws IOException {
        File csvFile =export.exportJobCsvThisMonth();
        InputStreamResource resource = new InputStreamResource(new FileInputStream(csvFile));
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + csvFile.getName())
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(resource);
    }

    @GetMapping("/getalldata")
    @Operation(summary = "获取所有数据", description = "获取所有数据")
    @SecurityRequirement(name = "ProjectAuth")

    public Result<DashboardDataDto> getAllData() {
        log.info("获取所有数据请求");
        return projectService.getAllData();
    }

    @GetMapping("/getdata-school")
    @Operation(summary = "获取学校总览数据", description = "获取学校总览数据")
    @SecurityRequirement(name = "ProjectAuth")
    public Result<SchoolStatisticsResponse> getDataSchool() {
        log.info("获取学校总览数据");
        return projectService.getSchoolStatistics();
    }
    @GetMapping("/students/statistics")
    @Operation(summary = "获取学生统计数据", description = "获取学生统计数据")
    @SecurityRequirement(name = "ProjectAuth")
   private Result<StudentStatisticsResponse> getStudentStatistics() {
        log.info("获取学生统计数据");
        return projectService.getStudentStatistics();
    }


    @GetMapping("/students/university-distribution")
    @Operation(summary = "获取学生大学分布数据", description = "获取学生大学分布数据")
    @SecurityRequirement(name = "ProjectAuth")
    public Result<Map<String, Object>> getUniversityDistribution() {
        log.info("获取学生大学分布数据");
        return projectService.getUniversityDistribution();
    }

    @GetMapping("/students/monthly-new")
    @Operation(summary = "获取每月新增学生数", description = "获取每月新增学生数")
    @SecurityRequirement(name = "ProjectAuth")
    public Result<Map<String, Object>> getMonthlyNewStudents(
            @RequestParam(value = "year", required = false) Integer yearParam) {
        log.info("获取每月新增学生数");
        return projectService.getMonthlyNewStudents(yearParam);
    }

    @GetMapping("/school/activeUsers")
    @Operation(summary = "获取学校活跃用户数", description = "获取学校活跃用户数，近六个月，支持学校名搜索")
    @SecurityRequirement(name = "ProjectAuth")
    public Map<String, Object> getSchoolActiveUsers(
            @RequestParam(value = "schoolName", required = false) String schoolName,
     @RequestParam(defaultValue = "1") int page,
    @RequestParam(defaultValue = "5") int size) {
        log.info("获取学校活跃用户数");
        return projectService.getSchoolMonthlyActiveUsers(schoolName, page, size);
    }



    @GetMapping("/api/job/overview")
    @Operation(summary = "获取职位概览数据", description = "职位总数、类型分布、公司类型分布、位置分布等")
    @SecurityRequirement(name = "ProjectAuth")
    public Map<String, Object> getJobOverview(){
        return projectService.getJobOverview();
    }





    @GetMapping("/api/job/detail")
    @Operation(summary = "获取职位详情数据", description = "分页获取全职/实习职位列表及申请数")
    @SecurityRequirement(name = "ProjectAuth")
    public Map<String, Object> getJobDetail(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String jobType) {

        Map<String, Object> response = new HashMap<>();
        try {
            // 1️⃣ 查询条件
            Criteria criteria = new Criteria();
            if (jobType != null && !jobType.isEmpty()) {
                criteria = Criteria.where("jobType").is(jobType);
            }

            // 获取所有职位数据
            List<Document> allJobs = mongoTemplate.find(new Query(criteria), Document.class, "job");

            // 创建职位数据结构
            List<Map<String, Object>> fullTimePositions = new ArrayList<>();
            List<Map<String, Object>> internshipPositions = new ArrayList<>();
            List<Map<String, Object>> fullTimeChartData = new ArrayList<>();
            List<Map<String, Object>> internshipChartData = new ArrayList<>();

            // 获取所有学生数据
            List<Student> allStudents = mongoTemplate.findAll(Student.class, "student");

            // 创建 jobId 到申请数的映射
            Map<String, Integer> jobApplyCountMap = new HashMap<>();
            for (Student student : allStudents) {
                List<String> appliedJobs = student.getAppliedJobs();  // 获取学生的申请工作列表
                if (appliedJobs != null) {
                    for (String jobId : appliedJobs) {
                        // 更新每个职位的申请数
                        jobApplyCountMap.put(jobId, jobApplyCountMap.getOrDefault(jobId, 0) + 1);
                    }
                }
            }

            // 遍历所有职位，更新申请数，并分类
            for (Document job : allJobs) {
                String jobId = job.getString("jobId");
                String jobName = job.getString("jobTitle");
                String companyName = job.getString("companyName");
                String type = job.getString("jobType");

                // 获取对应职位的申请数
                int applyCount = jobApplyCountMap.getOrDefault(jobId, 0);

                // 如果职位的申请数为 0，跳过该职位
                if (applyCount == 0) {
                    continue;
                }

                Map<String, Object> jobMap = new HashMap<>();
                jobMap.put("jobTitle", jobName);
                jobMap.put("companyName", companyName);
                jobMap.put("applyCount", applyCount);

                // 根据职位类型分类
                if ("full-time-campus".equals(type)) {
                    fullTimePositions.add(jobMap);
                    fullTimeChartData.add(jobMap);
                } else if ("intern".equals(type)) {
                    internshipPositions.add(jobMap);
                    internshipChartData.add(jobMap);
                }
            }

            // 分页逻辑
            int start = (page - 1) * size;
            int endFull = Math.min(start + size, fullTimePositions.size());
            int endIntern = Math.min(start + size, internshipPositions.size());

            List<Map<String, Object>> fullTimePage = start < endFull ? fullTimePositions.subList(start, endFull) : new ArrayList<>();
            List<Map<String, Object>> internPage = start < endIntern ? internshipPositions.subList(start, endIntern) : new ArrayList<>();

            // 返回数据
            Map<String, Object> detailData = new HashMap<>();
            detailData.put("fullTimePositions", fullTimePage);
            detailData.put("internshipPositions", internPage);
            detailData.put("fullTimeChartData", fullTimeChartData);
            detailData.put("internshipChartData", internshipChartData);

            response.put("success", true);
            response.put("detailData", detailData);
            response.put("totalFullTime", fullTimePositions.size());
            response.put("totalInternship", internshipPositions.size());

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "获取职位详情失败: " + e.getMessage());
        }

        return response;
    }




}
