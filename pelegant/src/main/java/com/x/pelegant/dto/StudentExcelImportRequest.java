package com.x.pelegant.dto;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

/**
 * 学生Excel导入数据DTO
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class StudentExcelImportRequest {

    /**
     * 学生姓名
     */
    private String fullName;

    /**
     * 学号
     */
    private String studentId;

    /**
     * 邮箱
     */
    private String email;

    /**
     * 专业
     */
    private String major;

    /**
     * 年级（如：大一、大二、大三、大四）
     */
    private String grade;

    /**
     * 行号（用于错误提示）
     */
    private int rowNumber;

    private String studentType;


    /**
     * 验证数据是否完整
     */
    public boolean isValid() {
        return fullName != null && !fullName.trim().isEmpty() &&
                email != null && !email.trim().isEmpty() &&
                major != null && !major.trim().isEmpty() &&
                grade != null && !grade.trim().isEmpty();
    }

    /**
     * 获取验证错误信息
     */
    public String getValidationError() {
        if (fullName == null || fullName.trim().isEmpty()) {
            return "姓名不能为空";
        }

        if (email == null || email.trim().isEmpty()) {
            return "邮箱不能为空";
        }
        if (major == null || major.trim().isEmpty()) {
            return "专业不能为空";
        }
        if (grade == null || grade.trim().isEmpty()) {
            return "年级不能为空";
        }
        return null;
    }

    /**
     * 根据年级字符串计算入学年份
     */
    public Integer calculateEnrollmentYear() {
        if (grade == null) {
            return null;
        }

        int currentYear = java.time.Year.now().getValue();

        switch (grade.trim()) {
            case "大一":
                return currentYear;
            case "大二":
                return currentYear - 1;
            case "大三":
                return currentYear - 2;
            case "大四":
                return currentYear - 3;
            case "研一":
            case "研究生一年级":
                return currentYear;
            case "研二":
            case "研究生二年级":
                return currentYear - 1;
            case "研三":
            case "研究生三年级":
                return currentYear - 2;
            default:
                // 如果是数字年份，直接使用
                try {
                    return Integer.parseInt(grade.trim());
                } catch (NumberFormatException e) {
                    return null;
                }
        }
    }
}
