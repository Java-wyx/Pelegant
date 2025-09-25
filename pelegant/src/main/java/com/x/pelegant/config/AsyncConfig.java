package com.x.pelegant.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.aop.interceptor.AsyncUncaughtExceptionHandler;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.AsyncConfigurer;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import javax.annotation.PreDestroy;
import java.util.concurrent.Executor;
import java.util.concurrent.TimeUnit;

@Configuration
public class AsyncConfig implements AsyncConfigurer {
    private static final Logger logger = LoggerFactory.getLogger(AsyncConfig.class);

    private ThreadPoolTaskExecutor executor;

    @Override
    public Executor getAsyncExecutor() {
        executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(10);
        executor.setMaxPoolSize(50);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("AsyncThread-");
        executor.initialize();
        return executor;
    }

    @Override
    public AsyncUncaughtExceptionHandler getAsyncUncaughtExceptionHandler() {
        return (ex, method, params) -> logger.error("异步方法 {} 执行失败: {}", method.getName(), ex.getMessage(), ex);
    }

    /**
     * 应用关闭时清理异步执行器
     */
    @PreDestroy
    public void shutdown() {
        if (executor != null) {
            logger.info("正在关闭异步执行器...");
            executor.shutdown();
            try {
                if (!executor.getThreadPoolExecutor().awaitTermination(60, TimeUnit.SECONDS)) {
                    logger.warn("异步执行器未能在60秒内关闭，强制关闭...");
                    executor.getThreadPoolExecutor().shutdownNow();
                    if (!executor.getThreadPoolExecutor().awaitTermination(60, TimeUnit.SECONDS)) {
                        logger.error("异步执行器未能关闭");
                    }
                }
            } catch (InterruptedException e) {
                logger.error("关闭异步执行器时被中断", e);
                executor.getThreadPoolExecutor().shutdownNow();
                Thread.currentThread().interrupt();
            }
            logger.info("异步执行器已关闭");
        }
    }
}
