package com.x.pelegant.interceptor;

import com.x.pelegant.config.JwtConfig;
import com.x.pelegant.exception.JwtException;
import com.x.pelegant.util.JwtUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 * JWT拦截器
 * 根据不同的请求头验证不同角色的JWT Token
 */
@Component
@Slf4j
public class JwtInterceptor implements HandlerInterceptor {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private JwtConfig jwtConfig;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws Exception {
        String requestURI = request.getRequestURI();
        String method = request.getMethod();

        log.debug("JWT拦截器处理请求: {} {}", method, requestURI);

        // 跳过OPTIONS请求（预检请求）
        if ("OPTIONS".equalsIgnoreCase(method)) {
            return true;
        }

        // 跳过登录接口
        if (isLoginPath(requestURI)) {
            log.debug("跳过登录接口: {}", requestURI);
            return true;
        }

        // 跳过公共接口（如Swagger文档等）
        if (isPublicPath(requestURI)) {
            log.debug("跳过公共接口: {}", requestURI);
            return true;
        }

        // 确定期望的角色和对应的请求头
        String expectedRole = determineExpectedRole(requestURI);
        String headerName = getHeaderNameByRole(expectedRole);

        if (expectedRole == null || headerName == null) {
            log.warn("无法确定请求路径的角色: {}", requestURI);
            throw new JwtException.UnauthorizedException("无法确定访问权限");
        }

        // 从对应的请求头获取Token
        String authHeader = request.getHeader(headerName);
        if (authHeader == null || authHeader.trim().isEmpty()) {
            log.warn("缺少认证头 [{}] 在请求: {}", headerName, requestURI);
            throw new JwtException.TokenMissingException("缺少认证Token: " + headerName);
        }

        // 提取Token
        String token = jwtUtil.extractToken(authHeader);
        if (token == null || token.trim().isEmpty()) {
            log.warn("Token为空，请求头: {}, 请求路径: {}", headerName, requestURI);
            throw new JwtException.InvalidTokenException("Token格式无效");
        }

        // 验证Token有效性
        if (!jwtUtil.validateToken(token)) {
            log.warn("Token验证失败，请求头: {}, 请求路径: {}", headerName, requestURI);
            throw new JwtException.InvalidTokenException("Token无效或已过期");
        }

        // 验证Token角色是否匹配
        if (!jwtUtil.validateTokenRole(token, expectedRole)) {
            String actualRole = jwtUtil.getRoleFromToken(token);
            log.warn("角色不匹配，期望: {}, 实际: {}, 请求路径: {}", expectedRole, actualRole, requestURI);
            throw new JwtException.RoleMismatchException("权限不足，无法访问该资源");
        }

        // 将用户信息添加到请求属性中，供Controller使用
        String userId = jwtUtil.getUserIdFromToken(token);
        String username = jwtUtil.getUsernameFromToken(token);
        request.setAttribute("userId", userId);
        request.setAttribute("username", username);
        request.setAttribute("role", expectedRole);

        log.debug("JWT验证成功，用户: {}, 角色: {}, 请求: {}", username, expectedRole, requestURI);
        return true;
    }

    /**
     * 判断是否为登录路径
     */
    private boolean isLoginPath(String requestURI) {
        return requestURI.endsWith("/login");
    }

    /**
     * 判断是否为公共路径
     */
    private boolean isPublicPath(String requestURI) {
        String[] publicPaths = {
                "/swagger-ui",
                "/v3/api-docs",
                "/doc.html",
                "/webjars",
                "/favicon.ico",
                "/error"
        };

        for (String path : publicPaths) {
            if (requestURI.contains(path)) {
                return true;
            }
        }
        return false;
    }

    /**
     * 根据请求路径确定期望的角色
     */
    private String determineExpectedRole(String requestURI) {
        // 学生相关路径
        if (requestURI.startsWith("/api/students") ||
                requestURI.startsWith("/api/pelegant/job-seeker") ||
                requestURI.startsWith("/api/pelegant/jd") ||
                requestURI.startsWith("/api/pelegant/recommended-work")) {
            return JwtConfig.UserRole.STUDENT.getValue();
        }
        // 教师相关路径
        else if (requestURI.startsWith("/api/teachers")) {
            return JwtConfig.UserRole.TEACHER.getValue();
        }
        // 项目管理员相关路径
        else if (requestURI.startsWith("/api/projects")) {
            return JwtConfig.UserRole.PROJECT.getValue();
        }
        return null;
    }

    /**
     * 根据角色获取对应的请求头名称
     */
    private String getHeaderNameByRole(String role) {
        if (JwtConfig.UserRole.STUDENT.getValue().equals(role)) {
            return jwtConfig.getStudentHeader();
        } else if (JwtConfig.UserRole.TEACHER.getValue().equals(role)) {
            return jwtConfig.getTeacherHeader();
        } else if (JwtConfig.UserRole.PROJECT.getValue().equals(role)) {
            return jwtConfig.getProjectHeader();
        }
        return null;
    }
}
