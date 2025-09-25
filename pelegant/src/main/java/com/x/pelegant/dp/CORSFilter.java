
package com.x.pelegant.dp;

import javax.servlet.*;
import javax.servlet.annotation.WebFilter;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

/**
 * 跨域资源共享(CORS)过滤器
 * 简化版本，允许所有来源的跨域请求
 */
@WebFilter("/*")
public class CORSFilter implements Filter {

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
        System.out.println("CORS过滤器初始化");
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResp = (HttpServletResponse) response;

        // 获取请求来源
        String origin = httpRequest.getHeader("Origin");

        // 简单记录请求信息
        System.out.println("收到请求: " + httpRequest.getMethod() + " " + httpRequest.getRequestURI());

        // 允许所有来源访问
        if (origin != null) {
            httpResp.setHeader("Access-Control-Allow-Origin", origin);
        } else {
            httpResp.setHeader("Access-Control-Allow-Origin", "*");
        }

        // 设置基本CORS头
        httpResp.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        httpResp.setHeader("Access-Control-Allow-Headers",
                "Content-Type, Authorization, X-Requested-With, student, teacher, project");
        httpResp.setHeader("Access-Control-Allow-Credentials", "true");
        httpResp.setHeader("Access-Control-Max-Age", "3600");

        // 处理预检请求
        if ("OPTIONS".equalsIgnoreCase(httpRequest.getMethod())) {
            httpResp.setStatus(HttpServletResponse.SC_OK);
            return;
        }

        // 继续过滤器链
        chain.doFilter(request, response);
    }

    @Override
    public void destroy() {
        System.out.println("CORS过滤器销毁");
    }
}
