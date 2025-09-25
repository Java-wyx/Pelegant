package com.x.pelegant.dto;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.ArrayList;

/**
 * 学生批量导入结果响应DTO
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class StudentBatchImportResponse {

    /**
     * 总处理行数
     */
    private int totalRows;

    /**
     * 成功导入数量
     */
    private int successCount;

    /**
     * 失败数量
     */
    private int failureCount;

    /**
     * 错误详情列表
     */
    private List<ImportError> errors = new ArrayList<>();

    /**
     * 导入错误详情
     */
    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ImportError {
        /**
         * 行号
         */
        private int rowNumber;

        /**
         * 学生姓名
         */
        private String fullName;

        /**
         * 学号
         */
        private String studentId;

        /**
         * 错误信息
         */
        private String errorMessage;
    }

    /**
     * 添加错误信息
     */
    public void addError(int rowNumber, String fullName, String studentId, String errorMessage) {
        this.errors.add(new ImportError(rowNumber, fullName, studentId, errorMessage));
        this.failureCount++;
    }

    /**
     * 增加成功计数
     */
    public void incrementSuccess() {
        this.successCount++;
    }

    /**
     * 设置总行数
     */
    public void setTotalRows(int totalRows) {
        this.totalRows = totalRows;
    }

    /**
     * 是否有错误
     */
    public boolean hasErrors() {
        return !errors.isEmpty();
    }

    /**
     * 获取导入摘要信息
     */
    public String getSummary() {
        return String.format("总计处理 %d 行，成功导入 %d 个学生，失败 %d 个",
                totalRows, successCount, failureCount);
    }
}
