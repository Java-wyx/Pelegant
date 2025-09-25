package com.x.pelegant.entity;

import lombok.Data;
import lombok.EqualsAndHashCode;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * 爬虫数据实体类
 * 用于存储爬虫传过来的通用数据
 */
@Data
@EqualsAndHashCode(callSuper = false)
@Document(collection = "crawler_data")
public class CrawlerData {

    /**
     * 主键ID
     */
    @Id
    private String id;

    /**
     * 数据类型/来源标识
     */
    @Field("dataType")
    private String dataType;

    /**
     * 数据源URL
     */
    @Field("sourceUrl")
    private String sourceUrl;

    /**
     * 爬虫标识/名称
     */
    @Field("crawlerName")
    private String crawlerName;

    /**
     * 原始JSON数据
     * 存储爬虫传过来的完整JSON数据
     */
    @Field("rawData")
    private Map<String, Object> rawData;

    /**
     * 数据状态：pending-待处理，processed-已处理，failed-处理失败
     */
    @Field("status")
    private String status = "pending";

    /**
     * 处理结果消息
     */
    @Field("processMessage")
    private String processMessage;

    /**
     * 数据创建时间（爬虫采集时间）
     */
    @Field("dataCreateTime")
    private LocalDateTime dataCreateTime;

    /**
     * 数据导入时间（接口接收时间）
     */
    @Field("importTime")
    private LocalDateTime importTime;

    /**
     * 数据处理时间
     */
    @Field("processTime")
    private LocalDateTime processTime;

    /**
     * 数据版本/批次号
     */
    @Field("batchId")
    private String batchId;

    /**
     * 额外的元数据信息
     */
    @Field("metadata")
    private Map<String, Object> metadata;


    @Field("logoImage")
    private String logoImage;


}
