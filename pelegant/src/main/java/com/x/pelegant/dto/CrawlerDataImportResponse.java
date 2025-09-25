package com.x.pelegant.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 爬虫数据导入响应DTO
 */
@Data
public class CrawlerDataImportResponse {

    /**
     * 导入是否成功
     */
    private Boolean success;

    /**
     * 响应消息
     */
    private String message;

    /**
     * 成功导入的数据条数
     */
    private Integer successCount;

    /**
     * 失败的数据条数
     */
    private Integer failedCount;

    /**
     * 总数据条数
     */
    private Integer totalCount;

    /**
     * 批次ID
     */
    private String batchId;

    /**
     * 导入时间
     */
    private LocalDateTime importTime;

    /**
     * 导入的数据ID列表
     */
    private List<String> importedIds;

    /**
     * 失败的数据详情
     */
    private List<FailedDataInfo> failedData;

    /**
     * 失败数据信息
     */
    @Data
    public static class FailedDataInfo {
        /**
         * 数据索引
         */
        private Integer index;

        /**
         * 失败原因
         */
        private String reason;

        /**
         * 原始数据
         */
        private Object data;
    }

    /**
     * 创建成功响应
     */
    public static CrawlerDataImportResponse success(String message, Integer successCount, Integer totalCount, String batchId, List<String> importedIds) {
        CrawlerDataImportResponse response = new CrawlerDataImportResponse();
        response.setSuccess(true);
        response.setMessage(message);
        response.setSuccessCount(successCount);
        response.setFailedCount(totalCount - successCount);
        response.setTotalCount(totalCount);
        response.setBatchId(batchId);
        response.setImportTime(LocalDateTime.now());
        response.setImportedIds(importedIds);
        return response;
    }

    /**
     * 创建失败响应
     */
    public static CrawlerDataImportResponse failure(String message) {
        CrawlerDataImportResponse response = new CrawlerDataImportResponse();
        response.setSuccess(false);
        response.setMessage(message);
        response.setSuccessCount(0);
        response.setFailedCount(0);
        response.setTotalCount(0);
        response.setImportTime(LocalDateTime.now());
        return response;
    }
}
