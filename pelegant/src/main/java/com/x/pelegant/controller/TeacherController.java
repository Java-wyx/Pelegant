
package com.x.pelegant.controller;

import com.x.pelegant.common.Result;
import com.x.pelegant.dto.AddStudentRequest;
import com.x.pelegant.dto.LoginRequest;
import com.x.pelegant.dto.LoginResponse;
import com.x.pelegant.dto.StudentApplicationStatsResponse;
import com.x.pelegant.dto.CompanyApplicationStatsResponse;
import com.x.pelegant.dto.UpdateTeacherProfileRequest;
import com.x.pelegant.dto.ChangePasswordRequest;
import com.x.pelegant.dto.StudentBatchImportResponse;
import com.x.pelegant.dto.RoleCreateRequest;
import com.x.pelegant.dto.RoleUpdateRequest;
import com.x.pelegant.dto.CreateTeacherRequest;
import com.x.pelegant.dto.UpdateTeacherRequest;
import com.x.pelegant.entity.Student;
import com.x.pelegant.entity.Teacher;
import com.x.pelegant.entity.TRole;
import com.x.pelegant.entity.Company;
import com.x.pelegant.repository.TeacherRepository;
import com.x.pelegant.service.TeacherService;
import com.x.pelegant.util.PasswordUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;
import java.util.List;
import java.util.Optional;

/**
 * 教师控制器
 */
@RestController
@RequestMapping("/api/teachers")
@Tag(name = "教师管理", description = "教师登录、学生管理相关接口")
@Slf4j
@Validated
public class TeacherController {

    @Autowired
    private TeacherService teacherService;


    @Autowired
    private TeacherRepository teacherRepository;

    /**
     * 教师登录接口
     */
    @PostMapping("/login-json")
    @Operation(summary = "教师登录(JSON)", description = "教师使用JSON格式进行登录")
    public ResponseEntity<Result<LoginResponse>> loginJson(@RequestBody LoginRequest loginRequest) {
        log.info("教师JSON登录请求: {}", loginRequest.getEmail());
        Result<LoginResponse> result = teacherService.login(loginRequest.getEmail(), loginRequest.getPassword());
        return ResponseEntity.ok(result);
    }

    /**
     * 教师添加学生接口（仅核心字段，自动生成密码）
     */
    @PostMapping("/students")
    @Operation(summary = "添加学生", description = "教师添加新的学生信息到系统（仅核心字段，自动生成密码，自动使用教师的学校ID）")
    @SecurityRequirement(name = "TeacherAuth")
    public ResponseEntity<Result<Student>> addStudent(@Valid @RequestBody AddStudentRequest request,
                                                      BindingResult bindingResult, HttpServletRequest httpRequest) {
        log.info("教师添加学生请求: {}", request.getFullName());

        // 检查验证错误
        if (bindingResult.hasErrors()) {
            StringBuilder errorMsg = new StringBuilder("数据验证失败: ");
            bindingResult.getFieldErrors().forEach(error -> {
                errorMsg.append(error.getField()).append(": ").append(error.getDefaultMessage()).append("; ");
            });
            log.error("验证错误: {}", errorMsg.toString());
            return ResponseEntity.ok(Result.fail(errorMsg.toString()));
        }

        // 从JWT Token中获取教师ID
        String teacherId = (String) httpRequest.getAttribute("userId");
        if (teacherId == null) {
            log.error("无法获取教师ID，JWT验证可能失败");
            return ResponseEntity.ok(Result.fail("Authentication failed. Please log in again"));
        }

        Result<Student> result = teacherService.addStudent(request, teacherId);
        return ResponseEntity.ok(result);
    }

    /**
     * 教师查看本学校所有学生接口
     */
    @GetMapping("/students")
    @Operation(summary = "查看本学校所有学生", description = "教师查看本学校的所有学生信息")
    @SecurityRequirement(name = "TeacherAuth")
    public ResponseEntity<Result<List<Student>>> getAllStudents(HttpServletRequest httpRequest) {
        log.info("教师查看本学校所有学生请求");

        // 从JWT Token中获取教师ID
        String teacherId = (String) httpRequest.getAttribute("userId");

        Result<List<Student>> result = teacherService.getAllStudents(teacherId);
        return ResponseEntity.ok(result);
    }

    /**
     * 根据专业查询本学校学生
     */
    @GetMapping("/students/major/{major}")
    @Operation(summary = "根据专业查询本学校学生", description = "教师根据专业查询本学校的学生列表")
    @SecurityRequirement(name = "TeacherAuth")
    public ResponseEntity<Result<List<Student>>> getStudentsByMajor(
            @Parameter(description = "专业名称") @PathVariable String major,
            HttpServletRequest httpRequest) {
        log.info("教师根据专业查询本学校学生: {}", major);

        // 从JWT Token中获取教师ID
        String teacherId = (String) httpRequest.getAttribute("userId");

        Result<List<Student>> result = teacherService.getStudentsByMajor(teacherId, major);
        return ResponseEntity.ok(result);
    }

    /**
     * 根据入学年份查询本学校学生
     */
    @GetMapping("/students/year/{year}")
    @Operation(summary = "根据入学年份查询本学校学生", description = "教师根据入学年份查询本学校的学生列表")
    @SecurityRequirement(name = "TeacherAuth")
    public ResponseEntity<Result<List<Student>>> getStudentsByYear(
            @Parameter(description = "入学年份") @PathVariable Integer year,
            HttpServletRequest httpRequest) {
        log.info("教师根据入学年份查询本学校学生: {}", year);

        // 从JWT Token中获取教师ID
        String teacherId = (String) httpRequest.getAttribute("userId");

        Result<List<Student>> result = teacherService.getStudentsByYear(teacherId, year);
        return ResponseEntity.ok(result);
    }

    /**
     * 根据姓名搜索学生
     */
    @GetMapping("/students/search")
    @Operation(summary = "根据姓名搜索学生", description = "教师根据学生姓名进行模糊搜索")
    public ResponseEntity<Result<List<Student>>> searchStudentsByName(
            @Parameter(description = "学生姓名关键词") @RequestParam String name) {
        log.info("教师根据姓名搜索学生: {}", name);
        Result<List<Student>> result = teacherService.searchStudentsByName(name);
        return ResponseEntity.ok(result);
    }

    /**
     * 更新学生信息
     */
    @PutMapping("/students/{studentId}")
    @Operation(summary = "更新学生信息", description = "教师更新本校学生的基本信息")
    @SecurityRequirement(name = "TeacherAuth")
    public ResponseEntity<Result<Student>> updateStudent(
            @Parameter(description = "学生ID") @PathVariable String studentId,
            @Valid @RequestBody AddStudentRequest request,
            BindingResult bindingResult, HttpServletRequest httpRequest) {
        log.info("教师更新学生信息请求: {} - {}", studentId, request.getFullName());

        // 检查验证错误
        if (bindingResult.hasErrors()) {
            StringBuilder errorMsg = new StringBuilder("数据验证失败: ");
            bindingResult.getFieldErrors().forEach(error -> {
                errorMsg.append(error.getField()).append(": ").append(error.getDefaultMessage()).append("; ");
            });
            log.error("验证错误: {}", errorMsg.toString());
            return ResponseEntity.ok(Result.fail(errorMsg.toString()));
        }

        // 从JWT Token中获取教师ID
        String teacherId = (String) httpRequest.getAttribute("userId");
        if (teacherId == null) {
            log.error("无法获取教师ID，JWT验证可能失败");
            return ResponseEntity.ok(Result.fail("Authentication failed. Please log in again"));
        }

        Result<Student> result = teacherService.updateStudent(teacherId, studentId, request);
        return ResponseEntity.ok(result);
    }

    /**
     * 删除学生
     */
    @DeleteMapping("/students/{studentId}")
    @Operation(summary = "删除学生", description = "教师删除本校学生（硬删除）")
    @SecurityRequirement(name = "TeacherAuth")
    public ResponseEntity<Result<String>> deleteStudent(
            @Parameter(description = "学生ID") @PathVariable String studentId,
            HttpServletRequest httpRequest) {
        log.info("教师删除学生请求: {}", studentId);

        // 从JWT Token中获取教师ID
        String teacherId = (String) httpRequest.getAttribute("userId");
        if (teacherId == null) {
            log.error("无法获取教师ID，JWT验证可能失败");
            return ResponseEntity.ok(Result.fail("Authentication failed. Please log in again"));
        }

        Result<String> result = teacherService.deleteStudent(teacherId, studentId);
        return ResponseEntity.ok(result);
    }

    /**
     * 获取学生申请工作统计数据
     */
    @GetMapping("/stats/student-applications")
    @Operation(summary = "学生申请工作统计", description = "获取学生申请工作的统计数据，支持按年级和按专业统计")
    @SecurityRequirement(name = "TeacherAuth")
    public ResponseEntity<Result<StudentApplicationStatsResponse>> getStudentApplicationStats(
            HttpServletRequest httpRequest) {
        log.info("教师获取学生申请工作统计数据");

        // 从JWT Token中获取教师ID
        String teacherId = (String) httpRequest.getAttribute("userId");
        if (teacherId == null) {
            log.error("无法获取教师ID，JWT验证可能失败");
            return ResponseEntity.ok(Result.fail("Authentication failed. Please log in again"));
        }

        Result<StudentApplicationStatsResponse> result = teacherService.getStudentApplicationStats(teacherId);
        return ResponseEntity.ok(result);
    }

    /**
     * 获取企业收到工作申请统计数据
     */
    @GetMapping("/stats/company-applications")
    @Operation(summary = "企业收到工作申请统计", description = "获取企业收到工作申请的统计数据，支持全职和实习分类统计")
    @SecurityRequirement(name = "TeacherAuth")
    public ResponseEntity<Result<CompanyApplicationStatsResponse>> getCompanyApplicationStats(HttpServletRequest httpRequest) {
        log.info("教师获取企业收到工作申请统计数据");
        String teacherId = (String) httpRequest.getAttribute("userId");
        log.info("教师ID: {}", teacherId);
        Result<CompanyApplicationStatsResponse> result = teacherService.getSchoolApplicationStats(teacherId);
        return ResponseEntity.ok(result);
    }

    /**
     * 获取教师个人信息
     */
    @GetMapping("/profile")
    @Operation(summary = "获取个人信息", description = "获取教师个人信息")
    @SecurityRequirement(name = "TeacherAuth")
    public ResponseEntity<Result<Teacher>> getTeacherProfile(HttpServletRequest httpRequest) {
        log.info("教师获取个人信息");

        // 从JWT Token中获取教师ID
        String teacherId = (String) httpRequest.getAttribute("userId");
        if (teacherId == null) {
            log.error("无法获取教师ID，JWT验证可能失败");
            return ResponseEntity.ok(Result.fail("Authentication failed. Please log in again"));
        }

        Result<Teacher> result = teacherService.getTeacherProfile(teacherId);
        return ResponseEntity.ok(result);
    }

    /**
     * 修改教师个人信息
     */
    @PutMapping("/profile")
    @Operation(summary = "修改个人信息", description = "修改教师个人信息，包括姓名、邮箱、电话等")
    @SecurityRequirement(name = "TeacherAuth")
    public ResponseEntity<Result<Teacher>> updateTeacherProfile(
            @Valid @RequestBody UpdateTeacherProfileRequest request,
            BindingResult bindingResult, HttpServletRequest httpRequest) {
        log.info("教师修改个人信息");

        // 检查验证错误
        if (bindingResult.hasErrors()) {
            StringBuilder errorMsg = new StringBuilder("数据验证失败: ");
            bindingResult.getFieldErrors().forEach(error -> {
                errorMsg.append(error.getField()).append(": ").append(error.getDefaultMessage()).append("; ");
            });
            log.error("验证错误: {}", errorMsg.toString());
            return ResponseEntity.ok(Result.fail(errorMsg.toString()));
        }

        // 从JWT Token中获取教师ID
        String teacherId = (String) httpRequest.getAttribute("userId");
        if (teacherId == null) {
            log.error("无法获取教师ID，JWT验证可能失败");
            return ResponseEntity.ok(Result.fail("Authentication failed. Please log in again"));
        }

        Result<Teacher> result = teacherService.updateTeacherProfile(teacherId, request);
        return ResponseEntity.ok(result);
    }

    /**
     * 修改教师密码
     */
    @PutMapping("/password")
    @Operation(summary = "修改密码", description = "修改教师密码，需要验证当前密码")
    @SecurityRequirement(name = "TeacherAuth")
    public ResponseEntity<Result<String>> changeTeacherPassword(
            @Valid @RequestBody ChangePasswordRequest request,
            BindingResult bindingResult, HttpServletRequest httpRequest) {
        log.info("教师修改密码");

        // 检查验证错误
        if (bindingResult.hasErrors()) {
            StringBuilder errorMsg = new StringBuilder("数据验证失败: ");
            bindingResult.getFieldErrors().forEach(error -> {
                errorMsg.append(error.getField()).append(": ").append(error.getDefaultMessage()).append("; ");
            });
            log.error("验证错误: {}", errorMsg.toString());
            return ResponseEntity.ok(Result.fail(errorMsg.toString()));
        }

        // 从JWT Token中获取教师ID
        String teacherId = (String) httpRequest.getAttribute("userId");
        if (teacherId == null) {
            log.error("无法获取教师ID，JWT验证可能失败");
            return ResponseEntity.ok(Result.fail("Authentication failed. Please log in again"));
        }

        Result<String> result = teacherService.changeTeacherPassword(teacherId, request);
        return ResponseEntity.ok(result);
    }

    /**
     * 教师批量导入学生Excel接口
     */
    @PostMapping("/students/import-excel")
    @Operation(summary = "批量导入学生Excel", description = "教师通过上传Excel文件批量导入学生信息。Excel格式：fullname, studentId, email, major, grade")
    @SecurityRequirement(name = "TeacherAuth")
    public ResponseEntity<Result<StudentBatchImportResponse>> importStudentsExcel(
            @Parameter(description = "Excel文件（.xlsx或.xls格式）", required = true) @RequestParam("file") MultipartFile file,
            HttpServletRequest httpRequest) {

        log.info("教师批量导入学生Excel请求: 文件名={}", file.getOriginalFilename());

        // 从JWT Token中获取教师ID
        String teacherId = (String) httpRequest.getAttribute("userId");
        if (teacherId == null) {
            log.error("无法获取教师ID，JWT验证可能失败");
            return ResponseEntity.ok(Result.fail("Authentication failed. Please log in again"));
        }

        // 验证文件
        if (file.isEmpty()) {
            return ResponseEntity.ok(Result.fail("请选择要上传的Excel文件"));
        }

        // 验证文件大小（最大5MB）
        if (file.getSize() > 5 * 1024 * 1024) {
            return ResponseEntity.ok(Result.fail("Excel文件大小不能超过5MB"));
        }

        Result<StudentBatchImportResponse> result = teacherService.importStudentsFromExcel(teacherId, file);
        return ResponseEntity.ok(result);
    }

    // ==================== 角色权限管理接口 ====================

    /**
     * 创建教师管理角色
     */
    @PostMapping("/roles")
    @Operation(summary = "创建教师管理角色", description = "教师管理员创建新的角色权限")
    @SecurityRequirement(name = "TeacherAuth")
    public ResponseEntity<Result<TRole>> createTRole(@Valid @RequestBody RoleCreateRequest request) {
        log.info("创建教师管理角色请求: {}", request.getRoleName());
        Result<TRole> result = teacherService.createTRole(request);
        return ResponseEntity.ok(result);
    }

    /**
     * 查看所有教师管理角色
     */
    @GetMapping("/roles")
    @Operation(summary = "查看所有教师管理角色", description = "教师管理员查看系统中所有角色权限")
    @SecurityRequirement(name = "TeacherAuth")
    public ResponseEntity<Result<java.util.List<TRole>>> getAllTRoles() {
        log.info("查看所有教师管理角色请求");
        Result<java.util.List<TRole>> result = teacherService.getAllTRoles();
        return ResponseEntity.ok(result);
    }

    /**
     * 根据ID获取教师管理角色
     */
    @GetMapping("/roles/{id}")
    @Operation(summary = "根据ID获取教师管理角色", description = "教师管理员根据ID查看特定角色权限")
    @SecurityRequirement(name = "TeacherAuth")
    public ResponseEntity<Result<TRole>> getTRoleById(@PathVariable String id) {
        log.info("根据ID获取教师管理角色请求: {}", id);
        Result<TRole> result = teacherService.getTRoleById(id);
        return ResponseEntity.ok(result);
    }

    /**
     * 更新教师管理角色
     */
    @PutMapping("/roles/{id}")
    @Operation(summary = "更新教师管理角色", description = "教师管理员更新角色权限信息")
    @SecurityRequirement(name = "TeacherAuth")
    public ResponseEntity<Result<TRole>> updateTRole(@PathVariable String id,
                                                     @Valid @RequestBody RoleUpdateRequest request) {
        log.info("更新教师管理角色请求: {} - {}", id, request.getRoleName());
        Result<TRole> result = teacherService.updateTRole(id, request);
        return ResponseEntity.ok(result);
    }

    /**
     * 删除教师管理角色
     */
    @DeleteMapping("/roles/{id}")
    @Operation(summary = "删除教师管理角色", description = "教师管理员删除角色权限")
    @SecurityRequirement(name = "TeacherAuth")
    public ResponseEntity<Result<String>> deleteTRole(@PathVariable String id) {
        log.info("删除教师管理角色请求: {}", id);
        Result<String> result = teacherService.deleteTRole(id);
        return ResponseEntity.ok(result);
    }

    // ==================== 用户管理接口 ====================

    /**
     * 获取本校教师用户
     */
    @GetMapping("/users")
    @Operation(summary = "获取本校教师用户", description = "教师管理员查看本校的教师用户")
    @SecurityRequirement(name = "TeacherAuth")
    public ResponseEntity<Result<java.util.List<Teacher>>> getAllTeachers(HttpServletRequest httpRequest) {
        log.info("获取本校教师用户请求");

        // 从JWT Token中获取教师ID
        String teacherId = (String) httpRequest.getAttribute("userId");
        if (teacherId == null) {
            log.error("无法获取教师ID，JWT验证可能失败");
            return ResponseEntity.ok(Result.fail("Authentication failed. Please log in again"));
        }

        Result<java.util.List<Teacher>> result = teacherService.getTeachersBySchool(teacherId);
        return ResponseEntity.ok(result);
    }

    /**
     * 创建教师用户
     */
    @PostMapping("/users")
    @Operation(summary = "创建教师用户", description = "教师管理员创建新的教师用户，自动使用当前教师的学校ID")
    @SecurityRequirement(name = "TeacherAuth")
    public ResponseEntity<Result<Teacher>> createTeacher(@Valid @RequestBody CreateTeacherRequest request,
                                                         HttpServletRequest httpRequest) {
        log.info("创建教师用户请求: {}", request.getEmail());

        // 从JWT Token中获取教师ID
        String teacherId = (String) httpRequest.getAttribute("userId");
        if (teacherId == null) {
            log.error("无法获取教师ID，JWT验证可能失败");
            return ResponseEntity.ok(Result.fail("Authentication failed. Please log in again"));
        }

        Result<Teacher> result = teacherService.createTeacher(request, teacherId);
        return ResponseEntity.ok(result);
    }

    /**
     * 更新教师用户
     */
    @PutMapping("/users/{teacherId}")
    @Operation(summary = "更新教师用户", description = "教师管理员更新教师用户信息")
    @SecurityRequirement(name = "TeacherAuth")
    public ResponseEntity<Result<Teacher>> updateTeacher(@PathVariable String teacherId,
                                                         @Valid @RequestBody UpdateTeacherRequest request) {
        log.info("更新教师用户请求: {} - {}", teacherId, request.getEmail());
        Result<Teacher> result = teacherService.updateTeacher(teacherId, request);
        return ResponseEntity.ok(result);
    }

    /**
     * 删除教师用户
     */
    @DeleteMapping("/users/{teacherId}")
    @Operation(summary = "删除教师用户", description = "教师管理员删除教师用户")
    @SecurityRequirement(name = "TeacherAuth")
    public ResponseEntity<Result<String>> deleteTeacher(@PathVariable String teacherId,HttpServletRequest httpRequest) {
        log.info("删除教师用户请求: {}", teacherId);
        String teacherid = (String) httpRequest.getAttribute("userId");
        Result<String> result = teacherService.deleteTeacher(teacherId,teacherid);
        return ResponseEntity.ok(result);
    }

    // ==================== 企业管理接口 ====================

    /**
     * 查看所有企业接口
     */
    @GetMapping("/companies")
    @Operation(summary = "查看所有企业", description = "教师查看系统中所有企业信息，支持分页和筛选")
    @SecurityRequirement(name = "TeacherAuth")
    public ResponseEntity<Result<java.util.List<java.util.Map<String, Object>>>> getAllCompanies(
            @Parameter(description = "页码，从0开始") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "每页大小") @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "搜索关键词（企业名称、行业、地址）") @RequestParam(required = false) String search,
            @Parameter(description = "行业筛选") @RequestParam(required = false) String industry,
            @Parameter(description = "企业类型筛选") @RequestParam(required = false) String companyType,
            @Parameter(description = "状态筛选") @RequestParam(required = false) String status) {
        log.info("教师查看所有企业请求: page={}, size={}, search={}", page, size, search);
        Result<java.util.List<java.util.Map<String, Object>>> result = teacherService.getAllCompaniesForTeacher(page,
                size, search, industry, companyType, status);
        return ResponseEntity.ok(result);
    }

    /**
     * 根据ID获取企业详情接口
     */
    @GetMapping("/companies/{id}")
    @Operation(summary = "获取企业详情", description = "教师根据ID获取企业详细信息")
    @SecurityRequirement(name = "TeacherAuth")
    public ResponseEntity<Result<Company>> getCompanyById(@PathVariable String id) {
        log.info("教师获取企业详情请求: {}", id);
        Result<Company> result = teacherService.getCompanyByIdForTeacher(id);
        return ResponseEntity.ok(result);
    }

    /**
     * 根据名称搜索企业
     */
    @GetMapping("/companies/search")
    @Operation(summary = "根据名称搜索企业", description = "教师根据企业名称搜索企业信息")
    @SecurityRequirement(name = "TeacherAuth")
    public ResponseEntity<Result<java.util.List<Company>>> searchCompaniesByName(
            @Parameter(description = "企业名称关键词") @RequestParam String name) {
        log.info("教师根据名称搜索企业请求: {}", name);
        Result<java.util.List<Company>> result = teacherService.searchCompaniesByNameForTeacher(name);
        return ResponseEntity.ok(result);
    }


    @PostMapping("/avatar/upload")
    @Operation(summary = "上传头像", description = "学生上传头像图片文件")
    @SecurityRequirement(name = "TeacherAuth")
    public ResponseEntity<Result<String>> uploadAvatar(
            HttpServletRequest httpRequest,
            @RequestParam("avatar") MultipartFile file
    ){

        String TeacherId = (String) httpRequest.getAttribute("userId");
        log.info("教师上传头像请求: 教师ID={}, 文件名={}", TeacherId, file.getOriginalFilename());
        Result<String> result = teacherService.uploadAvatar(TeacherId, file);
        return ResponseEntity.ok(result);
    }

    /**
     * 用户点击链接访问页面（可以用前端渲染，这里直接接口示例）
     */
    @GetMapping("/validate-token")
    public Result<String> validateToken(@RequestParam String token) {
       return teacherService.validateToken(token);
    }

    /**
     * 提交新密码
     */
    @PostMapping("/reset-password")
    public Result<String> resetPassword(@RequestParam String token,
                                        @RequestParam String newPassword,
                                        @RequestParam String confirmPassword) {
      return teacherService.resetTeacherAdminPassword(token, newPassword, confirmPassword);
    }
}
