package com.x.pelegant.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TaskResult {
    private String crawlerDataResult;
    private String migrationResult;
    private String totalRecords;
    private String duration;
    private Map<String, Object> detailedResults; // 新增详细结果字段

    // 可以添加更多字段，如：
    private Integer jobsMigrated;
    private Integer passJobsMigrated;
    private Integer duplicatesFound;
    private Integer errors;
    private List<String> errorDetails;
}