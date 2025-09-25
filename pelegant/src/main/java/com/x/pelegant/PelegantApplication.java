package com.x.pelegant;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.web.servlet.ServletComponentScan;
import org.springframework.data.mongodb.config.EnableMongoAuditing;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@ServletComponentScan // 添加此注解以确保WebFilter生效
@EnableMongoAuditing // 启用MongoDB审计功能（自动设置创建时间、修改时间等）
@Slf4j
@EnableAsync
public class PelegantApplication {

    public static void main(String[] args) {

        // 启动Spring Boot应用程序
        SpringApplication.run(PelegantApplication.class, args);
        // 输出启动成功信息
        System.out.println("boot启动成功");
        // 输出swagger文档地址
        log.info("swagger文档地址 http://localhost:8080/doc.html");
        // 输出CORS配置信息
        log.info("已启用CORS配置，允许跨域访问");
        // 输出MongoDB配置信息
        log.info("MongoDB数据库配置完成，数据库名称: Pelegant");
    }


}
