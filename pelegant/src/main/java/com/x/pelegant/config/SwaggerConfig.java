package com.x.pelegant.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Pelegant API")
                        .description("Pelegant 项目接口文档 - 支持JWT Token认证")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("Pelegant Team")
                                .url("http://127.0.0.1:8080")
                                .email("support@pelegant.com"))
                        .license(new License()
                                .name("Apache 2.0")
                                .url("http://www.apache.org/licenses/LICENSE-2.0.html")))
                .components(new Components()
                        // 学生Token认证
                        .addSecuritySchemes("StudentAuth", new SecurityScheme()
                                .type(SecurityScheme.Type.APIKEY)
                                .in(SecurityScheme.In.HEADER)
                                .name("student")
                                .description("学生JWT Token认证，格式：Bearer <token>"))
                        // 教师Token认证
                        .addSecuritySchemes("TeacherAuth", new SecurityScheme()
                                .type(SecurityScheme.Type.APIKEY)
                                .in(SecurityScheme.In.HEADER)
                                .name("teacher")
                                .description("教师JWT Token认证，格式：Bearer <token>"))
                        // 项目管理员Token认证
                        .addSecuritySchemes("ProjectAuth", new SecurityScheme()
                                .type(SecurityScheme.Type.APIKEY)
                                .in(SecurityScheme.In.HEADER)
                                .name("project")
                                .description("项目管理员JWT Token认证，格式：Bearer <token>")));
    }
}
