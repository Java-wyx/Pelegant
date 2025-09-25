package com.x.pelegant.dto;

import lombok.Data;
import java.util.List;

@Data
public class CrawlerDataResponse {
    private Boolean success;
    private String message;
    private List<CrawlerDataDTO> data;
    private Integer total;
}