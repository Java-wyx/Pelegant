/*
 * @Author: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @Date: 2025-07-02 20:18:24
 * @LastEditors: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @LastEditTime: 2025-07-08 17:34:07
 * @FilePath: \新建文件夹\Pelegant\src\main\java\com\x\pelegant\controller\StudentController.java
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
package com.x.pelegant.controller;

import com.x.pelegant.common.Result;
import com.x.pelegant.dto.*;

import com.x.pelegant.entity.ResumeData;
import com.x.pelegant.entity.Student;
import com.x.pelegant.entity.Job;

import com.x.pelegant.repository.RecommendedWorkRepository;
import com.x.pelegant.repository.ResumeDataRepository;
import com.x.pelegant.service.CozeAIService;
import com.x.pelegant.service.StudentService;
import com.x.pelegant.service.RecommendedWorkService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.validation.Valid;
import javax.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * 学生控制器
 * 处理学生相关的所有API请求，包括：
 * - 学生登录认证
 * - 个人信息管理（密码修改、资料更新、头像上传）
 * - 简历管理（上传、更新、查看、删除）
 * - 工作推荐（AI分析、职位推荐）
 * - 工作收藏（收藏、取消收藏、查看收藏列表）
 * - 工作申请（申请职位、查看申请记录、撤回申请）
 * - 个人中心（数据统计、个人信息汇总）
 */
@RestController
@RequestMapping("/api/students")
@Tag(name = "学生管理", description = "学生端所有功能的API接口集合")
@Slf4j
@Validated
public class StudentController {

    @Autowired
    private StudentService studentService;

    @Autowired
    private RecommendedWorkService recommendedWorkService;

    @Autowired
    private CozeAIService cozeAIService;

    @Autowired
    private ResumeDataRepository resumeDataRepository;

    @Autowired
    private RecommendedWorkRepository recommendedWorkRepository;

    /**
     * 学生登录接口
     */
    @PostMapping("/login-json")
    @Operation(summary = "学生登录(JSON)", description = "学生使用JSON格式进行登录")
    public ResponseEntity<Result<LoginResponse>> loginJson(@RequestBody LoginRequest loginRequest) {
        log.info("学生JSON登录请求: {}", loginRequest.getEmail());
        Result<LoginResponse> result = studentService.login(loginRequest.getEmail(), loginRequest.getPassword());
        return ResponseEntity.ok(result);
    }

    /**
     * 学生上传简历接口
     */
    @PostMapping("/resume/upload")
    @Operation(summary = "上传简历", description = "学生上传PDF简历文件")
    @SecurityRequirement(name = "StudentAuth")
    public ResponseEntity<Result<Map<String, String>>>  uploadResume(
            @Parameter(description = "学生ID", required = true) @RequestParam String studentId,
            @Parameter(description = "PDF简历文件", required = true) @RequestParam("file") MultipartFile file) {

        log.info("学生上传简历请求: 学生ID={}, 文件名={}", studentId, file.getOriginalFilename());
        Result<Map<String, String>> result = studentService.uploadResume(studentId, file);
        return ResponseEntity.ok(result);
    }

    /**
     * 学生更新简历接口
     */
    @PutMapping("/resume/update")
    @Operation(summary = "更新简历", description = "学生更新（替换）现有的简历文件")
    public ResponseEntity<Result<Map<String, String>>> updateResume(
            @Parameter(description = "学生ID", required = true) @RequestParam String studentId,
            @Parameter(description = "新的PDF简历文件", required = true) @RequestParam("file") MultipartFile file) {

        log.info("学生更新简历请求: 学生ID={}, 文件名={}", studentId, file.getOriginalFilename());
        Result<Map<String, String>> result = studentService.updateResume(studentId, file);
        return ResponseEntity.ok(result);
    }

    /**
     * 获取学生简历信息接口
     */
    @GetMapping("/resume/{studentId}")
    @Operation(summary = "获取简历信息", description = "获取学生的简历详细信息")
    public ResponseEntity<Result<java.util.Map<String, Object>>> getStudentResume(
            @Parameter(description = "学生ID", required = true) @PathVariable String studentId) {

        log.info("获取学生简历信息请求: 学生ID={}", studentId);
        Result<java.util.Map<String, Object>> result = studentService.getStudentResume(studentId);
        return ResponseEntity.ok(result);
    }


    /**
     * 获取简历AI工作推荐解析状态
     */
    @GetMapping("/resume/status")
    @Operation(summary = "获取简历解析状态", description = "获取学生的简历解析状态")
    @SecurityRequirement(name = "StudentAuth")
    public Result<Map<String, Object>> getResumeStatus(@RequestParam String studentId) {
        Optional<ResumeData> resumeOpt =resumeDataRepository.findTopByStudentIdOrderByUpdateTimeDesc(studentId);

        if (!resumeOpt.isPresent()) {
            return Result.fail("未找到简历解析记录");
        }


        ResumeData resume = resumeOpt.get();

        Map<String, Object> result = new HashMap<>();
        result.put("parseStatus", resume.getParseStatus());
        result.put("errorMessage", resume.getErrorMessage());
        result.put("hasRecommendations", recommendedWorkRepository.existsByStudentId(studentId));

        return Result.success(result);
    }


    /**
     * 学生上传头像接口
     */
    @PostMapping("/avatar/upload")
    @Operation(summary = "上传头像", description = "学生上传头像图片文件")
    @SecurityRequirement(name = "StudentAuth")
    public ResponseEntity<Result<String>> uploadAvatar(
//            @Parameter(description = "学生ID", required = true) @RequestParam String studentId,
            HttpServletRequest httpRequest,
            @RequestParam("avatar") MultipartFile file
//            @Parameter(description = "头像图片文件(JPG/PNG/GIF，最大5MB)", required = true) @RequestParam("file") MultipartFile file) {
    ){

        String studentId = (String) httpRequest.getAttribute("userId");
        log.info("学生上传头像请求: 学生ID={}, 文件名={}", studentId, file.getOriginalFilename());
        Result<String> result = studentService.uploadAvatar(studentId, file);
        return ResponseEntity.ok(result);
    }

    /**
     * 获取学生收藏的职位列表接口
     */
    @GetMapping("/bookmarks/{studentId}")
    @Operation(summary = "获取收藏职位列表", description = "获取学生收藏的所有职位")
    public ResponseEntity<Result<java.util.List<Job>>> getBookmarkedJobs(
            @Parameter(description = "学生ID", required = true) @PathVariable String studentId) {

        log.info("获取学生收藏职位列表请求: 学生ID={}", studentId);
        Result<java.util.List<Job>> result = studentService.getBookmarkedJobs(studentId);
        return ResponseEntity.ok(result);
    }

    /**
     * 获取学生申请记录列表接口
     */
    @GetMapping("/applications/{studentId}")
    @Operation(summary = "获取申请记录", description = "获取学生的所有职位申请记录")
    public ResponseEntity<Result<java.util.List<Job>>> getJobApplications(
            @Parameter(description = "学生ID", required = true) @PathVariable String studentId) {

        log.info("获取学生申请记录请求: 学生ID={}", studentId);
        Result<java.util.List<Job>> result = studentService.getJobApplications(studentId);
        return ResponseEntity.ok(result);
    }

    /**
     * 修改个人信息接口
     */
    @PutMapping("/profile/{id}")
    @Operation(summary = "修改个人信息", description = "学生修改个人基本信息")
    public ResponseEntity<Result<Student>> updateProfile(
            @Parameter(description = "学生ID") @PathVariable String id,
            @Valid @RequestBody StudentProfileUpdateRequest request) {

        log.info("学生修改个人信息请求: ID={}", id);
        Result<Student> result = studentService.updateProfile(id, request);
        return ResponseEntity.ok(result);
    }

    /**
     * 修改密码接口
     */
    @PutMapping("/password/{id}")
    @Operation(summary = "修改密码", description = "学生修改登录密码")
    public ResponseEntity<Result<String>> changePassword(
            @Parameter(description = "学生ID") @PathVariable String id,
            @RequestBody PasswordChangeRequest request) {

        log.info("学生修改密码请求: ID={}", id);
        Result<String> result = studentService.changePassword(id, request.getOldPassword(), request.getNewPassword());
        return ResponseEntity.ok(result);
    }

    /**
     * 获取个人信息接口
     */
    @GetMapping("/profile/{id}")
    @SecurityRequirement(name = "StudentAuth")
    @Operation(summary = "获取个人信息", description = "学生查看个人详细信息")
    public ResponseEntity<Result<Student>> getProfile(@Parameter(description = "学生ID") @PathVariable String id) {
        log.info("学生查看个人信息请求: ID={}", id);
        Result<Student> result = studentService.getStudentProfile(id);
        return ResponseEntity.ok(result);
    }

    /**
     * 学生完成个人资料设置接口
     */
    @PostMapping("/profile/complete")
    @Operation(summary = "完成个人资料设置", description = "学生首次登录完成个人资料设置")
    @SecurityRequirement(name = "StudentAuth")
    public Result completeProfileSetup(
            @Parameter(description = "学生ID", required = true) @RequestParam String studentId,
            @Parameter(description = "昵称") @RequestParam(required = false) String nickname,
            @Parameter(description = "性别") @RequestParam(required = false) String gender,
            @Parameter(description = "头像文件") @RequestParam(required = false) MultipartFile avatarFile,
            @Parameter(description = "简历文件") @RequestParam(required = false) MultipartFile resumeFile) {

        log.info("学生完成个人资料设置请求: 学生ID={}", studentId);

        try {
            Result<String> result = studentService.completeProfileSetup(studentId, nickname, gender, avatarFile, resumeFile);
            return result.isSuccess() ? Result.success("个人资料设置完成") : Result.fail(result.getMessage());
        } catch (Exception e) {
            log.error("完成个人资料设置失败: 学生ID={}", studentId, e);
            return Result.fail("个人资料设置失败: " + e.getMessage());
        }
    }

    // ==================== 职位相关接口 ====================

    /**
     * 获取职位详情接口
     */
    @GetMapping("/jobs/{jobId}")
    @Operation(summary = "获取职位详情", description = "根据职位ID获取职位详细信息")
    @SecurityRequirement(name = "StudentAuth")
    public ResponseEntity<Result<Job>> getJobDetails(
            @Parameter(description = "职位ID", required = true) @PathVariable String jobId) {

        log.info("获取职位详情请求: 职位ID={}", jobId);
        Result<Job> result = studentService.getJobById(jobId);
        return ResponseEntity.ok(result);
    }

    /**
     * 搜索职位接口
     */
    @GetMapping("/jobs/search")
    @Operation(summary = "搜索职位", description = "根据关键词和就业类型搜索职位")
    public ResponseEntity<Result<JobSearchResponse>> searchJobs(
            @Parameter(description = "搜索关键词") @RequestParam(required = false) String keyword,
            @Parameter(description = "就业类型") @RequestParam(required = false) String employmentType) {

        log.info("搜索职位请求: 关键词={}, 就业类型={}", keyword, employmentType);
        Result<JobSearchResponse> result = studentService.searchJobs(keyword, employmentType);
        return ResponseEntity.ok(result);
    }

    // ==================== 推荐工作相关接口 ====================

    /**
     * 获取学生的推荐工作列表
     */
    @GetMapping("/recommended-work/list")
    @Operation(summary = "获取推荐工作列表", description = "获取学生的推荐工作列表")
    public ResponseEntity<Result<java.util.List<RecommendedJobResponse>>> getRecommendedJobs(
            @Parameter(description = "学生ID", required = true) @RequestParam String studentId) {
        try {
            log.info("学生获取推荐工作列表: studentId={}", studentId);
            Result<java.util.List<RecommendedJobResponse>> result = recommendedWorkService
                    .getRecommendedJobs(studentId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("获取推荐工作列表失败", e);
            return ResponseEntity.ok(Result.fail("获取推荐工作列表失败: " + e.getMessage()));
        }
    }

    /**
     * 获取推荐工作统计
     */
    @GetMapping("/recommended-work/count")
    @Operation(summary = "获取推荐工作统计", description = "获取学生的推荐工作数量统计")
    public ResponseEntity<Result<Long>> getRecommendedWorkCount(
            @Parameter(description = "学生ID", required = true) @RequestParam String studentId) {
        try {
            log.info("学生获取推荐工作统计: studentId={}", studentId);
            Result<Long> result = recommendedWorkService.getRecommendedWorkCount(studentId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("获取推荐工作统计失败", e);
            return ResponseEntity.ok(Result.fail("获取推荐工作统计失败: " + e.getMessage()));
        }
    }

    /**
     * 生成AI职位推荐
     */
    @PostMapping("/recommended-work/generate")
    @Operation(summary = "生成AI职位推荐", description = "基于学生简历使用AI生成个性化职位推荐")
    @SecurityRequirement(name = "StudentAuth")
    public ResponseEntity<Result<String>> generateAIRecommendations(
            @Parameter(description = "学生ID", required = true) @RequestParam String studentId) {
        try {
            log.info("学生请求生成AI职位推荐: studentId={}", studentId);

            // 调用CozeAI服务生成推荐
            cozeAIService.generateJobRecommendations(studentId);

            return ResponseEntity.ok(Result.success("AI职位推荐生成成功"));
        } catch (Exception e) {
            log.error("生成AI职位推荐失败: studentId={}", studentId, e);
            return ResponseEntity.ok(Result.fail("生成AI职位推荐失败: " + e.getMessage()));
        }
    }

    // ==================== 前端兼容接口 (pelegant/job-seeker路径) ====================

    /**
     * 收藏职位接口 - 前端兼容路径 (智能切换收藏状态)
     */
    @PostMapping("/pelegant/job-seeker/save-job")
    @Operation(summary = "收藏职位", description = "学生收藏感兴趣的职位 - 前端兼容接口，自动切换收藏状态")
    public ResponseEntity<Result<String>> saveJob(
            @Parameter(description = "学生ID") @RequestParam(required = false) String studentId,
            @Parameter(description = "职位ID", required = true) @RequestParam String jobId,
            HttpServletRequest request) {

        // 如果没有传studentId，从JWT Token中获取
        if (studentId == null || studentId.trim().isEmpty()) {
            studentId = (String) request.getAttribute("userId");
        }

        log.info("学生收藏职位请求(前端兼容): 学生ID={}, 职位ID={}", studentId, jobId);

        // 检查当前收藏状态，智能切换
        Result<Boolean> statusResult = studentService.isJobBookmarked(studentId, jobId);
        if (!statusResult.isSuccess()) {
            return ResponseEntity.ok(Result.fail("检查收藏状态失败"));
        }

        boolean isBookmarked = statusResult.getData();
        Result<String> result;

        if (isBookmarked) {
            // 已收藏，执行取消收藏
            result = studentService.unbookmarkJob(studentId, jobId);
        } else {
            // 未收藏，执行收藏
            result = studentService.bookmarkJob(studentId, jobId, null);
        }

        return ResponseEntity.ok(result);
    }
    @GetMapping("/pelegant/job-seeker/is-saved-batch")
    @Operation(summary = "批量判断职位是否已收藏", description = "判断学生是否已收藏多个职位")
    @SecurityRequirement(name = "StudentAuth")
    public ResponseEntity<Result<Map<String, Boolean>>> isSavedBatch(
            @RequestParam List<String> jobIds,
            HttpServletRequest request) {

        String studentId = (String) request.getAttribute("userId");
        log.info("学生批量判断职位收藏状态请求: 学生ID={}, jobIds={}", studentId, jobIds);

        Result<Map<String, Boolean>> result = studentService.areJobsBookmarked(studentId, jobIds);
        return ResponseEntity.ok(result);
    }



    /**
     * 申请职位接口 - 前端兼容路径
     */
    @PostMapping("/pelegant/job-seeker/apply-job")
    @Operation(summary = "申请职位", description = "学生申请感兴趣的职位 - 前端兼容接口")
    public ResponseEntity<Result<String>> applyJobCompat(
            @Parameter(description = "职位ID", required = true) @RequestParam String jobId,
            HttpServletRequest request) {

        String studentId = (String) request.getAttribute("userId");

        log.info("学生申请职位请求(前端兼容): 学生ID={}, 职位ID={}", studentId, jobId);
        Result<String> result = studentService.applyForJob(studentId, jobId, null);
        return ResponseEntity.ok(result);
    }

    /**
     * 判断职位是否已申请接口 - 前端兼容路径
     */
    @GetMapping("/pelegant/job-seeker/is-applied")
    @Operation(summary = "判断职位是否已申请", description = "判断学生是否已申请某个职位 - 前端兼容接口")
    @SecurityRequirement(name = "StudentAuth")
    public ResponseEntity<Result<Boolean>> isApplied(
            @Parameter(description = "职位ID", required = true) @RequestParam String jobId,
            HttpServletRequest request) {
        String studentId = (String) request.getAttribute("userId");
        log.info("学生判断职位是否已申请请求(前端兼容): 学生ID={}, 职位ID={}", studentId, jobId);
        Result<Boolean> result = studentService.isJobApplied(studentId, jobId);
        return ResponseEntity.ok(result);
    }
    /**
     * 取消职位申请接口 - 前端兼容路径
     */
    @PostMapping("/pelegant/job-seeker/cancel-apply")
    @Operation(summary = "取消职位申请", description = "取消学生已申请的职位 - 前端兼容接口")
    @SecurityRequirement(name = "StudentAuth")
    public ResponseEntity<Result<String>> cancelApply(
            @RequestBody JobRequest jobRequest,
    HttpServletRequest request) {
        String studentId = (String) request.getAttribute("userId");
        String jobId = jobRequest.getJobId();
        log.info("学生取消职位申请请求(前端兼容): 学生ID={}, 职位ID={}", studentId, jobId);
        Result<String> result = studentService.cancelApplyForJob(studentId, jobId);
        return ResponseEntity.ok(result);
    }

    /**
     * 获取所有职位接口 - 前端兼容路径
     */
    @GetMapping("/pelegant/job-seeker/get-all-jobs")
    @Operation(summary = "获取所有职位", description = "获取所有职位 - 前端兼容接口")
    @SecurityRequirement(name = "StudentAuth")
    public ResponseEntity<Result<List<Job>>> getAllJobsCompat(HttpServletRequest request) {
//        String studentId = (String) request.getAttribute("userId");
        Result<List<Job>> result = studentService.getAllJobs();
        return ResponseEntity.ok(result);
    }

    @PostMapping("/forget-password")
    @Operation(summary = "忘记密码", description = "忘记密码")
    public ResponseEntity<Result<String>> forgetPassword(
            @Parameter(description = "邮箱", required = true) @RequestBody Map<String, String> body) {
        String email = body.get("email");  // Extract the email from the request body
        log.info("忘记密码请求: 邮箱={}", email);
        Result<String> result = studentService.forgetPasswordEmail(email);
        return ResponseEntity.ok(result);
    }

    /**
     * 用户点击链接访问页面（可以用前端渲染，这里直接接口示例）
     */
    @GetMapping("/validate-token")
    public Result<String> validateToken(@RequestParam String token) {
        return studentService.validateToken(token);
    }

    /**
     * 提交新密码
     */
    @PostMapping("/reset-password")
    public Result<String> resetPassword(@RequestParam String token,
                                        @RequestParam String newPassword,
                                        @RequestParam String confirmPassword) {
            return studentService.resetstudentPassword(token, newPassword, confirmPassword);
    }

}