package com.x.pelegant.dto;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.ArrayList;

/**
 * 学校管理员密码重置响应DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SchoolPasswordResetResponse {

    /**
     * 成功重置的学校数量
     */
    private int successCount = 0;

    /**
     * 失败的学校数量
     */
    private int failureCount = 0;

    /**
     * 成功重置的学校详情列表
     */
    private List<SchoolPasswordResetDetail> successDetails = new ArrayList<>();

    /**
     * 失败的学校详情列表
     */
    private List<SchoolPasswordResetDetail> failureDetails = new ArrayList<>();

    /**
     * 邮件发送成功数量
     */
    private int emailSuccessCount = 0;

    /**
     * 邮件发送失败数量
     */
    private int emailFailureCount = 0;

    /**
     * 学校密码重置详情
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SchoolPasswordResetDetail {
        /**
         * 学校ID
         */
        private String schoolId;

        /**
         * 学校名称
         */
        private String schoolName;

        /**
         * 管理员邮箱
         */
        private String adminEmail;

        /**
         * 新密码（仅在成功时返回）
         */
        private String newPassword;

        /**
         * 错误信息（仅在失败时返回）
         */
        private String errorMessage;

        /**
         * 邮件发送状态
         */
        private boolean emailSent = false;
    }

    /**
     * 添加成功的重置记录
     */
    public void addSuccess(String schoolId, String schoolName, String adminEmail, String newPassword, boolean emailSent) {
        SchoolPasswordResetDetail detail = new SchoolPasswordResetDetail();
        detail.setSchoolId(schoolId);
        detail.setSchoolName(schoolName);
        detail.setAdminEmail(adminEmail);
        detail.setNewPassword(newPassword);
        detail.setEmailSent(emailSent);

        successDetails.add(detail);
        successCount++;

        if (emailSent) {
            emailSuccessCount++;
        } else {
            emailFailureCount++;
        }
    }

    /**
     * 添加失败的重置记录
     */
    public void addFailure(String schoolId, String schoolName, String adminEmail, String errorMessage) {
        SchoolPasswordResetDetail detail = new SchoolPasswordResetDetail();
        detail.setSchoolId(schoolId);
        detail.setSchoolName(schoolName);
        detail.setAdminEmail(adminEmail);
        detail.setErrorMessage(errorMessage);
        detail.setEmailSent(false);

        failureDetails.add(detail);
        failureCount++;
        emailFailureCount++;
    }

    /**
     * 获取总处理数量
     */
    public int getTotalCount() {
        return successCount + failureCount;
    }

    /**
     * 是否全部成功
     */
    public boolean isAllSuccess() {
        return failureCount == 0 && successCount > 0;
    }

    /**
     * 是否有部分成功
     */
    public boolean isPartialSuccess() {
        return successCount > 0 && failureCount > 0;
    }
}
