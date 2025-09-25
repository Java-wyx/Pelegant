package com.x.pelegant.exception;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.x.pelegant.common.Result;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

/**
 * 全局异常处理器
 */
@RestControllerAdvice
@Slf4j

@ControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * 处理JWT Token无效异常
     */
    @ExceptionHandler(JwtException.InvalidTokenException.class)
    public ResponseEntity<Result<String>> handleInvalidTokenException(JwtException.InvalidTokenException e) {
        log.error("JWT Token无效: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Result.fail("Token无效，请重新登录"));
    }

    /**
     * 处理JWT Token过期异常
     */
    @ExceptionHandler(JwtException.TokenExpiredException.class)
    public ResponseEntity<Result<String>> handleTokenExpiredException(JwtException.TokenExpiredException e) {
        log.error("JWT Token过期: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Result.fail("Token已过期，请重新登录"));
    }

    /**
     * 处理JWT Token缺失异常
     */
    @ExceptionHandler(JwtException.TokenMissingException.class)
    public ResponseEntity<Result<String>> handleTokenMissingException(JwtException.TokenMissingException e) {
        log.error("JWT Token缺失: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Result.fail("缺少认证Token，请先登录"));
    }

    /**
     * 处理JWT角色不匹配异常
     */
    @ExceptionHandler(JwtException.RoleMismatchException.class)
    public ResponseEntity<Result<String>> handleRoleMismatchException(JwtException.RoleMismatchException e) {
        log.error("JWT角色不匹配: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Result.fail("权限不足，无法访问该资源"));
    }

    /**
     * 处理JWT未授权异常
     */
    @ExceptionHandler(JwtException.UnauthorizedException.class)
    public ResponseEntity<Result<String>> handleUnauthorizedException(JwtException.UnauthorizedException e) {
        log.error("JWT未授权: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Result.fail("未授权访问，请先登录"));
    }

    /**
     * 处理通用JWT异常
     */
    @ExceptionHandler(JwtException.class)
    public ResponseEntity<Result<String>> handleJwtException(JwtException e) {
        log.error("JWT异常: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Result.fail("认证失败: " + e.getMessage()));
    }

    /**
     * 处理通用异常
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Result<String>> handleException(Exception e) {
        log.error("系统异常: {}", e.getMessage(), e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Result.fail("系统内部错误"));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, String>> handleHttpMessageNotReadable(HttpMessageNotReadableException ex) {
        Map<String, String> response = new HashMap<>();
        if (ex.getCause() instanceof org.apache.catalina.connector.ClientAbortException) {
            logger.warn("客户端中断请求: {}", ex.getMessage());
            response.put("error", "请求被客户端中断，请检查网络或请求数据");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
        logger.error("JSON 解析错误: {}", ex.getMessage(), ex);
        response.put("error", "无效的 JSON 输入");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(JsonProcessingException.class)
    public ResponseEntity<Map<String, String>> handleJsonProcessingException(JsonProcessingException ex) {
        logger.error("JSON 处理错误: {}", ex.getMessage(), ex);
        Map<String, String> response = new HashMap<>();
        response.put("error", "JSON 处理失败: " + ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }
}
