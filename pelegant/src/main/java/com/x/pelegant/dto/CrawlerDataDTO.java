package com.x.pelegant.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class CrawlerDataDTO {
    private String id;
    private String dataType;
    private String sourceUrl;
    private String crawlerName;
    private RawDataDTO rawData;
    private String status;
    private String processMessage;
    private LocalDateTime dataCreateTime;
    private LocalDateTime importTime;
    private LocalDateTime processTime;
    private String batchId;
    private MetadataDTO metadata;
}