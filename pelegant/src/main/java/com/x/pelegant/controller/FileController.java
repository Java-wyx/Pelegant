package com.x.pelegant.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.annotation.PostConstruct;
import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * 文件访问控制器
 */
@RestController
@RequestMapping("/api/files")
@Tag(name = "文件访问", description = "文件访问相关接口")
@Slf4j
public class FileController {
    @Value("${pelegant.upload.path}")
    private String uploadPath;

    // 简历文件存储路径
    private String RESUME_UPLOAD_PATH;

    // 头像文件存储路径
    private String AVATAR_UPLOAD_PATH;

    @PostConstruct
    public void init() {
        RESUME_UPLOAD_PATH = uploadPath + "resumes/";
        AVATAR_UPLOAD_PATH = uploadPath + "avatars";
        log.info("Upload Path: {}", uploadPath);
        log.info("Resume Upload Path: {}", RESUME_UPLOAD_PATH);
        log.info("Avatar Upload Path: {}", AVATAR_UPLOAD_PATH);
    }

    /**
     * 访问简历文件
     */
    @GetMapping("/uploads/resumes/{studentId}/{fileName}")
    @Operation(summary = "访问简历文件", description = "访问上传的简历PDF文件")
    public ResponseEntity<Resource> getResumeFile(
            @Parameter(description = "学生ID", required = true) @PathVariable String studentId,
            @Parameter(description = "文件名", required = true) @PathVariable String fileName) {

        try {
            log.info("访问简历文件: studentId={}, fileName={}", studentId, fileName);

            // 构建文件路径
            Path file = Paths.get(RESUME_UPLOAD_PATH, studentId, fileName);

            // 检查文件是否存在
            if (!Files.exists(file)) {
                log.warn("简历文件不存在: {}", file);
                return ResponseEntity.notFound().build();
            }

            if (!Files.isRegularFile(file)) {
                log.warn("不是有效的简历文件: {}", file);
                return ResponseEntity.badRequest().build();
            }

            Resource resource = new FileSystemResource(file);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.add(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileName + "\"");

            log.info("成功访问简历文件: {}", file);

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(resource);

        } catch (Exception e) {
            log.error("访问简历文件失败", e);
            return ResponseEntity.internalServerError().build();
        }
    }


    /**
     * 访问头像文件
     */
    @GetMapping("/uploads/avatars/{fileName}")
    @Operation(summary = "访问头像文件", description = "访问上传的头像文件")
    public ResponseEntity<Resource> getAvatarFile(
            @Parameter(description = "文件名", required = true) @PathVariable String fileName) {

        try {
            log.info("访问头像文件: {}", fileName);

            // 使用 Paths.get() 来拼接路径，自动处理操作系统路径分隔符
            Path file = Paths.get(AVATAR_UPLOAD_PATH, fileName);

            // 检查文件是否存在
            if (!Files.exists(file)) {
                log.warn("头像文件不存在: {}", file);
                return ResponseEntity.notFound().build();
            }

            // 检查是否是文件
            if (!Files.isRegularFile(file)) {
                log.warn("不是有效的头像文件: {}", file);
                return ResponseEntity.badRequest().build();
            }

            // 创建资源
            Resource resource = new FileSystemResource(file);

            // 确定内容类型
            String contentType = "image/jpeg"; // 默认
            String fileNameLower = fileName.toLowerCase();
            if (fileNameLower.endsWith(".png")) {
                contentType = "image/png";
            } else if (fileNameLower.endsWith(".gif")) {
                contentType = "image/gif";
            }

            // 设置响应头
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(contentType));

            log.info("成功访问头像文件: {}", file);

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(resource);

        } catch (Exception e) {
            log.error("访问头像文件失败: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }


}
