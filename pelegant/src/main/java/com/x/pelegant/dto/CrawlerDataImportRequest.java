package com.x.pelegant.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 爬虫数据导入请求DTO
 */
@Data
public class CrawlerDataImportRequest {

    /**
     * 数据类型/来源标识
     * 例如：job_data, company_data, news_data等
     */
    @NotBlank(message = "数据类型不能为空")
    private String dataType;

    /**
     * 爬虫标识/名称
     */
    @NotBlank(message = "爬虫名称不能为空")
    private String crawlerName;

    /**
     * 数据源URL（可选）
     */
    private String sourceUrl;

    /**
     * 批次ID（可选，用于标识同一批次的数据）
     */
    private String batchId;

    /**
     * 数据创建时间（爬虫采集时间，可选）
     */
    private LocalDateTime dataCreateTime;

    /**
     * 单条数据导入
     */
    private Map<String, Object> data;

    /**
     * 批量数据导入
     */
    private List<Map<String, Object>> dataList;

    /**
     * 额外的元数据信息（可选）
     */
    private Map<String, Object> metadata;

    /**
     * 是否覆盖已存在的数据（基于某个唯一标识）
     */
    private Boolean overwrite = false;

    /**
     * 唯一标识字段名（用于去重，可选）
     */
    private String uniqueField;

    private Boolean performBatchCleanup;
}
