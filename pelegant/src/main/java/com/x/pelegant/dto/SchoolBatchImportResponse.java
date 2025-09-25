package com.x.pelegant.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 学校批量导入响应DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SchoolBatchImportResponse {

    /**
     * 总处理数量
     */
    private int totalCount;

    /**
     * 成功导入数量
     */
    private int successCount;

    /**
     * 失败数量
     */
    private int failCount;

    /**
     * 错误信息列表
     */
    private List<String> errorMessages;

    /**
     * 成功导入的学校ID列表
     */
    private List<String> successSchoolIds;
}
