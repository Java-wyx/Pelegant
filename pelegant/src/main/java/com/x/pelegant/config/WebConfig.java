/*
 * @Author: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @Date: 2025-07-04 14:28:12
 * @LastEditors: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @LastEditTime: 2025-07-04 15:30:44
 * @FilePath: \新建文件夹\Pelegant\src\main\java\com\x\pelegant\config\WebConfig.java
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
package com.x.pelegant.config;

import com.x.pelegant.interceptor.JwtInterceptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Web配置类
 * 配置拦截器和其他Web相关设置
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Autowired
    private JwtInterceptor jwtInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(jwtInterceptor)
                // 拦截所有API请求
                .addPathPatterns("/api/**")
                // 排除登录接口
                .excludePathPatterns(
                        "/api/students/login-json",
                        "/api/teachers/login-json",
                        "/api/projects/login-json")
                // 排除公共接口
                .excludePathPatterns(
                        "/swagger-ui/**",
                        "/v3/api-docs/**",
                        "/doc.html",
                        "/webjars/**",
                        "/favicon.ico",
                        "/error",
                        "/api/files/**",
                        "/page/**",
                        "/api/teachers/reset-password",
                        "/api/students/reset-password",
                        "/api/students/validate-token",
                        "/api/students/forget-password",
                        "/api/teachers/validate-token",
                        "/api/projects/jobandcompany/all",
                        "/api/projects/crawler-data/import",
                        "/api/projects/deduplicate",
                        "/api/projects/job-csv-export",
                        "/api/projects/import/companies",
                        "/api/python/**");
    }
}
